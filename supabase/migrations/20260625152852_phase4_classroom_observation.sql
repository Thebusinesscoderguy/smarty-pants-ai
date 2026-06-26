-- Phase 4: Classroom Observation (leader-gated = school admin).
create table if not exists public.observation_templates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.school_accounts(id) on delete cascade,
  name text not null,
  criteria jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.observation_templates enable row level security;
create policy "School admins manage observation templates" on public.observation_templates
  for all to authenticated
  using (school_id in (select id from school_accounts where admin_user_id = auth.uid()))
  with check (school_id in (select id from school_accounts where admin_user_id = auth.uid()));
-- Teachers can read templates for their school (to view their observation's criteria).
create policy "Teachers read observation templates in their school" on public.observation_templates
  for select to authenticated
  using (school_id in (
    select school_id from school_teachers
    where lower(email) = lower((auth.jwt() ->> 'email')) and is_active = true
  ));

create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.school_accounts(id) on delete cascade,
  observer_id uuid not null default auth.uid(),
  teacher_id uuid not null references public.school_teachers(id) on delete cascade,
  section_id uuid references public.school_sections(id) on delete set null,
  template_id uuid references public.observation_templates(id) on delete set null,
  responses jsonb not null default '{}'::jsonb,
  notes text,
  status text not null default 'draft' check (status in ('draft','submitted','acknowledged')),
  observed_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.observations enable row level security;
create index if not exists observations_teacher_idx on public.observations (teacher_id);

-- Leaders (school admins) create + manage all observations in their school.
create policy "School admins manage observations" on public.observations
  for all to authenticated
  using (school_id in (select id from school_accounts where admin_user_id = auth.uid()))
  with check (school_id in (select id from school_accounts where admin_user_id = auth.uid()));

-- Observed teacher: read own observations.
create policy "Teachers view own observations" on public.observations
  for select to authenticated
  using (teacher_id in (
    select id from school_teachers
    where lower(email) = lower((auth.jwt() ->> 'email')) and is_active = true
  ));

-- Observed teacher: acknowledge own observations (app sets status='acknowledged').
create policy "Teachers acknowledge own observations" on public.observations
  for update to authenticated
  using (teacher_id in (
    select id from school_teachers
    where lower(email) = lower((auth.jwt() ->> 'email')) and is_active = true
  ))
  with check (teacher_id in (
    select id from school_teachers
    where lower(email) = lower((auth.jwt() ->> 'email')) and is_active = true
  ));
