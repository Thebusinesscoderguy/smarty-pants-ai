-- Parent portal read access
-- The Family Hub shows a parent their own children's real academic data.
-- Until now parents had RLS access to report cards, invoices and school news,
-- but NOT to attendance, daily grades, semester marks, or subject names — so
-- those surfaces would always read empty for a parent even when data exists.
--
-- These policies grant parents READ-ONLY (SELECT) access strictly scoped to
-- their own children via parent_child_relationships. They mirror the existing
-- "Parents view their children invoices" / "Parents view children published
-- report cards" policies. No write access is granted.

-- Helper predicate (inlined per-policy): the row's student belongs to a child
-- of the current parent.

-- 1) Attendance records
DROP POLICY IF EXISTS "Parents view their children attendance" ON public.attendance_records;
CREATE POLICY "Parents view their children attendance"
ON public.attendance_records FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.parent_child_relationships pcr
    WHERE pcr.parent_id = auth.uid() AND pcr.child_id = attendance_records.student_id
  )
);

-- 2) Daily grades (classwork / homework)
DROP POLICY IF EXISTS "Parents view their children daily grades" ON public.student_daily_grades;
CREATE POLICY "Parents view their children daily grades"
ON public.student_daily_grades FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.parent_child_relationships pcr
    WHERE pcr.parent_id = auth.uid() AND pcr.child_id = student_daily_grades.student_id
  )
);

-- 3) Semester marks
DROP POLICY IF EXISTS "Parents view their children semester marks" ON public.student_semester_marks;
CREATE POLICY "Parents view their children semester marks"
ON public.student_semester_marks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.parent_child_relationships pcr
    WHERE pcr.parent_id = auth.uid() AND pcr.child_id = student_semester_marks.student_id
  )
);

-- 4) Subject names (needed to label grades). Low-sensitivity: subject name only,
-- scoped to the schools the parent's children are enrolled in.
DROP POLICY IF EXISTS "Parents view subjects in their children schools" ON public.school_subjects;
CREATE POLICY "Parents view subjects in their children schools"
ON public.school_subjects FOR SELECT
TO authenticated
USING (
  school_id IN (
    SELECT ssr.school_id
    FROM public.school_student_relationships ssr
    JOIN public.parent_child_relationships pcr ON pcr.child_id = ssr.student_id
    WHERE pcr.parent_id = auth.uid() AND ssr.is_active = true
  )
);
