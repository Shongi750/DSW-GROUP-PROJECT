-- ===========================================================================
-- 2026-10-08 (part D2): moderation workflow. Safe to re-run.
-- Also included at the end of supabase/schema.sql.
-- Run after 2026-10-08-security.sql.
--   - reports get a status (open / resolved / dismissed) + who handled them
--   - Campus Admin can delete a reported group / direct message
--   - Campus Admin can suspend a student (profiles.suspended); suspended
--     students can't post in groups, DMs or the community feed
--   - every admin action is written to moderation_actions
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 11a) Report status
-- ---------------------------------------------------------------------------
alter table public.chat_reports add column if not exists status text not null default 'open';
alter table public.chat_reports add column if not exists resolved_by uuid references auth.users (id) on delete set null;
alter table public.chat_reports add column if not exists resolved_at timestamptz;

do $$
begin
  alter table public.chat_reports
    add constraint chat_reports_status_check
    check (status in ('open', 'resolved', 'dismissed'));
exception
  when duplicate_object then null;
end $$;

create index if not exists chat_reports_status_idx on public.chat_reports (status, created_at desc);

-- New reports always start open; the reported name comes from the profile.
create or replace function public.chat_report_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.reporter_id := auth.uid();
  new.status := 'open';
  new.resolved_by := null;
  new.resolved_at := null;
  if new.reported_user_id is not null then
    new.reported_name := public.profile_display_name(new.reported_user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists chat_report_guard on public.chat_reports;
create trigger chat_report_guard
  before insert on public.chat_reports
  for each row
  execute function public.chat_report_guard();

-- ---------------------------------------------------------------------------
-- 11b) Admin action log (admins read it; only the functions below write it)
-- ---------------------------------------------------------------------------
create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_user_id uuid references auth.users (id) on delete set null,
  target_table text not null default '',
  target_id text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.moderation_actions enable row level security;

drop policy if exists "admins read moderation log" on public.moderation_actions;
create policy "admins read moderation log" on public.moderation_actions
  for select to authenticated
  using (public.is_campus_admin());

-- ---------------------------------------------------------------------------
-- 11c) Suspension flag on profiles. Only admin_set_suspended() can change it.
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists suspended boolean not null default false;
alter table public.profiles add column if not exists suspended_reason text not null default '';
alter table public.profiles add column if not exists suspended_at timestamptz;

-- The app saves the whole profile row, so quietly keep the suspension columns
-- as they are unless the change comes from admin_set_suspended().
create or replace function public.protect_profile_suspension()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(current_setting('ufitness.admin_action', true), '') = 'on' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.suspended := false;
    new.suspended_reason := '';
    new.suspended_at := null;
  else
    new.suspended := old.suspended;
    new.suspended_reason := old.suspended_reason;
    new.suspended_at := old.suspended_at;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_suspension on public.profiles;
create trigger protect_profile_suspension
  before insert or update on public.profiles
  for each row
  execute function public.protect_profile_suspension();

-- Used by the RLS policies below and by the app (rpc('is_suspended')).
create or replace function public.is_suspended()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.suspended from public.profiles p where p.id = auth.uid()), false);
$$;

revoke all on function public.is_suspended() from public, anon;
grant execute on function public.is_suspended() to authenticated;

-- ---------------------------------------------------------------------------
-- 11d) Suspended students can't post (RLS)
-- ---------------------------------------------------------------------------
drop policy if exists "members send messages" on public.group_messages;
create policy "members send messages" on public.group_messages
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and public.is_group_member(group_id)
    and char_length(body) <= 1000
    and not public.is_suspended()
  );

drop policy if exists "dm send" on public.direct_messages;
create policy "dm send" on public.direct_messages
  for insert to authenticated
  with check (
    auth.uid() = from_id
    and from_id <> to_id
    and char_length(body) <= 1000
    and not public.is_suspended()
  );

-- Community posts are saved in the communityState doc. Other docs (meals,
-- workouts, reminders) keep working so a suspended student still has their data.
drop policy if exists "own docs" on public.user_docs;
drop policy if exists "own docs read" on public.user_docs;
drop policy if exists "own docs insert" on public.user_docs;
drop policy if exists "own docs update" on public.user_docs;
drop policy if exists "own docs delete" on public.user_docs;

create policy "own docs read" on public.user_docs
  for select to authenticated
  using (auth.uid() = user_id);

create policy "own docs insert" on public.user_docs
  for insert to authenticated
  with check (auth.uid() = user_id and (doc <> 'communityState' or not public.is_suspended()));

create policy "own docs update" on public.user_docs
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and (doc <> 'communityState' or not public.is_suspended()));

create policy "own docs delete" on public.user_docs
  for delete to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 11e) Admin functions
-- ---------------------------------------------------------------------------

