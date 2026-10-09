-- ===========================================================================
-- 2026-10-08: AI Coach daily limit (supabase/functions/ai-coach).
-- Safe to re-run. Also included at the end of supabase/schema.sql.
-- Run once in the Supabase SQL editor (see DEPLOY-AI-COACH.md).
-- ===========================================================================

-- One row per student per South African day: how many AI Coach messages they sent.
create table if not exists public.ai_coach_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default ((now() at time zone 'Africa/Johannesburg')::date),
  messages integer not null default 0 check (messages >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.ai_coach_usage enable row level security;

-- Students may read their own count (the app can show "12 of 30 left").
-- There are NO insert / update / delete policies: only ai_coach_take() below can change counts,
-- so nobody can reset their own limit.
drop policy if exists "read own ai coach usage" on public.ai_coach_usage;
create policy "read own ai coach usage" on public.ai_coach_usage
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Campus admins can see totals for the dashboard.
drop policy if exists "admins read ai coach usage" on public.ai_coach_usage;
create policy "admins read ai coach usage" on public.ai_coach_usage
  for select
  to authenticated
  using (public.is_campus_admin());

-- Called by the ai-coach Edge Function with the student's own JWT, once per message.
-- Atomically adds 1 if they are under the daily limit (30). Returns
--   { allowed, used, limit, remaining }.
create or replace function public.ai_coach_take()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone 'Africa/Johannesburg')::date;
  daily_limit constant integer := 30;
  used integer;
begin
  if uid is null then
    raise exception 'sign in first';
  end if;

  insert into public.ai_coach_usage as u (user_id, day, messages)
  values (uid, today, 1)
  on conflict (user_id, day) do update
    set messages = u.messages + 1,
        updated_at = now()
    where u.messages < daily_limit
  returning u.messages into used;

  if used is null then
    -- Already at the limit: nothing was updated.
    select u.messages into used from public.ai_coach_usage u where u.user_id = uid and u.day = today;
    return jsonb_build_object('allowed', false, 'used', coalesce(used, daily_limit), 'limit', daily_limit, 'remaining', 0);
  end if;

  return jsonb_build_object('allowed', true, 'used', used, 'limit', daily_limit, 'remaining', greatest(daily_limit - used, 0));
end;
$$;

revoke all on function public.ai_coach_take() from public;
revoke all on function public.ai_coach_take() from anon;
grant execute on function public.ai_coach_take() to authenticated;

-- Old rows are not needed after a month.
create index if not exists ai_coach_usage_day_idx on public.ai_coach_usage (day);
