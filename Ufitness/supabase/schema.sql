-- UFitness Supabase schema + security hardening.
-- Run the full script in the Supabase SQL editor (safe to re-run).
-- Create Account OTP templates must include {{ .Token }}.

-- ---------------------------------------------------------------------------
-- 1) UJ student email gate (server-side)
-- ---------------------------------------------------------------------------
create or replace function public.enforce_uj_student_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null
     or lower(new.email) !~ '^[0-9]{9}@student\.uj\.ac\.za$' then
    raise exception 'UJ student email required (9-digit-number@student.uj.ac.za)';
  end if;
  new.email := lower(new.email);
  return new;
end;
$$;

drop trigger if exists enforce_uj_email on auth.users;
create trigger enforce_uj_email
  before insert or update of email on auth.users
  for each row
  execute function public.enforce_uj_student_email();

-- ---------------------------------------------------------------------------
-- Profiles + private docs
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create table if not exists public.user_docs (
  user_id uuid not null references auth.users (id) on delete cascade,
  doc text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, doc)
);

alter table public.user_docs enable row level security;

drop policy if exists "own docs" on public.user_docs;
create policy "own docs" on public.user_docs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- list_students() lives in section 8a at the end of this file
-- (it now also returns roles, so it is dropped and re-created there).

-- ---------------------------------------------------------------------------
-- 4) Admin authority (verified auth email only)
-- ---------------------------------------------------------------------------
create table if not exists public.admin_emails (
  email text primary key
    check (email ~ '^[0-9]{9}@student\.uj\.ac\.za$')
);

insert into public.admin_emails (email)
values ('223222161@student.uj.ac.za')
on conflict (email) do nothing;

alter table public.admin_emails enable row level security;

drop policy if exists "no direct admin email access" on public.admin_emails;

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
  );
$$;

revoke all on function public.is_campus_admin() from public;
grant execute on function public.is_campus_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Buddy requests (hard RLS + immutability trigger)
-- ---------------------------------------------------------------------------
create table if not exists public.buddy_requests (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references auth.users (id) on delete cascade,
  to_id uuid not null references auth.users (id) on delete cascade,
  from_name text not null default '',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (from_id, to_id)
);

