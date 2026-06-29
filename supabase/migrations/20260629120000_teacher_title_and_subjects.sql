-- Teacher identity upgrade: title + multi-subject + canonical display label
--
-- Adds:
--   * school_teachers.title           — admin-selected honorific (Mr./Mrs./Ms./Dr.)
--   * teacher_subjects                 — subject(s) a teacher teaches, captured at
--                                        invite time (independent of sections)
--   * join_names()                     — "A", "A and B", "A, B and C" (connector
--                                        passed in so the UI language decides it)
--   * format_teacher_label()           — single source of truth for the parent/
--                                        student-facing "[Title] [Last] — [Subjects]"
--                                        string, with graceful fallbacks
--   * get_teacher_labels()             — batch label lookup for client surfaces
--                                        (e.g. the school news feed) that cannot
--                                        read school_teachers under RLS
--
-- Display subjects = DISTINCT union of teacher_subjects (invite-captured) and
-- teacher_subject_sections (section assignments), so both sources show.

-- ── 1. Title column ──────────────────────────────────────────────────────────
ALTER TABLE public.school_teachers
  ADD COLUMN IF NOT EXISTS title text;

-- ── 2. teacher_subjects (subject-only assignment) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.teacher_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.school_teachers(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.school_subjects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, subject_id)
);

ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;

-- Mirror the RLS shape used by teacher_subject_sections.
DROP POLICY IF EXISTS "School admins can manage teacher subjects" ON public.teacher_subjects;
CREATE POLICY "School admins can manage teacher subjects"
  ON public.teacher_subjects FOR ALL
  USING (teacher_id IN (
    SELECT t.id FROM public.school_teachers t
    JOIN public.school_accounts sa ON sa.id = t.school_id
    WHERE sa.admin_user_id = auth.uid()
  ))
  WITH CHECK (teacher_id IN (
    SELECT t.id FROM public.school_teachers t
    JOIN public.school_accounts sa ON sa.id = t.school_id
    WHERE sa.admin_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Teachers can view their own subjects" ON public.teacher_subjects;
CREATE POLICY "Teachers can view their own subjects"
  ON public.teacher_subjects FOR SELECT
  USING (teacher_id IN (
    SELECT id FROM public.school_teachers
    WHERE lower(email) = lower(auth.jwt()->>'email') AND is_active = true
  ));

-- ── 3. join_names(): list joiner with caller-supplied connector ───────────────
-- p_and is the localized "and" word so the UI language, not the DB, decides it.
CREATE OR REPLACE FUNCTION public.join_names(p_names text[], p_and text DEFAULT 'and')
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_names IS NULL OR array_length(p_names, 1) IS NULL THEN NULL
    WHEN array_length(p_names, 1) = 1 THEN p_names[1]
    ELSE array_to_string(p_names[1:array_length(p_names, 1) - 1], ', ')
         || ' ' || p_and || ' ' || p_names[array_length(p_names, 1)]
  END;
$$;

-- ── 4. format_teacher_label(): the one canonical display string ───────────────
-- "[Title] [Last] — [Subjects]". Fallbacks (never returns undefined/blank):
--   last name present → "[Title ]Last"  (title optional)
--   else              → "First Last"     (whatever name exists)
--   else              → email
-- Subjects clause is dropped entirely when the teacher has none.
CREATE OR REPLACE FUNCTION public.format_teacher_label(p_teacher_id uuid, p_and text DEFAULT 'and')
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH t AS (
    SELECT title, first_name, last_name, email
    FROM public.school_teachers
    WHERE id = p_teacher_id
  ),
  subs AS (
    SELECT array_agg(name ORDER BY name) AS subjects
    FROM (
      SELECT DISTINCT s.name
      FROM public.school_subjects s
      WHERE s.id IN (
        SELECT subject_id FROM public.teacher_subjects        WHERE teacher_id = p_teacher_id
        UNION
        SELECT subject_id FROM public.teacher_subject_sections WHERE teacher_id = p_teacher_id
      )
    ) d
  ),
  base AS (
    SELECT COALESCE(
      CASE WHEN coalesce((SELECT last_name FROM t), '') <> ''
           THEN trim(coalesce((SELECT title FROM t), '') || ' ' || (SELECT last_name FROM t))
      END,
      NULLIF(trim(coalesce((SELECT first_name FROM t), '') || ' ' || coalesce((SELECT last_name FROM t), '')), ''),
      (SELECT email FROM t)
    ) AS name_part
  )
  SELECT CASE
    WHEN (SELECT subjects FROM subs) IS NULL THEN (SELECT name_part FROM base)
    ELSE (SELECT name_part FROM base) || ' — ' || public.join_names((SELECT subjects FROM subs), p_and)
  END;
$$;

-- ── 5. get_teacher_labels(): batch lookup for client surfaces ────────────────
-- SECURITY DEFINER so parents/students (who cannot read school_teachers) can still
-- resolve a teacher's display label, e.g. the news feed author line.
CREATE OR REPLACE FUNCTION public.get_teacher_labels(p_ids uuid[], p_and text DEFAULT 'and')
RETURNS TABLE (teacher_id uuid, label text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, public.format_teacher_label(id, p_and)
  FROM public.school_teachers
  WHERE id = ANY (p_ids);
$$;

REVOKE EXECUTE ON FUNCTION public.get_teacher_labels(uuid[], text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_teacher_labels(uuid[], text) TO authenticated, service_role;
