-- #5 (leak): get_message_threads() exposed every thread in a user's school via the
--   get_user_school_ids() clause. Remove school-wide visibility entirely — each user
--   sees ONLY threads they participate in (own parent threads; own teacher threads).
--   No school-wide view for anyone, admins included.
-- #4 (scoping): parent_teacher_threads INSERT only checked parent_id = auth.uid().
--   Replace with a strict check mirroring start_message_thread so a parent can only
--   create a thread for their OWN child with an active teacher at that child's school.
--   (start_message_thread is SECURITY DEFINER / BYPASSRLS, so teacher-initiated
--   threads are unaffected.)

create or replace function public.get_message_threads()
 returns table(thread_id uuid, parent_id uuid, teacher_id uuid, student_id uuid, school_id uuid, teacher_name text, parent_name text, student_name text, last_message text, last_message_at timestamp with time zone, unread_count bigint, is_parent boolean, is_teacher boolean)
 language sql stable security definer set search_path to 'public'
as $function$
  WITH me AS (SELECT auth.uid() AS uid, lower(auth.jwt() ->> 'email') AS email),
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
    COALESCE(NULLIF(trim(coalesce(t.first_name,'') || ' ' || coalesce(t.last_name,'')), ''), t.email),
    pp.display_name, sp.display_name, lm.message, v.last_message_at,
    COALESCE(uc.cnt, 0),
    (v.parent_id = (SELECT uid FROM me)),
    (v.teacher_id IN (SELECT id FROM my_teacher_ids))
  FROM visible v
  LEFT JOIN public.school_teachers t ON t.id = v.teacher_id
  LEFT JOIN public.profiles pp ON pp.id = v.parent_id
  LEFT JOIN public.profiles sp ON sp.id = v.student_id
  LEFT JOIN LATERAL (SELECT m.message FROM public.parent_teacher_messages m
    WHERE m.thread_id = v.id ORDER BY m.created_at DESC LIMIT 1) lm ON true
  LEFT JOIN LATERAL (SELECT count(*) AS cnt FROM public.parent_teacher_messages m
    WHERE m.thread_id = v.id AND m.read_at IS NULL AND m.sender_id <> (SELECT uid FROM me)) uc ON true
  ORDER BY v.last_message_at DESC NULLS LAST;
$function$;

drop policy if exists "School admins view all threads" on public.parent_teacher_threads;

drop policy if exists "Parents view own threads" on public.parent_teacher_threads;

create policy "Parents view own threads" on public.parent_teacher_threads
  for select to authenticated using (parent_id = auth.uid());

create policy "Parents update own threads" on public.parent_teacher_threads
  for update to authenticated using (parent_id = auth.uid()) with check (parent_id = auth.uid());

create policy "Parents delete own threads" on public.parent_teacher_threads
  for delete to authenticated using (parent_id = auth.uid());

create policy "Parents create scoped threads" on public.parent_teacher_threads
  for insert to authenticated
  with check (
    parent_id = auth.uid()
    and exists (select 1 from public.parent_child_relationships pcr
                where pcr.parent_id = auth.uid() and pcr.child_id = student_id)
    and exists (select 1 from public.school_teachers t
                where t.id = teacher_id and t.school_id = school_id and t.is_active = true)
    and exists (select 1 from public.school_student_relationships ssr
                where ssr.student_id = student_id and ssr.school_id = school_id and ssr.is_active = true)
  );
