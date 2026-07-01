-- Replace the date-range semester model with a simple "active semester" pointer.
-- Instead of admins configuring S1/S2 date ranges, each school has a currently-open
-- semester (starts at S1). Period marks are stamped with whichever semester was active
-- when entered, and an admin "End Semester" button advances S1 -> S2.

-- 1. Drop the (empty) date-range config table from the previous approach.
drop table if exists public.school_semester_dates cascade;

-- 2. Per-school active-semester pointer. Kept in its own table (not on school_accounts)
--    so teachers can READ it (authenticated read) to stamp their entries, while only
--    admins can flip it — school_accounts itself is admin-only readable.
create table if not exists public.school_semester_state (
  school_id uuid primary key references public.school_accounts(id) on delete cascade,
  active_semester text not null default 'S1' check (active_semester in ('S1', 'S2')),
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.school_semester_state enable row level security;

create policy "School admins manage semester state" on public.school_semester_state
  for all to authenticated
  using (school_id in (select id from school_accounts where admin_user_id = auth.uid()))
  with check (school_id in (select id from school_accounts where admin_user_id = auth.uid()));

create policy "Authenticated read semester state" on public.school_semester_state
  for select to authenticated using (true);

-- Seed every existing school as active in Semester 1.
insert into public.school_semester_state (school_id, active_semester)
select id, 'S1' from public.school_accounts
on conflict (school_id) do nothing;

-- 3. Stamp period marks with the semester they were entered under. Existing attendance
--    rows predate Semester 2, so they default to 'S1' (correct). Daily grades are empty.
alter table public.student_daily_grades
  add column if not exists semester text not null default 'S1' check (semester in ('S1', 'S2'));

alter table public.student_attendance
  add column if not exists semester text not null default 'S1' check (semester in ('S1', 'S2'));
