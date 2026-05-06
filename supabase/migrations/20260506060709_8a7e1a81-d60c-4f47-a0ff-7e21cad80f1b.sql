
-- 1. Recreate SECURITY DEFINER views as security_invoker
ALTER VIEW public.student_leaderboard SET (security_invoker = true);
ALTER VIEW public.user_quest_progress_detailed SET (security_invoker = true);

-- 2. Lock down search_path on test_quest_system
ALTER FUNCTION public.test_quest_system(uuid) SET search_path = public;

-- 3. Replace overly permissive RLS policies

-- student_activity_logs: service role only
DROP POLICY IF EXISTS "Service can insert activity logs" ON public.student_activity_logs;
CREATE POLICY "Service can insert activity logs"
  ON public.student_activity_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- student_ai_summaries: service role only
DROP POLICY IF EXISTS "System can insert summaries" ON public.student_ai_summaries;
CREATE POLICY "System can insert summaries"
  ON public.student_ai_summaries
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- quest_events: service role only updates
DROP POLICY IF EXISTS "Service can update events" ON public.quest_events;
CREATE POLICY "Service can update events"
  ON public.quest_events
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- content_curriculum_tags: signed-in users only
DROP POLICY IF EXISTS "cct_insert" ON public.content_curriculum_tags;
CREATE POLICY "cct_insert"
  ON public.content_curriculum_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- curriculum_unit_usage: signed-in users only
DROP POLICY IF EXISTS "usage_insert_authenticated" ON public.curriculum_unit_usage;
CREATE POLICY "usage_insert_authenticated"
  ON public.curriculum_unit_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
