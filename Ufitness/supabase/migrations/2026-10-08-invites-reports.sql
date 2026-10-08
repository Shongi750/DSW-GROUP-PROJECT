-- ===========================================================================
-- 2026-10-08 (part C): mentor invites, protected mentor role, chat reports
-- and blocks. Safe to re-run. Also included at the end of supabase/schema.sql.
-- Run once in the Supabase SQL editor (after the earlier 2026-10-08 file).
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 9a) Protect special roles on profiles.
--     profile->'roles' is saved by the app with the rest of the profile, so a
--     student could add "mentor" themselves. This trigger keeps "mentor" and
--     "campus_admin" exactly as they were in the database unless the change
--     comes from accept_mentor_invite() / grant_mentor_role() below.
--     It quietly keeps the old value instead of raising, so normal profile
--     saves still work.
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_roles()
returns trigger
language plpgsql
as $$
declare
  old_roles jsonb := '[]'::jsonb;
  new_roles jsonb;
  kept jsonb;
begin
  -- Set only inside the security definer functions below (transaction-local).
  if coalesce(current_setting('ufitness.role_grant', true), '') = 'on' then
    return new;
  end if;

  if tg_op = 'UPDATE' and jsonb_typeof(old.profile->'roles') = 'array' then
    old_roles := old.profile->'roles';
  end if;

  new_roles := coalesce(new.profile, '{}'::jsonb)->'roles';
  if new_roles is null or jsonb_typeof(new_roles) <> 'array' then
    new_roles := '[]'::jsonb;
  end if;

  -- Normal roles from the app + protected roles from the old row (+ student).
  select coalesce(jsonb_agg(distinct r), '["student"]'::jsonb)
    into kept
  from (
    select 'student' as r
    union
    select value from jsonb_array_elements_text(new_roles)
      where value not in ('mentor', 'campus_admin')
    union
    select value from jsonb_array_elements_text(old_roles)
      where value in ('mentor', 'campus_admin')
  ) as roles_list;

  new.profile := jsonb_set(coalesce(new.profile, '{}'::jsonb), '{roles}', kept, true);
  return new;
end;
$$;

drop trigger if exists protect_profile_roles on public.profiles;
create trigger protect_profile_roles
  before insert or update on public.profiles
  for each row
  execute function public.protect_profile_roles();

