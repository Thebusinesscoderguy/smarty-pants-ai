-- Phase 7: Professional Growth Goals (tight v1: create -> update progress -> achieved).
create table if not exists public.growth_goals (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.school_accounts(id) on delete cascade,
  owner_id uuid not null,
  owner_type text not null check (owner_type in ('teacher','student')),
  title text not null,
  description text,
  target_date date,
  status text not null default 'not_started' check (status in ('not_started','in_progress','achieved')),
  progress int not null default 0 check (progress between 0 and 100),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.growth_goals enable row level security;
create index if not exists growth_goals_owner_idx on public.growth_goals (owner_id);

-- Owner manages own goals.
create policy "Owners manage own growth goals" on public.growth_goals
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
-- School admins manage all goals in their school.
create policy "School admins manage growth goals" on public.growth_goals
  for all to authenticated
  using (school_id in (select id from school_accounts where admin_user_id = auth.uid()))
  with check (school_id in (select id from school_accounts where admin_user_id = auth.uid()));
-- Teachers (supervisors) view goals of students they teach.
create policy "Teachers view their students growth goals" on public.growth_goals
  for select to authenticated
  using (
    owner_type = 'student' and owner_id in (
      select ss.student_id
      from section_students ss
      join teacher_subject_sections tss on tss.section_id = ss.section_id
      join school_teachers t on t.id = tss.teacher_id
      where lower(t.email) = lower((auth.jwt() ->> 'email')) and t.is_active = true
    )
  );

create table if not exists public.goal_updates (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.growth_goals(id) on delete cascade,
  note text,
  progress int check (progress between 0 and 100),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.goal_updates enable row level security;
create index if not exists goal_updates_goal_idx on public.goal_updates (goal_id, created_at);

-- Updates inherit goal visibility: the subquery is itself RLS-filtered, so a user
-- can only read/insert updates for goals they can already see.
create policy "View updates on accessible goals" on public.goal_updates
  for select to authenticated
  using (goal_id in (select id from growth_goals));
create policy "Insert updates on accessible goals" on public.goal_updates
  for insert to authenticated
  with check (goal_id in (select id from growth_goals));