-- Resolve or dismiss a report.
create or replace function public.admin_resolve_report(p_report_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_campus_admin() then
    raise exception 'only Campus Admin can handle reports';
  end if;
  if p_status not in ('resolved', 'dismissed', 'open') then
    raise exception 'status must be resolved, dismissed or open';
  end if;

  update public.chat_reports
    set status = p_status,
        resolved_by = case when p_status = 'open' then null else auth.uid() end,
        resolved_at = case when p_status = 'open' then null else now() end
    where id = p_report_id;
  if not found then
    raise exception 'report not found';
  end if;

  insert into public.moderation_actions (admin_id, action, target_table, target_id)
  values (auth.uid(), 'report_' || p_status, 'chat_reports', p_report_id::text);
end;
$$;

-- Delete a group or direct message. Open reports about it are marked resolved.
create or replace function public.admin_delete_message(p_table text, p_message_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  author uuid;
begin
  if not public.is_campus_admin() then
    raise exception 'only Campus Admin can delete messages';
  end if;

  if p_table = 'group_messages' then
    delete from public.group_messages where id = p_message_id returning user_id into author;
  elsif p_table = 'direct_messages' then
    delete from public.direct_messages where id = p_message_id returning from_id into author;
  else
    raise exception 'only group or direct messages can be deleted';
  end if;

  update public.chat_reports
    set status = 'resolved', resolved_by = auth.uid(), resolved_at = now()
    where message_table = p_table and message_id = p_message_id::text and status = 'open';

  insert into public.moderation_actions (admin_id, action, target_user_id, target_table, target_id)
  values (auth.uid(), 'delete_message', author, p_table, p_message_id::text);

  return author is not null;
end;
$$;

-- Suspend or unsuspend a student. Admin accounts can't be suspended.
create or replace function public.admin_set_suspended(p_user_id uuid, p_on boolean, p_reason text default '')
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_campus_admin() then
    raise exception 'only Campus Admin can suspend accounts';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'you cannot suspend yourself';
  end if;
  if exists (
    select 1 from auth.users u join public.admin_emails a on a.email = lower(u.email)
    where u.id = p_user_id
  ) then
    raise exception 'Campus Admin accounts cannot be suspended';
  end if;
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'student not found';
  end if;

  perform set_config('ufitness.admin_action', 'on', true);

  insert into public.profiles (id, email, profile, suspended, suspended_reason, suspended_at)
  values (
    p_user_id,
    (select email from auth.users where id = p_user_id),
    '{}'::jsonb,
    p_on,
    case when p_on then left(coalesce(p_reason, ''), 300) else '' end,
    case when p_on then now() else null end
  )
  on conflict (id) do update
    set suspended = excluded.suspended,
        suspended_reason = excluded.suspended_reason,
        suspended_at = excluded.suspended_at;

  perform set_config('ufitness.admin_action', 'off', true);

  insert into public.moderation_actions (admin_id, action, target_user_id, note)
  values (auth.uid(), case when p_on then 'suspend' else 'unsuspend' end, p_user_id, left(coalesce(p_reason, ''), 300));

  return p_on;
end;
$$;

revoke all on function public.admin_resolve_report(uuid, text) from public, anon;
revoke all on function public.admin_delete_message(text, uuid) from public, anon;
revoke all on function public.admin_set_suspended(uuid, boolean, text) from public, anon;
grant execute on function public.admin_resolve_report(uuid, text) to authenticated;
grant execute on function public.admin_delete_message(text, uuid) to authenticated;
grant execute on function public.admin_set_suspended(uuid, boolean, text) to authenticated;

-- Helper / trigger functions are not meant to be called directly.
revoke all on function public.profile_display_name(uuid) from public, anon, authenticated;
revoke all on function public.chat_report_guard() from public, anon, authenticated;
revoke all on function public.protect_profile_suspension() from public, anon, authenticated;
revoke all on function public.group_member_guard() from public, anon, authenticated;

-- Tables created in this file: no anon access.
revoke all on public.moderation_actions from anon;

-- ---------------------------------------------------------------------------
-- 11f) Account delete also clears the admin log links.
-- ---------------------------------------------------------------------------
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  delete from public.buddy_requests where from_id = uid or to_id = uid;
  delete from public.mentor_requests where student_id = uid or mentor_id = uid;
  delete from public.mentor_invites where student_id = uid;
  update public.mentor_invites set invited_by = null where invited_by = uid;
  delete from public.chat_reports where reporter_id = uid;
  update public.chat_reports set reported_user_id = null where reported_user_id = uid;
  update public.chat_reports set resolved_by = null where resolved_by = uid;
  update public.moderation_actions set target_user_id = null where target_user_id = uid;
  update public.moderation_actions set admin_id = null where admin_id = uid;
  delete from public.user_blocks where blocker_id = uid or blocked_id = uid;
  delete from public.direct_messages where from_id = uid or to_id = uid;
  delete from public.group_messages where user_id = uid;
  delete from public.group_members where user_id = uid;
  delete from public.usage_events where user_id = uid;

  update public.groups set owner_id = null where owner_id = uid;

  delete from public.user_docs where user_id = uid;
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