do $$
begin
  alter table public.buddy_requests
    add constraint buddy_requests_status_check
    check (status in ('pending', 'accepted', 'rejected', 'ended'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.buddy_requests
    add constraint buddy_requests_not_self check (from_id <> to_id);
exception
  when duplicate_object then null;
end $$;

alter table public.buddy_requests enable row level security;

create or replace function public.buddy_request_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  if tg_op = 'INSERT' then
    if auth.uid() is null or new.from_id <> auth.uid() then
      raise exception 'cannot spoof buddy request sender';
    end if;
    if new.from_id = new.to_id then
      raise exception 'cannot request yourself';
    end if;
    new.status := 'pending';
    select coalesce(
      nullif(p.profile->'public'->>'name', ''),
      nullif(p.profile->>'name', ''),
      'Student'
    )
      into display_name
    from public.profiles p
    where p.id = new.from_id;
    new.from_name := coalesce(display_name, 'Student');
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.from_id is distinct from old.from_id
       or new.to_id is distinct from old.to_id
       or new.from_name is distinct from old.from_name
       or new.created_at is distinct from old.created_at then
      raise exception 'buddy request parties are immutable';
    end if;

    if old.status = 'pending' and new.status in ('accepted', 'rejected') then
      if auth.uid() is distinct from old.to_id then
        raise exception 'only the receiver can accept or reject';
      end if;
      return new;
    end if;

    if old.status in ('pending', 'accepted') and new.status = 'ended' then
      if auth.uid() is distinct from old.from_id
         and auth.uid() is distinct from old.to_id then
        raise exception 'only a party can end this request';
      end if;
      return new;
    end if;

    raise exception 'invalid buddy request status transition';
  end if;

  return new;
end;
$$;

drop trigger if exists buddy_request_guard on public.buddy_requests;
create trigger buddy_request_guard
  before insert or update on public.buddy_requests
  for each row
  execute function public.buddy_request_guard();

drop policy if exists "buddy request parties" on public.buddy_requests;
drop policy if exists "send buddy request" on public.buddy_requests;
drop policy if exists "answer buddy request" on public.buddy_requests;
drop policy if exists "buddy select parties" on public.buddy_requests;
drop policy if exists "buddy insert pending" on public.buddy_requests;
drop policy if exists "buddy receiver decide" on public.buddy_requests;
drop policy if exists "buddy party end" on public.buddy_requests;

create policy "buddy select parties" on public.buddy_requests
  for select
  to authenticated
  using (auth.uid() = from_id or auth.uid() = to_id);

create policy "buddy insert pending" on public.buddy_requests
  for insert
  to authenticated
  with check (
    auth.uid() = from_id
    and status = 'pending'
    and from_id <> to_id
  );

create policy "buddy receiver decide" on public.buddy_requests
  for update
  to authenticated
  using (auth.uid() = to_id and status = 'pending')
  with check (auth.uid() = to_id and status in ('accepted', 'rejected'));

create policy "buddy party end" on public.buddy_requests
  for update
  to authenticated
  using (
    (auth.uid() = from_id or auth.uid() = to_id)
    and status in ('pending', 'accepted')
  )
  with check (
    (auth.uid() = from_id or auth.uid() = to_id)
    and status = 'ended'
  );

-- ---------------------------------------------------------------------------
-- 2b) Mentor requests (student ↔ mentor; Hub works across devices)
-- ---------------------------------------------------------------------------
create table if not exists public.mentor_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users (id) on delete cascade,
  mentor_id uuid not null references auth.users (id) on delete cascade,
  student_name text not null default '',
  student_campus text not null default '',
  student_goal text not null default '',
  mentor_name text not null default '',
  campus text not null default '',
  status text not null default 'pending',
  guidance jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (student_id, mentor_id)
);

