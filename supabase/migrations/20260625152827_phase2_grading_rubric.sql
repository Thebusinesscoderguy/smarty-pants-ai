-- Phase 2: Grading Rubric + excused-absence model.

-- Configurable absence reasons (per school). Each (subject_id, attendance_date)
-- group in student_attendance is treated as one "session".
create table if not exists public.attendance_reasons (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.school_accounts(id) on delete cascade,
  label text not null,
  excused boolean not null default false,
  created_at timestamptz not null default now(),
  unique (school_id, label)
);
alter table public.attendance_reasons enable row level security;
create policy "School admins manage attendance reasons" on public.attendance_reasons
  for all to authenticated
  using (school_id in (select id from school_accounts where admin_user_id = auth.uid()))
  with check (school_id in (select id from school_accounts where admin_user_id = auth.uid()));
create policy "Authenticated read attendance reasons" on public.attendance_reasons
  for select to authenticated using (true);

-- Seed default reasons for existing schools.
insert into public.attendance_reasons (school_id, label, excused)
select sa.id, r.label, r.excused
from public.school_accounts sa
cross join (values ('Medical', true), ('Family', true), ('Unexcused', false)) as r(label, excused)
on conflict (school_id, label) do nothing;

-- Link each attendance row to an optional reason (only meaningful when absent).
alter table public.student_attendance
  add column if not exists reason_id uuid references public.attendance_reasons(id) on delete set null;

-- Rubric: 7 weighted components; total is DB-generated and bounded to 100 by the
-- per-column CHECKs (20+20+20+10+10+10+10 = 100). No client can over-enter.
create table if not exists public.rubric_grades (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.school_accounts(id) on delete cascade,
  student_id uuid not null,
  subject_id uuid not null references public.school_subjects(id) on delete cascade,
  term text not null,
  academic_year text not null,
  teacher_id uuid references public.school_teachers(id) on delete set null,
  exam_score numeric not null default 0 check (exam_score between 0 and 20),
  quiz_score numeric not null default 0 check (quiz_score between 0 and 20),
  attendance_score numeric not null default 0 check (attendance_score between 0 and 20),
  literacy_score numeric not null default 0 check (literacy_score between 0 and 10),
  project_score numeric not null default 0 check (project_score between 0 and 10),
  cw_score numeric not null default 0 check (cw_score between 0 and 10),
  hw_score numeric not null default 0 check (hw_score between 0 and 10),
  total numeric generated always as (
    exam_score + quiz_score + attendance_score + literacy_score + project_score + cw_score + hw_score
  ) stored,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, subject_id, term, academic_year)
);
alter table public.rubric_grades enable row level security;

create policy "School admins manage rubric grades" on public.rubric_grades
  for all to authenticated
  using (school_id in (select id from school_accounts where admin_user_id = auth.uid()))
  with check (school_id in (select id from school_accounts where admin_user_id = auth.uid()));

create policy "Teachers manage rubric grades for their subjects" on public.rubric_grades
  for all to authenticated
  using (subject_id in (
    select tss.subject_id from teacher_subject_sections tss
    join school_teachers t on t.id = tss.teacher_id
    where lower(t.email) = lower((auth.jwt() ->> 'email')) and t.is_active = true
  ))
  with check (subject_id in (
    select tss.subject_id from teacher_subject_sections tss
    join school_teachers t on t.id = tss.teacher_id
    where lower(t.email) = lower((auth.jwt() ->> 'email')) and t.is_active = true
  ));

create policy "Students view own rubric grades" on public.rubric_grades
  for select to authenticated using (student_id = auth.uid());

create policy "Parents view their children rubric grades" on public.rubric_grades
  for select to authenticated
  using (student_id in (
    select pcr.child_id from parent_child_relationships pcr where pcr.parent_id = auth.uid()
  ));
