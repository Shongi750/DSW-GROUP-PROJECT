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
  avatar_url text
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
    coalesce(p.profile->'public'->>'avatarUrl', '')
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