-- ---------------------------------------------------------------------------
-- 9b) Mentor invites (Campus Admin -> student).
--     Admins insert. The invited student reads their row and can decline.
--     Accepting goes through accept_mentor_invite() so the role is granted
--     in the same step.
-- ---------------------------------------------------------------------------
create table if not exists public.mentor_invites (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users (id) on delete cascade,
  invited_by uuid references auth.users (id) on delete set null default auth.uid(),
  student_name text not null default '',
  message text not null default '',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

do $$
begin
  alter table public.mentor_invites
    add constraint mentor_invites_status_check
    check (status in ('pending', 'accepted', 'declined'));
exception
  when duplicate_object then null;
end $$;

-- One open invite per student at a time.
create unique index if not exists mentor_invites_one_pending
  on public.mentor_invites (student_id)
  where status = 'pending';

alter table public.mentor_invites enable row level security;

drop policy if exists "admins send mentor invites" on public.mentor_invites;
drop policy if exists "read own or admin mentor invites" on public.mentor_invites;
drop policy if exists "student answers mentor invite" on public.mentor_invites;

create policy "admins send mentor invites" on public.mentor_invites
  for insert
  to authenticated
  with check (public.is_campus_admin() and invited_by = auth.uid());

create policy "read own or admin mentor invites" on public.mentor_invites
  for select
  to authenticated
  using (student_id = auth.uid() or public.is_campus_admin());

create policy "student answers mentor invite" on public.mentor_invites
  for update
  to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create or replace function public.mentor_invite_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.invited_by := auth.uid();
    new.status := 'pending';
    new.responded_at := null;
    new.message := left(trim(coalesce(new.message, '')), 500);
    new.student_name := left(trim(coalesce(new.student_name, '')), 120);
    return new;
  end if;

  -- The inviter's account was deleted (invited_by set to null): allow that alone.
  if old.invited_by is not null and new.invited_by is null
     and new.status = old.status and new.student_id = old.student_id then
    return new;
  end if;

  -- Otherwise only the status may change, and only once.
  if new.student_id <> old.student_id
     or new.invited_by is distinct from old.invited_by
     or new.message <> old.message
     or new.student_name <> old.student_name
     or new.created_at <> old.created_at then
    raise exception 'only the invite status can change';
  end if;
  if old.status <> 'pending' then
    raise exception 'invite already answered';
  end if;
  if new.status not in ('accepted', 'declined') then
    raise exception 'answer must be accepted or declined';
  end if;
  if new.status = 'accepted'
     and coalesce(current_setting('ufitness.role_grant', true), '') <> 'on' then
    raise exception 'use accept_mentor_invite() to accept';
  end if;
  new.responded_at := now();
  return new;
end;
$$;

drop trigger if exists mentor_invite_guard on public.mentor_invites;
create trigger mentor_invite_guard
  before insert or update on public.mentor_invites
  for each row
  execute function public.mentor_invite_guard();

-- Student accepts: invite -> accepted and "mentor" added to their roles.
-- Returns the new roles array so the app can update straight away.
create or replace function public.accept_mentor_invite(p_invite_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  invite public.mentor_invites%rowtype;
  roles_now jsonb;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select * into invite from public.mentor_invites where id = p_invite_id for update;
  if not found or invite.student_id <> uid then
    raise exception 'invite not found';
  end if;
  if invite.status <> 'pending' then
    raise exception 'invite already answered';
  end if;

  perform set_config('ufitness.role_grant', 'on', true);

  update public.mentor_invites set status = 'accepted' where id = p_invite_id;

  insert into public.profiles (id, email, profile, updated_at)
  values (uid, (select email from auth.users where id = uid), '{"roles": ["student", "mentor"]}'::jsonb, now())
  on conflict (id) do update
    set profile = jsonb_set(
          public.profiles.profile,
          '{roles}',
          (
            select jsonb_agg(distinct r)
            from (
              select value as r
              from jsonb_array_elements_text(
                case when jsonb_typeof(public.profiles.profile->'roles') = 'array'
                  then public.profiles.profile->'roles' else '[]'::jsonb end
              )
              union select 'student'
              union select 'mentor'
            ) as roles_list
          ),
          true
        ),
        updated_at = now();

  perform set_config('ufitness.role_grant', 'off', true);

  select profile->'roles' into roles_now from public.profiles where id = uid;
  return roles_now;
end;
$$;

revoke all on function public.accept_mentor_invite(uuid) from public;
grant execute on function public.accept_mentor_invite(uuid) to authenticated;

-- Campus Admin can also grant or remove the mentor role directly.
create or replace function public.set_mentor_role(p_student_id uuid, p_on boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  roles_now jsonb;
begin
  if not public.is_campus_admin() then
    raise exception 'only Campus Admin can change mentor roles';
  end if;

  perform set_config('ufitness.role_grant', 'on', true);

  update public.profiles
    set profile = jsonb_set(
          profile,
          '{roles}',
          (
            select coalesce(jsonb_agg(distinct r), '["student"]'::jsonb)
            from (
              select value as r
              from jsonb_array_elements_text(
                case when jsonb_typeof(profile->'roles') = 'array'
                  then profile->'roles' else '[]'::jsonb end
              )
              where value <> 'mentor'
              union select 'student'
              union select 'mentor' where p_on
            ) as roles_list
          ),
          true
        ),
        updated_at = now()
    where id = p_student_id
    returning profile->'roles' into roles_now;

  perform set_config('ufitness.role_grant', 'off', true);

  if roles_now is null then
    raise exception 'student has no profile yet';
  end if;
  return roles_now;
end;
$$;

revoke all on function public.set_mentor_role(uuid, boolean) from public;
grant execute on function public.set_mentor_role(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 9c) Chat reports. Anyone signed in can report; only Campus Admin reads.
--     excerpt keeps a short copy of the message, because admins are not
--     members of every group / DM thread.
-- ---------------------------------------------------------------------------
create table if not exists public.chat_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  message_table text not null,
  message_id text not null,
  reported_user_id uuid references auth.users (id) on delete set null,
  reported_name text not null default '',
  reason text not null,
  excerpt text not null default '',
  created_at timestamptz not null default now()
);

do $$
begin
  alter table public.chat_reports
    add constraint chat_reports_table_check
    check (message_table in ('group_messages', 'direct_messages', 'community_posts'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.chat_reports
    add constraint chat_reports_reason_check
    check (reason in ('spam', 'harassment', 'hate', 'sexual', 'unsafe_advice', 'other'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.chat_reports
    add constraint chat_reports_text_length
    check (char_length(excerpt) <= 300 and char_length(reported_name) <= 120);
exception
  when duplicate_object then null;
end $$;

-- Same person reporting the same message twice = one row.
create unique index if not exists chat_reports_once
  on public.chat_reports (reporter_id, message_table, message_id);

create index if not exists chat_reports_created_idx
  on public.chat_reports (created_at desc);

alter table public.chat_reports enable row level security;

drop policy if exists "report as yourself" on public.chat_reports;
drop policy if exists "admins read reports" on public.chat_reports;

create policy "report as yourself" on public.chat_reports
  for insert
  to authenticated
  with check (reporter_id = auth.uid());

create policy "admins read reports" on public.chat_reports
  for select
  to authenticated
  using (public.is_campus_admin());

-- ---------------------------------------------------------------------------
-- 9d) Blocks. Only the person who blocked can see / change their list.
-- ---------------------------------------------------------------------------
create table if not exists public.user_blocks (
  blocker_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  blocked_name text not null default '',
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.user_blocks enable row level security;

drop policy if exists "own blocks" on public.user_blocks;
create policy "own blocks" on public.user_blocks
  for all
  to authenticated
  using (blocker_id = auth.uid())
  with check (blocker_id = auth.uid());

-- A blocked student can no longer send you direct messages.
create or replace function public.direct_message_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or new.from_id <> auth.uid() then
    raise exception 'cannot spoof direct message sender';
  end if;
  if new.from_id = new.to_id then
    raise exception 'cannot message yourself';
  end if;
  if exists (
    select 1 from public.user_blocks
    where blocker_id = new.to_id and blocked_id = new.from_id
  ) then
    raise exception 'this student is not accepting your messages';
  end if;
  new.body := trim(new.body);
  if new.body = '' or char_length(new.body) > 1000 then
    raise exception 'message must be 1–1000 characters';
  end if;
  new.thread_key := public.dm_thread_key(new.from_id, new.to_id);
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9e) Account delete also clears invites, reports and blocks.
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

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