do $$
begin
  alter table public.mentor_requests
    add constraint mentor_requests_status_check
    check (status in ('pending', 'active', 'declined'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.mentor_requests
    add constraint mentor_requests_not_self check (student_id <> mentor_id);
exception
  when duplicate_object then null;
end $$;

alter table public.mentor_requests enable row level security;

drop policy if exists "mentor select parties" on public.mentor_requests;
drop policy if exists "mentor insert student" on public.mentor_requests;
drop policy if exists "mentor update parties" on public.mentor_requests;
drop policy if exists "mentor delete student" on public.mentor_requests;

create policy "mentor select parties" on public.mentor_requests
  for select using (auth.uid() = student_id or auth.uid() = mentor_id);

create policy "mentor insert student" on public.mentor_requests
  for insert with check (auth.uid() = student_id and status = 'pending');

create policy "mentor update parties" on public.mentor_requests
  for update using (auth.uid() = student_id or auth.uid() = mentor_id)
  with check (auth.uid() = student_id or auth.uid() = mentor_id);

create policy "mentor delete student" on public.mentor_requests
  for delete using (auth.uid() = student_id);

-- ---------------------------------------------------------------------------
-- 3) Groups + member-only chat
-- ---------------------------------------------------------------------------
create table if not exists public.groups (
  id text primary key,
  name text not null,
  campus text not null default '',
  about text not null default '',
  next_session text not null default '',
  owner_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.groups enable row level security;

insert into public.groups (id, name, campus, about, next_session) values
  (
    'g1',
    'APK Morning Runners',
    'APK (Auckland Park Kingsway)',
    'Easy 5 km loops before lectures. New runners welcome — no pace gate.',
    'Tue 06:15 · APK Kingsway loop'
  ),
  (
    'g2',
    'APB Weightlifting Crew',
    'APB (Auckland Park Bunting Road)',
    'Compound lifts, form checks, and a shared squat rack booking at APB.',
    'Wed 17:30 · APB gym floor'
  ),
  (
    'g3',
    'DFC Yoga & Stretch',
    'DFC (Doornfontein)',
    'Mobility and recovery after labs. Mats on the DFC courtyard when the studio is full.',
    'Thu 16:00 · DFC courtyard'
  ),
  (
    'g4',
    'SWC Soccer Club',
    'SWC (Soweto)',
    'Five-a-side and weekend matches. Boots optional, shin guards if you have them.',
    'Sat 09:00 · SWC field'
  )
on conflict (id) do update set
  name = excluded.name,
  campus = excluded.campus,
  about = excluded.about,
  next_session = excluded.next_session;

-- Legacy free-text memberships: create parent rows before FK is enforced.
do $$
begin
  if to_regclass('public.group_members') is not null then
    insert into public.groups (id, name, campus)
    select distinct gm.group_id, gm.group_id, ''
    from public.group_members gm
    where not exists (select 1 from public.groups g where g.id = gm.group_id)
    on conflict (id) do nothing;
  end if;
end $$;

create table if not exists public.group_members (
  group_id text not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default '',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- If group_members already existed without FK, attach it now.
do $$
begin
  alter table public.group_members
    add constraint group_members_group_id_fkey
    foreign key (group_id) references public.groups (id) on delete cascade;
exception
  when duplicate_object then null;
end $$;

alter table public.group_members enable row level security;

create or replace function public.is_group_member(gid text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members m
    where m.group_id = gid
      and m.user_id = auth.uid()
  );
$$;

revoke all on function public.is_group_member(text) from public;
grant execute on function public.is_group_member(text) to authenticated;

create or replace function public.ensure_group(
  p_id text,
  p_name text default '',
  p_campus text default '',
  p_about text default '',
  p_next_session text default ''
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  gid text := nullif(trim(p_id), '');
  gname text := nullif(trim(p_name), '');
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if gid is null or char_length(gid) > 64 then
    raise exception 'invalid group id';
  end if;
  if gname is null then
    gname := gid;
  end if;
  if char_length(gname) > 80 then
    gname := left(gname, 80);
  end if;

  insert into public.groups (id, name, campus, about, next_session, owner_id)
  values (
    gid,
    gname,
    coalesce(nullif(trim(p_campus), ''), ''),
    coalesce(nullif(trim(p_about), ''), ''),
    coalesce(nullif(trim(p_next_session), ''), ''),
    auth.uid()
  )
  on conflict (id) do nothing;

  return gid;
end;
$$;

revoke all on function public.ensure_group(text, text, text, text, text) from public;
grant execute on function public.ensure_group(text, text, text, text, text) to authenticated;

drop policy if exists "read groups" on public.groups;
drop policy if exists "create groups" on public.groups;
create policy "read groups" on public.groups
  for select
  to authenticated
  using (true);

create policy "create groups" on public.groups
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "read group members" on public.group_members;
drop policy if exists "join group" on public.group_members;
drop policy if exists "leave group" on public.group_members;
drop policy if exists "members read members" on public.group_members;
drop policy if exists "join own membership" on public.group_members;
drop policy if exists "leave own membership" on public.group_members;
drop policy if exists "read own membership" on public.group_members;

create policy "members read members" on public.group_members
  for select
  to authenticated
  using (public.is_group_member(group_id));

create policy "read own membership" on public.group_members
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "join own membership" on public.group_members
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.groups g where g.id = group_id)
  );

create policy "leave own membership" on public.group_members
  for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id text not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  author text not null default '',
  body text not null,
  created_at timestamptz not null default now()
);

do $$
begin
  alter table public.group_messages
    add constraint group_messages_group_id_fkey
    foreign key (group_id) references public.groups (id) on delete cascade;
exception
  when duplicate_object then null;
end $$;

alter table public.group_messages enable row level security;

create or replace function public.group_message_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  if auth.uid() is null or new.user_id <> auth.uid() then
    raise exception 'cannot spoof group message author';
  end if;
  if not public.is_group_member(new.group_id) then
    raise exception 'join the group before chatting';
  end if;
  new.body := trim(new.body);
  if new.body = '' or char_length(new.body) > 1000 then
    raise exception 'message must be 1–1000 characters';
  end if;
  select coalesce(
    nullif(p.profile->'public'->>'name', ''),
    nullif(p.profile->>'name', ''),
    'Student'
  )
    into display_name
  from public.profiles p
  where p.id = new.user_id;
  new.author := coalesce(display_name, 'Student');
  return new;
end;
$$;

drop trigger if exists group_message_guard on public.group_messages;
create trigger group_message_guard
  before insert on public.group_messages
  for each row
  execute function public.group_message_guard();

drop policy if exists "read group messages" on public.group_messages;
drop policy if exists "send group message" on public.group_messages;
drop policy if exists "members read messages" on public.group_messages;
drop policy if exists "members send messages" on public.group_messages;

create policy "members read messages" on public.group_messages
  for select
  to authenticated
  using (public.is_group_member(group_id));

create policy "members send messages" on public.group_messages
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.is_group_member(group_id)
    and char_length(body) <= 1000
  );

