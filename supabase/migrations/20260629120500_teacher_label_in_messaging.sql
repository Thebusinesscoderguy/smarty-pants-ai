-- Use format_teacher_label() everywhere a teacher is named to a parent/student.
--
-- Updates the two SECURITY DEFINER messaging RPCs so the teacher shows as
-- "[Title] [Last] — [Subjects]" instead of a bare "First Last" / email. The
-- "and" connector is localized from the CALLER's profiles.preferred_language so
-- "Physics and Social Studies" reads correctly in each UI language.
--
-- Behaviour preserved verbatim except the teacher-name expression. (Rebased on
-- 20260628190000 which removed school-wide thread visibility.)

-- ── get_message_threads() ────────────────────────────────────────────────────
create or replace function public.get_message_threads()
 returns table(thread_id uuid, parent_id uuid, teacher_id uuid, student_id uuid, school_id uuid, teacher_name text, parent_name text, student_name text, last_message text, last_message_at timestamp with time zone, unread_count bigint, is_parent boolean, is_teacher boolean)
 language sql stable security definer set search_path to 'public'
as $function$
  WITH me AS (
    SELECT
      auth.uid() AS uid,
      lower(auth.jwt() ->> 'email') AS email,
      (SELECT CASE WHEN lower(coalesce(p.preferred_language, 'en')) = 'ar' THEN 'و' ELSE 'and' END
         FROM public.profiles p WHERE p.id = auth.uid()) AS conn
  ),
  my_teacher_ids AS (
    SELECT t.id FROM public.school_teachers t, me
    WHERE lower(t.email) = me.email AND t.is_active = true
  ),
  visible AS (
    SELECT th.* FROM public.parent_teacher_threads th, me
    WHERE th.parent_id = me.uid
       OR th.teacher_id IN (SELECT id FROM my_teacher_ids)
  )
  SELECT v.id, v.parent_id, v.teacher_id, v.student_id, v.school_id,
    public.format_teacher_label(v.teacher_id, (SELECT conn FROM me)),
    pp.display_name, sp.display_name, lm.message, v.last_message_at,
    COALESCE(uc.cnt, 0),
    (v.parent_id = (SELECT uid FROM me)),
    (v.teacher_id IN (SELECT id FROM my_teacher_ids))
  FROM visible v
  LEFT JOIN public.profiles pp ON pp.id = v.parent_id
  LEFT JOIN public.profiles sp ON sp.id = v.student_id
  LEFT JOIN LATERAL (SELECT m.message FROM public.parent_teacher_messages m
    WHERE m.thread_id = v.id ORDER BY m.created_at DESC LIMIT 1) lm ON true
  LEFT JOIN LATERAL (SELECT count(*) AS cnt FROM public.parent_teacher_messages m
    WHERE m.thread_id = v.id AND m.read_at IS NULL AND m.sender_id <> (SELECT uid FROM me)) uc ON true
  ORDER BY v.last_message_at DESC NULLS LAST;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_message_threads() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_message_threads() TO authenticated, service_role;

-- ── get_messageable_contacts() ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_messageable_contacts()
RETURNS TABLE (
  student_id       uuid,
  student_name     text,
  counterpart_id   uuid,
  counterpart_name text,
  counterpart_kind text,
  school_id        uuid
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH me AS (
    SELECT
      auth.uid() AS uid,
      lower(auth.jwt() ->> 'email') AS email,
      (SELECT CASE WHEN lower(coalesce(p.preferred_language, 'en')) = 'ar' THEN 'و' ELSE 'and' END
         FROM public.profiles p WHERE p.id = auth.uid()) AS conn
  )
  -- parent → teachers in their children's schools
  SELECT DISTINCT
    ssr.student_id,
    COALESCE(sp.display_name, 'Student'),
    t.id,
    public.format_teacher_label(t.id, (SELECT conn FROM me)),
    'teacher'::text,
    ssr.school_id
  FROM me
  JOIN public.parent_child_relationships pcr      ON pcr.parent_id = me.uid
  JOIN public.school_student_relationships ssr    ON ssr.student_id = pcr.child_id AND ssr.is_active = true
  JOIN public.school_teachers t                   ON t.school_id = ssr.school_id AND t.is_active = true
  LEFT JOIN public.profiles sp                    ON sp.id = ssr.student_id

  UNION

  -- teacher → parents of students in their sections
  SELECT DISTINCT
    ss.student_id,
    COALESCE(sp.display_name, 'Student'),
    pcr.parent_id,
    COALESCE(pp.display_name, 'Parent'),
    'parent'::text,
    t.school_id
  FROM me
  JOIN public.school_teachers t                   ON lower(t.email) = me.email AND t.is_active = true
  JOIN public.teacher_subject_sections tss        ON tss.teacher_id = t.id
  JOIN public.section_students ss                 ON ss.section_id = tss.section_id
  JOIN public.parent_child_relationships pcr      ON pcr.child_id = ss.student_id
  LEFT JOIN public.profiles sp                    ON sp.id = ss.student_id
  LEFT JOIN public.profiles pp                    ON pp.id = pcr.parent_id;
$$;

REVOKE EXECUTE ON FUNCTION public.get_messageable_contacts() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_messageable_contacts() TO authenticated, service_role;
