-- Configurable per-school semester date ranges. The gradebook Summary uses these to
-- bound period-based components (classwork/homework two-stage average, attendance roll-up)
-- to a semester. When no row exists for a (school, academic_year, semester) the Summary
-- falls back to all-time aggregation, so grades keep working before dates are configured.

create table if not exists public.school_semester_dates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.school_accounts(id) on delete cascade,
  academic_year text not null,
  semester text not null check (semester in ('S1', 'S2')),
  start_date date not null,
  end_date date not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, academic_year, semester)
);

alter table public.school_semester_dates enable row level security;

create policy "School admins manage semester dates" on public.school_semester_dates
  for all to authenticated
  using (school_id in (select id from school_accounts where admin_user_id = auth.uid()))
  with check (school_id in (select id from school_accounts where admin_user_id = auth.uid()));

create policy "Authenticated read semester dates" on public.school_semester_dates
  for select to authenticated using (true);
