-- Phase 3: Behavior Management.
create table if not exists public.behavior_categories (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.school_accounts(id) on delete cascade,
  name text not null,
  valence text not null check (valence in ('positive','negative')),
  default_points int not null default 0,
  created_at timestamptz not null default now(),
  unique (school_id, name)
);
alter table public.behavior_categories enable row level security;
create policy "School admins manage behavior categories" on public.behavior_categories
  for all to authenticated
  using (school_id in (select id from school_accounts where admin_user_id = auth.uid()))
  with check (school_id in (select id from school_accounts where admin_user_id = auth.uid()));
create policy "Authenticated read behavior categories" on public.behavior_categories
  for select to authenticated using (true);

create table if not exists public.behavior_incidents (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.school_accounts(id) on delete cascade,
  student_id uuid not null,
  recorded_by uuid not null default auth.uid(),
  category_id uuid references public.behavior_categories(id) on delete set null,
  valence text not null check (valence in ('positive','negative')),
  description text,
  points int not null default 0,
  incident_date date not null default current_date,
  created_at timestamptz not null default now()
);
alter table public.behavior_incidents enable row level security;
create index if not exists behavior_incidents_student_idx on public.behavior_incidents (student_id, incident_date);

-- School admins: full control over their school's incidents.
create policy "School admins manage behavior incidents" on public.behavior_incidents
  for all to authenticated
  using (school_id in (select id from school_accounts where admin_user_id = auth.uid()))
  with check (school_id in (select id from school_accounts where admin_user_id = auth.uid()));

-- Teachers: manage incidents within a school they actively teach in.
create policy "Teachers manage behavior incidents in their school" on public.behavior_incidents
  for all to authenticated
  using (school_id in (
    select school_id from school_teachers
    where lower(email) = lower((auth.jwt() ->> 'email')) and is_active = true
  ))
  with check (school_id in (
    select school_id from school_teachers
    where lower(email) = lower((auth.jwt() ->> 'email')) and is_active = true
  ));

-- Parents see only their own child's record; students see their own.
create policy "Parents view their child behavior" on public.behavior_incidents
  for select to authenticated
  using (student_id in (
    select pcr.child_id from parent_child_relationships pcr where pcr.parent_id = auth.uid()
  ));
create policy "Students view own behavior" on public.behavior_incidents
  for select to authenticated using (student_id = auth.uid());
