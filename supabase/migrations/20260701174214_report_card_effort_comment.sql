-- Report card: per-subject Effort rating + per-subject teacher Comment.
-- These live on rubric_grades (one row per student/subject/term/academic_year), so the
-- report card grid reads Effort and the page-2 Subject|Comment table straight from the
-- same row as the marks. Teachers enter them in the Semester Marks tab; that tab upserts
-- ONLY these two columns (disjoint from the score columns the Rubric tab owns), so the
-- two entry points never overwrite each other.
--
-- Effort codes mirror the printed behavior legend (O/VG/G/IS/S/NI/U). No RLS change is
-- needed: the existing teacher ("manage rubric grades for their subjects") and admin
-- ("manage rubric grades") ALL policies already cover the new columns.

alter table public.rubric_grades
  add column if not exists effort text
    check (effort is null or effort in ('O','VG','G','IS','S','NI','U')),
  add column if not exists comment text;