do $$
begin
  alter publication supabase_realtime add table public.group_messages;
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 6) Direct messages (buddy / mentor 1:1)
-- ---------------------------------------------------------------------------
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  thread_key text not null,
  from_id uuid not null references auth.users (id) on delete cascade,
  to_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  check (from_id <> to_id)
);

create index if not exists direct_messages_thread_created_idx
  on public.direct_messages (thread_key, created_at);

alter table public.direct_messages enable row level security;

create or replace function public.dm_thread_key(a uuid, b uuid)
returns text
language sql
immutable
as $$
  select case
    when a::text < b::text then a::text || ':' || b::text
    else b::text || ':' || a::text
  end;
$$;

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
  new.body := trim(new.body);
  if new.body = '' or char_length(new.body) > 1000 then
    raise exception 'message must be 1–1000 characters';
  end if;
  new.thread_key := public.dm_thread_key(new.from_id, new.to_id);
  return new;
end;
$$;

drop trigger if exists direct_message_guard on public.direct_messages;
create trigger direct_message_guard
  before insert on public.direct_messages
  for each row
  execute function public.direct_message_guard();

drop policy if exists "dm read parties" on public.direct_messages;
drop policy if exists "dm send" on public.direct_messages;

create policy "dm read parties" on public.direct_messages
  for select
  to authenticated
  using (auth.uid() = from_id or auth.uid() = to_id);

create policy "dm send" on public.direct_messages
  for insert
  to authenticated
  with check (
    auth.uid() = from_id
    and from_id <> to_id
    and char_length(body) <= 1000
  );

do $$
begin
  alter publication supabase_realtime add table public.direct_messages;
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 5) Complete account delete (cascades + auth.users)
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

  delete from public.buddy_requests
  where from_id = uid or to_id = uid;

  delete from public.mentor_requests
  where student_id = uid or mentor_id = uid;

  delete from public.direct_messages
  where from_id = uid or to_id = uid;

  delete from public.group_messages where user_id = uid;
  delete from public.group_members where user_id = uid;

  update public.groups
  set owner_id = null
  where owner_id = uid;

  delete from public.user_docs where user_id = uid;
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;

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

-- ===========================================================================
-- 2026-10-08 (part D1): security review fixes. Safe to re-run.
-- Same SQL as supabase/migrations/2026-10-08-security.sql.
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

-- ===========================================================================
-- 2026-10-08 (part D2): moderation workflow. Safe to re-run.
-- Same SQL as supabase/migrations/2026-10-08-moderation.sql.
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
