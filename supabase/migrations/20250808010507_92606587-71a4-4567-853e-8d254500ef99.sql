-- Create study_plans table to store generated plans per user
CREATE TABLE IF NOT EXISTS public.study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  weak_areas TEXT[] NOT NULL DEFAULT '{}',
  daily_lessons JSONB NOT NULL DEFAULT '[]',
  estimated_duration INTEGER NOT NULL DEFAULT 0,
  difficulty_level TEXT NOT NULL DEFAULT 'medium',
  grade_level TEXT,
  region TEXT,
  status TEXT NOT NULL DEFAULT 'saved',
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can insert their own study plans" ON public.study_plans;
CREATE POLICY "Users can insert their own study plans"
ON public.study_plans
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own study plans" ON public.study_plans;
CREATE POLICY "Users can view their own study plans"
ON public.study_plans
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own study plans" ON public.study_plans;
CREATE POLICY "Users can update their own study plans"
ON public.study_plans
FOR UPDATE
USING (auth.uid() = user_id);

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_study_plans_user_id ON public.study_plans(user_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_study_plans_updated_at ON public.study_plans;
CREATE TRIGGER trg_study_plans_updated_at
BEFORE UPDATE ON public.study_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();