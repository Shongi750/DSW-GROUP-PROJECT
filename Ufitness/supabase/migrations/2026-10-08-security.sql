-- ===========================================================================
-- 2026-10-08 (part D1): security review fixes. Safe to re-run.
-- Also included at the end of supabase/schema.sql.
-- Run after 2026-10-08-invites-reports.sql, then run 2026-10-08-moderation.sql.
-- See supabase/SECURITY.md for what each fix is for.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 10a) Campus admin = verified admin email only.
--      Before: any account whose email matched admin_emails counted, even if
--      the email was never confirmed (risky if "Confirm email" is ever off).
-- ---------------------------------------------------------------------------
create or replace function public.is_campus_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    join public.admin_emails a on a.email = lower(u.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  );
$$;

-- ---------------------------------------------------------------------------
-- 10b) list_students() must not work without a login.
--      Supabase lets the "anon" key call functions by default, and the anon
--      key ships inside the app, so anyone could list student names/campuses.
-- ---------------------------------------------------------------------------
create or replace function public.list_students()
returns table (
  id uuid,
  name text,
  campus text,
  fitness_goal text,
  experience_level text,
  workout_location text,
  year_of_study text,
  course text,
  avatar_url text,
  roles jsonb,
  appear_as_mentor boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    coalesce(p.profile->'public'->>'name', ''),
    case
      when coalesce(p.profile->'privacy'->>'showCampus', p.profile->'public'->>'showCampus', 'true') in ('false', 'f')
        then ''
      else coalesce(p.profile->'public'->>'campus', '')
    end,
    case
      when coalesce(p.profile->'privacy'->>'showGoal', 'true') in ('false', 'f')
        then ''
      else coalesce(p.profile->'public'->>'fitnessGoal', '')
    end,
    case
      when coalesce(p.profile->'privacy'->>'showExperience', 'true') in ('false', 'f')
        then ''
      else coalesce(p.profile->'public'->>'experienceLevel', '')
    end,
    coalesce(p.profile->'public'->>'workoutLocation', ''),
    coalesce(p.profile->'public'->>'yearOfStudy', ''),
    coalesce(p.profile->'public'->>'course', ''),
    coalesce(p.profile->'public'->>'avatarUrl', ''),
    case
      when jsonb_typeof(p.profile->'roles') = 'array' then p.profile->'roles'
      else '["student"]'::jsonb
    end,
    coalesce(p.profile->'privacy'->>'appearAsMentor', 'true') not in ('false', 'f')
  from public.profiles p
  where auth.uid() is not null
    and (
      coalesce(p.profile->>'onboardingComplete', '') in ('true', 't')
      or coalesce(p.profile->'public'->>'name', '') <> ''
    )
    and coalesce(p.profile->'privacy'->>'discoverable', p.profile->'public'->>'discoverable', 'true')
      not in ('false', 'f');
$$;

-- ---------------------------------------------------------------------------
-- 10c) Names shown to other students come from the profile, not the client.
--      Before: group_members.name and mentor_requests.student_name / mentor_name
--      were whatever the app sent, so someone could pose as another student.
-- ---------------------------------------------------------------------------
create or replace function public.profile_display_name(uid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select coalesce(nullif(p.profile->'public'->>'name', ''), nullif(p.profile->>'name', ''))
     from public.profiles p where p.id = uid),
    'Student'
  );
$$;

create or replace function public.group_member_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.name := public.profile_display_name(new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists group_member_guard on public.group_members;
create trigger group_member_guard
  before insert or update on public.group_members
  for each row
  execute function public.group_member_guard();

create or replace function public.mentor_request_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_is_mentor boolean;
begin
  if tg_op = 'INSERT' then
    if auth.uid() is null or new.student_id <> auth.uid() then
      raise exception 'cannot spoof mentor request sender';
    end if;
    select coalesce(p.profile->'roles', '[]'::jsonb) ? 'mentor'
      into target_is_mentor
    from public.profiles p
    where p.id = new.mentor_id;
    if not coalesce(target_is_mentor, false) then
      raise exception 'that student is not a mentor';
    end if;
    new.status := 'pending';
    new.guidance := '[]'::jsonb;
    new.responded_at := null;
    -- Names come from the profiles, not from the app.
    new.student_name := public.profile_display_name(new.student_id);
    new.mentor_name := public.profile_display_name(new.mentor_id);
    return new;
  end if;

  -- UPDATE
  if auth.uid() is distinct from old.mentor_id then
    raise exception 'only the mentor can update this request';
  end if;
  if new.student_id is distinct from old.student_id
     or new.mentor_id is distinct from old.mentor_id
     or new.student_name is distinct from old.student_name
     or new.created_at is distinct from old.created_at then
    raise exception 'mentor request parties are immutable';
  end if;
  if new.status is distinct from old.status
     and not (old.status = 'pending' and new.status in ('active', 'declined'))
     and not (old.status = 'active' and new.status = 'declined') then
    raise exception 'invalid mentor request status change';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 10d) Policies: signed-in users only ("to authenticated"), and no direct
