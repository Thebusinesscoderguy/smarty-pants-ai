-- Tighten RLS policies to authenticated role only (idempotent)
DROP POLICY IF EXISTS "Users can insert their own study plans" ON public.study_plans;
CREATE POLICY "Users can insert their own study plans"
ON public.study_plans
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own study plans" ON public.study_plans;
CREATE POLICY "Users can view their own study plans"
ON public.study_plans
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own study plans" ON public.study_plans;
CREATE POLICY "Users can update their own study plans"
ON public.study_plans
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Recreate timestamp function with fixed search_path to satisfy linter
-- Drop trigger first due to dependency
DROP TRIGGER IF EXISTS trg_study_plans_updated_at ON public.study_plans;
DROP FUNCTION IF EXISTS public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_study_plans_updated_at
BEFORE UPDATE ON public.study_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();