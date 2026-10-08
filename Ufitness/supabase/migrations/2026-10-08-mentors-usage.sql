-- ===========================================================================
-- 2026-10-08: real mentors, safer mentor requests, real admin usage data.
-- Safe to re-run. Also included at the end of supabase/schema.sql.
-- Run once in the Supabase SQL editor.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 8a) list_students() now also returns roles + "appear as mentor"
--     (Find a Mentor shows students whose roles include 'mentor').
--     The return type changed, so the old function is dropped first.
-- ---------------------------------------------------------------------------
drop function if exists public.list_students();

create function public.list_students()
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
  where (
      coalesce(p.profile->>'onboardingComplete', '') in ('true', 't')
      or coalesce(p.profile->'public'->>'name', '') <> ''
    )
    and coalesce(p.profile->'privacy'->>'discoverable', p.profile->'public'->>'discoverable', 'true')
      not in ('false', 'f');
$$;

revoke all on function public.list_students() from public;
grant execute on function public.list_students() to authenticated;

-- ---------------------------------------------------------------------------
-- 8b) Mentor requests: only the mentor can accept / decline / add guidance.
--     The student sends (pending) and can withdraw (delete).
-- ---------------------------------------------------------------------------
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

drop trigger if exists mentor_request_guard on public.mentor_requests;
create trigger mentor_request_guard
  before insert or update on public.mentor_requests
  for each row
  execute function public.mentor_request_guard();

-- Replace the old "either party can update" policy with mentor-only.
drop policy if exists "mentor update parties" on public.mentor_requests;
drop policy if exists "mentor answers request" on public.mentor_requests;
create policy "mentor answers request" on public.mentor_requests
  for update
  to authenticated
  using (auth.uid() = mentor_id)
  with check (auth.uid() = mentor_id);

create index if not exists mentor_requests_mentor_status_idx
  on public.mentor_requests (mentor_id, status);

-- ---------------------------------------------------------------------------
-- 8c) Usage events for the Campus Admin dashboard.
--     Students insert their own rows; only campus admins can read them.
-- ---------------------------------------------------------------------------
create table if not exists public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  event text not null check (char_length(event) between 1 and 40),
  created_at timestamptz not null default now()
);

create index if not exists usage_events_created_idx on public.usage_events (created_at);

alter table public.usage_events enable row level security;

drop policy if exists "insert own usage" on public.usage_events;
drop policy if exists "admins read usage" on public.usage_events;

create policy "insert own usage" on public.usage_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "admins read usage" on public.usage_events
  for select
  to authenticated
  using (public.is_campus_admin());

-- One call for the dashboard: signups, active users per day (last 7 days), feature reach.
create or replace function public.admin_usage_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_campus_admin() then
    raise exception 'campus admins only';
  end if;

  select jsonb_build_object(
    'total_students', (select count(*) from public.profiles),
    'signups_7d', (
      select count(*) from auth.users u
      where u.created_at >= now() - interval '7 days'
    ),
    'active_7d', (
      select count(distinct e.user_id) from public.usage_events e
      where e.created_at >= now() - interval '7 days'
    ),
    'active_by_day', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'users', d.users) order by d.day)
      from (
        select (e.created_at at time zone 'Africa/Johannesburg')::date as day,
               count(distinct e.user_id) as users
        from public.usage_events e
        where e.created_at >= now() - interval '7 days'
        group by 1
      ) d
    ), '[]'::jsonb),
    'features', coalesce((
      select jsonb_agg(jsonb_build_object('event', f.event, 'users', f.users) order by f.users desc)
      from (
        select e.event, count(distinct e.user_id) as users
        from public.usage_events e
        where e.created_at >= now() - interval '7 days'
          and e.event <> 'app_open'
        group by e.event
      ) f
    ), '[]'::jsonb)
  )
  into result;

  return result;
end;
$$;

revoke all on function public.admin_usage_summary() from public;
grant execute on function public.admin_usage_summary() to authenticated;

-- Account delete also removes usage rows (cascade handles it; explicit for clarity).
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
