-- Literacy becomes a per-period mark (like classwork/homework) instead of a single
-- one-off mark on student_semester_marks. It reuses the existing per-period daily-grades
-- structure, so it inherits the semester stamp and the two-stage weekly->semester average.
-- student_semester_marks.literacy_mark is left in place (deprecated, no longer read/written).

alter table public.student_daily_grades
  add column if not exists literacy_mark numeric;