--      profile delete (delete_own_account() still removes everything).
--      Without a delete policy a suspended student can't wipe their own row
--      to clear the suspension flag (see 2026-10-08-moderation.sql).
-- ---------------------------------------------------------------------------
drop policy if exists "own profile" on public.profiles;
drop policy if exists "own profile read" on public.profiles;
drop policy if exists "own profile insert" on public.profiles;
drop policy if exists "own profile update" on public.profiles;

create policy "own profile read" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

create policy "own profile insert" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

create policy "own profile update" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- user_docs policies are replaced in 2026-10-08-moderation.sql (11d).

drop policy if exists "mentor select parties" on public.mentor_requests;
drop policy if exists "mentor insert student" on public.mentor_requests;
drop policy if exists "mentor delete student" on public.mentor_requests;

create policy "mentor select parties" on public.mentor_requests
  for select to authenticated
  using (auth.uid() = student_id or auth.uid() = mentor_id);

create policy "mentor insert student" on public.mentor_requests
  for insert to authenticated
  with check (auth.uid() = student_id and status = 'pending');

create policy "mentor delete student" on public.mentor_requests
  for delete to authenticated
  using (auth.uid() = student_id);

-- Groups can be created directly (insert policy), so limit sizes there too.
do $$
begin
  alter table public.groups
    add constraint groups_text_limits
    check (
      char_length(id) between 1 and 64
      and char_length(name) between 1 and 80
      and char_length(campus) <= 80
      and char_length(about) <= 500
      and char_length(next_session) <= 120
    ) not valid;
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 10e) Fixed search_path on every function (Supabase linter: "function search
--      path mutable").
-- ---------------------------------------------------------------------------
alter function public.protect_profile_roles() set search_path = public;
alter function public.dm_thread_key(uuid, uuid) set search_path = public;

-- ---------------------------------------------------------------------------
-- 10f) No anon access.
--      Supabase grants the "anon" role table access and EXECUTE on new
--      functions by default. Every policy is "to authenticated" now, but we
--      also remove the grants so a forgotten policy can't leak data.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on public.admin_emails from anon, authenticated;

do $$
declare
  fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and not exists (            -- skip functions owned by extensions
        select 1 from pg_depend d
        where d.objid = p.oid and d.deptype = 'e'
      )
  loop
    begin
      execute format('revoke execute on function %s from public, anon', fn);
    exception
      when others then raise notice 'could not revoke %: %', fn, sqlerrm;
    end;
  end loop;
end $$;

-- Signed-in users keep the functions the app and the RLS policies call.
grant execute on function public.is_campus_admin() to authenticated;
grant execute on function public.is_group_member(text) to authenticated;
grant execute on function public.ensure_group(text, text, text, text, text) to authenticated;
grant execute on function public.list_students() to authenticated;
grant execute on function public.delete_own_account() to authenticated;
grant execute on function public.admin_usage_summary() to authenticated;
grant execute on function public.accept_mentor_invite(uuid) to authenticated;
grant execute on function public.set_mentor_role(uuid, boolean) to authenticated;

-- Internal helper (used inside the guard triggers only).
revoke all on function public.profile_display_name(uuid) from public, anon, authenticated;

-- New functions: no automatic EXECUTE for everyone / anon (grant it on purpose).
do $$
begin
  alter default privileges revoke execute on functions from public;
  alter default privileges in schema public revoke execute on functions from anon;
  alter default privileges in schema public revoke all on tables from anon;
  alter default privileges in schema public revoke all on sequences from anon;
exception
  when others then raise notice 'default privileges not changed: %', sqlerrm;
end $$;
