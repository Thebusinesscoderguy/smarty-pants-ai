
-- Helper: school membership
CREATE OR REPLACE FUNCTION public.is_school_member(_user_id uuid, _school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    EXISTS(SELECT 1 FROM public.school_accounts WHERE id = _school_id AND admin_user_id = _user_id)
    OR EXISTS(SELECT 1 FROM public.school_teachers WHERE school_id = _school_id
              AND lower(email) = lower(coalesce(auth.jwt()->>'email','')) AND is_active = true)
    OR EXISTS(SELECT 1 FROM public.school_staff WHERE school_id = _school_id
              AND (user_id = _user_id OR lower(email) = lower(coalesce(auth.jwt()->>'email','')))
              AND is_active = true)
    OR EXISTS(SELECT 1 FROM public.section_students ss
              JOIN public.school_sections sec ON sec.id = ss.section_id
              WHERE sec.school_id = _school_id AND ss.student_id = _user_id);
$$;
REVOKE EXECUTE ON FUNCTION public.is_school_member(uuid, uuid) FROM anon;

-- student_invitations: remove anon/auth broad SELECT (edge function handles validation)
DROP POLICY IF EXISTS "Anyone can validate invitations by code" ON public.student_invitations;

-- ai_event_classifications: restrict ALL to service_role
DROP POLICY IF EXISTS "Service can manage classifications" ON public.ai_event_classifications;
CREATE POLICY "Service role manages classifications" ON public.ai_event_classifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- quest_event_links
DROP POLICY IF EXISTS "Service can manage event links" ON public.quest_event_links;
CREATE POLICY "Service role manages event links" ON public.quest_event_links
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- learning_analytics
DROP POLICY IF EXISTS "System can update analytics" ON public.learning_analytics;
CREATE POLICY "Service role manages analytics" ON public.learning_analytics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- subscribers
DROP POLICY IF EXISTS "Service can manage subscriptions" ON public.subscribers;
CREATE POLICY "Service role manages subscriptions" ON public.subscribers
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- user_usage
DROP POLICY IF EXISTS "System manages usage" ON public.user_usage;
CREATE POLICY "Service role manages usage" ON public.user_usage
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- demo_requests: explicit service_role-only SELECT
DROP POLICY IF EXISTS "Service role reads demo requests" ON public.demo_requests;
CREATE POLICY "Service role reads demo requests" ON public.demo_requests
  FOR SELECT TO service_role USING (true);

-- report_card_settings: scope reads to school members
DROP POLICY IF EXISTS "Anyone in school can read report card settings" ON public.report_card_settings;
DROP POLICY IF EXISTS "Authenticated read report card settings" ON public.report_card_settings;
CREATE POLICY "School members read report card settings" ON public.report_card_settings
  FOR SELECT TO authenticated
  USING (public.is_school_member(auth.uid(), school_id));

-- report_card_templates
DROP POLICY IF EXISTS "Members view templates" ON public.report_card_templates;
CREATE POLICY "School members view report card templates" ON public.report_card_templates
  FOR SELECT TO authenticated
  USING (public.is_school_member(auth.uid(), school_id));

-- tests: only creator or assigned students (school admins are typically the creator)
DROP POLICY IF EXISTS "Users can view tests they created or are assigned to" ON public.tests;
CREATE POLICY "Creators and assigned students can view tests" ON public.tests
  FOR SELECT TO authenticated
  USING (
    auth.uid() = creator_id
    OR public.is_test_assigned_to_student(id, auth.uid())
  );

-- test_questions: tighten via tests visibility
DROP POLICY IF EXISTS "Users can view questions for accessible tests" ON public.test_questions;
CREATE POLICY "Users can view questions for accessible tests" ON public.test_questions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_questions.test_id
        AND (t.creator_id = auth.uid() OR public.is_test_assigned_to_student(t.id, auth.uid()))
    )
  );

-- storage: student-avatars — restrict UPDATE/DELETE to owner OR school admin
DROP POLICY IF EXISTS "Authenticated users can update student avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete student avatars" ON storage.objects;
CREATE POLICY "Owner or school admin can update student avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'student-avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM public.school_accounts sa WHERE sa.admin_user_id = auth.uid())
    )
  );
CREATE POLICY "Owner or school admin can delete student avatars" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'student-avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM public.school_accounts sa WHERE sa.admin_user_id = auth.uid())
    )
  );

-- storage: study_materials INSERT — require own folder
DROP POLICY IF EXISTS "Users can upload study materials to their folder" ON storage.objects;
CREATE POLICY "Users can upload study materials to their folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'study_materials'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
