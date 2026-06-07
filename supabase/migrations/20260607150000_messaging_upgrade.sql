-- Parent ⇄ Teacher messaging upgrade
--
-- Adds the server-side plumbing for an Educore-grade messaging experience:
--   * realtime delivery for live messages + read receipts
--   * get_message_threads()      — caller's conversations with resolved
--                                  participant names, last message, unread count
--   * start_message_thread()     — create/open a conversation (lets BOTH parents
--                                  and teachers initiate; teachers cannot INSERT
--                                  threads directly under existing RLS)
--   * get_messageable_contacts() — who the caller can start a conversation with
--
-- All functions are SECURITY DEFINER and enforce participant authorization
-- internally, so the UI doesn't need broad cross-role read access to profiles /
-- school_teachers / parent_child_relationships.

-- ── 1. Realtime ──────────────────────────────────────────────────────────────
ALTER TABLE public.parent_teacher_messages REPLICA IDENTITY FULL;
ALTER TABLE public.parent_teacher_threads  REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.parent_teacher_messages;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'parent_teacher_messages already in supabase_realtime (or publication manages all tables)';
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.parent_teacher_threads;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'parent_teacher_threads already in supabase_realtime (or publication manages all tables)';
END $$;

-- ── 2. get_message_threads() ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_message_threads()
RETURNS TABLE (
  thread_id        uuid,
  parent_id        uuid,
  teacher_id       uuid,
  student_id       uuid,
  school_id        uuid,
  teacher_name     text,
  parent_name      text,
  student_name     text,
  last_message     text,
  last_message_at  timestamptz,
  unread_count     bigint,
  is_parent        boolean,
  is_teacher       boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH me AS (
    SELECT auth.uid() AS uid, lower(auth.jwt() ->> 'email') AS email
  ),
  my_teacher_ids AS (
    SELECT t.id FROM public.school_teachers t, me
    WHERE lower(t.email) = me.email AND t.is_active = true
  ),
  visible AS (
    SELECT th.*
    FROM public.parent_teacher_threads th, me
    WHERE th.parent_id = me.uid
       OR th.teacher_id IN (SELECT id FROM my_teacher_ids)
       OR th.school_id IN (SELECT public.get_user_school_ids(me.uid))
  )
  SELECT
    v.id,
    v.parent_id,
    v.teacher_id,
    v.student_id,
    v.school_id,
    COALESCE(NULLIF(trim(coalesce(t.first_name,'') || ' ' || coalesce(t.last_name,'')), ''), t.email),
    pp.display_name,
    sp.display_name,
    lm.message,
    v.last_message_at,
    COALESCE(uc.cnt, 0),
    (v.parent_id = (SELECT uid FROM me)),
    (v.teacher_id IN (SELECT id FROM my_teacher_ids))
  FROM visible v
  LEFT JOIN public.school_teachers t ON t.id = v.teacher_id
  LEFT JOIN public.profiles pp ON pp.id = v.parent_id
  LEFT JOIN public.profiles sp ON sp.id = v.student_id
  LEFT JOIN LATERAL (
    SELECT m.message
    FROM public.parent_teacher_messages m
    WHERE m.thread_id = v.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt
    FROM public.parent_teacher_messages m
    WHERE m.thread_id = v.id
      AND m.read_at IS NULL
      AND m.sender_id <> (SELECT uid FROM me)
  ) uc ON true
  ORDER BY v.last_message_at DESC NULLS LAST;
$$;

REVOKE EXECUTE ON FUNCTION public.get_message_threads() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_message_threads() TO authenticated, service_role;

-- ── 3. start_message_thread() ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.start_message_thread(p_student_id uuid, p_teacher_id uuid)
RETURNS uuid
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid        uuid := auth.uid();
  v_email      text := lower(auth.jwt() ->> 'email');
  v_school     uuid;
  v_parent     uuid;
  v_is_teacher boolean;
  v_thread     uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT school_id INTO v_school
  FROM public.school_teachers
  WHERE id = p_teacher_id AND is_active = true;
  IF v_school IS NULL THEN RAISE EXCEPTION 'invalid teacher'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.school_teachers
    WHERE id = p_teacher_id AND lower(email) = v_email AND is_active = true
  ) INTO v_is_teacher;

  IF v_is_teacher THEN
    -- caller is the teacher: resolve a linked parent for the student
    SELECT parent_id INTO v_parent
    FROM public.parent_child_relationships
    WHERE child_id = p_student_id
    LIMIT 1;
    IF v_parent IS NULL THEN RAISE EXCEPTION 'student has no linked parent'; END IF;
  ELSE
    -- caller must be the parent of the student
    SELECT parent_id INTO v_parent
    FROM public.parent_child_relationships
    WHERE child_id = p_student_id AND parent_id = v_uid
    LIMIT 1;
    IF v_parent IS NULL THEN RAISE EXCEPTION 'not authorized for this student'; END IF;
  END IF;

  -- integrity: the student must actually be enrolled in the teacher's school
  IF NOT EXISTS (
    SELECT 1 FROM public.school_student_relationships
    WHERE student_id = p_student_id AND school_id = v_school AND is_active = true
  ) THEN
    RAISE EXCEPTION 'student not enrolled in this school';
  END IF;

  INSERT INTO public.parent_teacher_threads (parent_id, teacher_id, student_id, school_id)
  VALUES (v_parent, p_teacher_id, p_student_id, v_school)
  ON CONFLICT (parent_id, teacher_id, student_id)
  DO UPDATE SET last_message_at = public.parent_teacher_threads.last_message_at
  RETURNING id INTO v_thread;

  RETURN v_thread;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.start_message_thread(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.start_message_thread(uuid, uuid) TO authenticated, service_role;

-- ── 4. get_messageable_contacts() ───────────────────────────────────────────
-- Unified contact list. For a parent caller, counterpart = a teacher in their
-- child's school. For a teacher caller, counterpart = the student's parent.
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
    SELECT auth.uid() AS uid, lower(auth.jwt() ->> 'email') AS email
  )
  -- parent → teachers in their children's schools
  SELECT DISTINCT
    ssr.student_id,
    COALESCE(sp.display_name, 'Student'),
    t.id,
    COALESCE(NULLIF(trim(coalesce(t.first_name,'') || ' ' || coalesce(t.last_name,'')), ''), t.email),
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
