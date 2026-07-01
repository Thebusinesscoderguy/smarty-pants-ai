-- Grade publishing: teachers publish grades on a biweekly-Wednesday cadence (Riyadh time);
-- students/parents see ONLY published items. Raw grade tables become teacher/admin-only.

-- ============================================================================
-- 1. Term-start config (week-numbering anchor). Decoupled from school_semester_state.
-- ============================================================================
create table if not exists public.school_grade_settings (
  school_id uuid primary key references public.school_accounts(id) on delete cascade,
  term_start_date date,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
alter table public.school_grade_settings enable row level security;

create policy "School admins manage grade settings" on public.school_grade_settings
  for all to authenticated
  using (school_id in (select id from school_accounts where admin_user_id = auth.uid()))
  with check (school_id in (select id from school_accounts where admin_user_id = auth.uid()));
create policy "Authenticated read grade settings" on public.school_grade_settings
  for select to authenticated using (true);

-- ============================================================================
-- 2. Published grade items — the feed cards students/parents see.
-- ============================================================================
create table if not exists public.published_grades (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.school_accounts(id) on delete cascade,
  student_id uuid not null,
  subject_id uuid not null references public.school_subjects(id) on delete cascade,
  teacher_id uuid,
  component text not null,          -- classwork|homework|literacy|attendance|quiz1|quiz2|final_exam|project
  title text,                       -- optional custom title; else frontend composes from component
  is_weekly boolean not null,
  week_number int,
  occurred_on date,
  mark_value numeric,
  mark_max numeric,
  semester text not null,
  published_at timestamptz not null default now(),
  published_by uuid
);
-- Idempotency: one weekly item per component per term-week, one one-off per component per semester.
create unique index if not exists published_grades_weekly_uk
  on public.published_grades (student_id, subject_id, component, week_number, semester) where is_weekly;
create unique index if not exists published_grades_oneoff_uk
  on public.published_grades (student_id, subject_id, component, semester) where not is_weekly;
create index if not exists published_grades_student_idx on public.published_grades (student_id);

alter table public.published_grades enable row level security;

-- Reads: students (own), parents (children), teachers (their subjects), admins (their school).
create policy "Students view own published grades" on public.published_grades
  for select to authenticated using (student_id = auth.uid());
create policy "Parents view children published grades" on public.published_grades
  for select to authenticated
  using (student_id in (select pcr.child_id from parent_child_relationships pcr where pcr.parent_id = auth.uid()));
create policy "Teachers view published grades for their subjects" on public.published_grades
  for select to authenticated
  using (subject_id in (
    select tss.subject_id from teacher_subject_sections tss
    join school_teachers t on t.id = tss.teacher_id
    where lower(t.email) = lower((auth.jwt() ->> 'email')) and t.is_active = true
  ));
create policy "School admins manage published grades" on public.published_grades
  for all to authenticated
  using (school_id in (select id from school_accounts where admin_user_id = auth.uid()))
  with check (school_id in (select id from school_accounts where admin_user_id = auth.uid()));
-- NOTE: teachers have NO direct insert/update policy — they publish only via publish_grades().

-- ============================================================================
-- 3. Privacy lockdown: students/parents can no longer read RAW grades.
--    Teachers/admins keep their existing ALL policies.
-- ============================================================================
drop policy if exists "Students can view their own daily grades" on public.student_daily_grades;
drop policy if exists "Parents view their children daily grades" on public.student_daily_grades;
drop policy if exists "Students view own rubric grades" on public.rubric_grades;
drop policy if exists "Parents view their children rubric grades" on public.rubric_grades;
drop policy if exists "Students can view their own semester marks" on public.student_semester_marks;
drop policy if exists "Parents view their children semester marks" on public.student_semester_marks;
drop policy if exists "Students can view their own attendance" on public.student_attendance;

-- ============================================================================
-- 4. publish_grades(subject) — SECURITY DEFINER; enforces authz + biweekly-Wed gate,
--    rolls up weekly marks (reusing the two-stage first-stage average) + one-offs.
-- ============================================================================
create or replace function public.publish_grades(p_subject_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text := lower(auth.jwt() ->> 'email');
  v_school_id uuid;
  v_is_admin boolean;
  v_is_teacher boolean;
  v_term_start date;
  v_today date := (now() at time zone 'Asia/Riyadh')::date;
  v_p0 date;
  v_sem text;
  v_win_start date;
  v_cur_week int;
  v_ay int;
  v_ay_text text;
  v_term_label text;
  v_count int := 0;
  v_n int;
begin
  select school_id into v_school_id from school_subjects where id = p_subject_id;
  if v_school_id is null then raise exception 'Subject not found'; end if;

  select exists(select 1 from school_accounts where id = v_school_id and admin_user_id = v_uid) into v_is_admin;
  select exists(
    select 1 from teacher_subject_sections tss join school_teachers t on t.id = tss.teacher_id
    where tss.subject_id = p_subject_id and lower(t.email) = v_email and t.is_active = true
  ) into v_is_teacher;
  if not (v_is_admin or v_is_teacher) then
    raise exception 'Not authorized to publish for this subject';
  end if;

  select term_start_date into v_term_start from school_grade_settings where school_id = v_school_id;
  if v_term_start is null then raise exception 'Term start date is not set'; end if;

  -- Gate: today (Riyadh) must be a Wednesday on the 14-day cadence from P0
  -- (P0 = first Wednesday on/after term start). dow: 0=Sun..3=Wed..6=Sat.
  v_p0 := v_term_start + (((3 - extract(dow from v_term_start)::int) + 7) % 7);
  if extract(dow from v_today)::int <> 3
     or v_today < v_p0
     or ((v_today - v_p0) % 14) <> 0 then
    raise exception 'Publishing is only available on the biweekly Wednesday';
  end if;

  select coalesce(active_semester, 'S1') into v_sem from school_semester_state where school_id = v_school_id;
  v_sem := coalesce(v_sem, 'S1');
  v_win_start := v_today - 13;                            -- 14-day window ending today
  v_cur_week  := ((v_today - v_term_start) / 7) + 1;

  -- rubric term key (quizzes) — derived like the app (Aug boundary), never teacher-set.
  v_ay := case when extract(month from v_today) >= 8 then extract(year from v_today)::int
               else extract(year from v_today)::int - 1 end;
  v_ay_text := v_ay || '-' || (v_ay + 1);
  v_term_label := case v_sem when 'S1' then 'Semester 1' else 'Semester 2' end;

  -- ---- Weekly items: CW / HW / Literacy (avg per term-week) + Attendance (present/total) ----
  insert into published_grades
    (school_id, student_id, subject_id, teacher_id, component, is_weekly, week_number, occurred_on, mark_value, mark_max, semester, published_by)
  select v_school_id, x.student_id, p_subject_id, null, x.component, true, x.week_number,
         (v_term_start + x.week_number * 7 - 1), x.mark_value, x.mark_max, v_sem, v_uid
  from (
    select student_id, ((grade_date - v_term_start) / 7 + 1) as week_number,
           'classwork' as component, round(avg(classwork_mark)::numeric, 2) as mark_value, 10 as mark_max
    from student_daily_grades
    where subject_id = p_subject_id and semester = v_sem
      and grade_date between v_win_start and v_today and classwork_mark is not null
    group by student_id, ((grade_date - v_term_start) / 7 + 1)
    union all
    select student_id, ((grade_date - v_term_start) / 7 + 1),
           'homework', round(avg(homework_mark)::numeric, 2), 10
    from student_daily_grades
    where subject_id = p_subject_id and semester = v_sem
      and grade_date between v_win_start and v_today and homework_mark is not null
    group by student_id, ((grade_date - v_term_start) / 7 + 1)
    union all
    select student_id, ((grade_date - v_term_start) / 7 + 1),
           'literacy', round(avg(literacy_mark)::numeric, 2), 10
    from student_daily_grades
    where subject_id = p_subject_id and semester = v_sem
      and grade_date between v_win_start and v_today and literacy_mark is not null
    group by student_id, ((grade_date - v_term_start) / 7 + 1)
    union all
    select student_id, ((attendance_date - v_term_start) / 7 + 1),
           'attendance', count(*) filter (where is_present)::numeric, count(*)::numeric
    from student_attendance
    where subject_id = p_subject_id and semester = v_sem
      and attendance_date between v_win_start and v_today
    group by student_id, ((attendance_date - v_term_start) / 7 + 1)
  ) x
  on conflict do nothing;
  get diagnostics v_n = row_count; v_count := v_count + v_n;

  -- ---- One-off items: Quiz 1 / Quiz 2 (rubric_grades) — only where a mark exists ----
  insert into published_grades
    (school_id, student_id, subject_id, teacher_id, component, is_weekly, week_number, occurred_on, mark_value, mark_max, semester, published_by)
  select v_school_id, r.student_id, p_subject_id, null, c.component, false, v_cur_week, v_today, c.val, 20, v_sem, v_uid
  from rubric_grades r
  cross join lateral (values ('quiz1', r.quiz1_score), ('quiz2', r.quiz2_score)) as c(component, val)
  where r.subject_id = p_subject_id and r.term = v_term_label and r.academic_year = v_ay_text
    and c.val is not null and c.val > 0
  on conflict do nothing;
  get diagnostics v_n = row_count; v_count := v_count + v_n;

  -- ---- One-off items: Final Exam (/20) + Project (/10) (student_semester_marks) ----
  insert into published_grades
    (school_id, student_id, subject_id, teacher_id, component, is_weekly, week_number, occurred_on, mark_value, mark_max, semester, published_by)
  select v_school_id, m.student_id, p_subject_id, null, c.component, false, v_cur_week, v_today, c.val, c.maxv, v_sem, v_uid
  from student_semester_marks m
  cross join lateral (values ('final_exam', m.final_exam_mark, 20), ('project', m.project_mark, 10)) as c(component, val, maxv)
  where m.subject_id = p_subject_id and m.semester = v_sem and c.val is not null
  on conflict do nothing;
  get diagnostics v_n = row_count; v_count := v_count + v_n;

  return v_count;
end;
$$;

revoke all on function public.publish_grades(uuid) from public, anon;
grant execute on function public.publish_grades(uuid) to authenticated;
