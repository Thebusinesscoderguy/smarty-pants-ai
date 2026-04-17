-- Add quality tracking to curriculum_units
ALTER TABLE public.curriculum_units
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'ai_generated',
  ADD COLUMN IF NOT EXISTS source_reference text,
  ADD COLUMN IF NOT EXISTS confidence_score numeric,
  ADD COLUMN IF NOT EXISTS generation_model text,
  ADD COLUMN IF NOT EXISTS generated_at timestamp with time zone;

-- Restrict allowed values
DO $$ BEGIN
  ALTER TABLE public.curriculum_units
    ADD CONSTRAINT curriculum_units_verification_status_check
    CHECK (verification_status IN ('ai_generated','ai_cross_verified','verified','community'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Launch scope flag on frameworks (so we can hide unverified MOE frameworks at launch)
ALTER TABLE public.curriculum_frameworks
  ADD COLUMN IF NOT EXISTS launch_visible boolean NOT NULL DEFAULT true;

-- Telemetry: which units actually get used by content generation
CREATE TABLE IF NOT EXISTS public.curriculum_unit_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_unit_id uuid NOT NULL REFERENCES public.curriculum_units(id) ON DELETE CASCADE,
  user_id uuid,
  school_id uuid,
  content_type text NOT NULL,
  content_id uuid,
  used_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_unit_usage_unit ON public.curriculum_unit_usage(curriculum_unit_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_unit_usage_used_at ON public.curriculum_unit_usage(used_at DESC);

ALTER TABLE public.curriculum_unit_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_insert_authenticated"
  ON public.curriculum_unit_usage FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "usage_read_own"
  ON public.curriculum_unit_usage FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid()));

-- Helpful index for backfill idempotency checks
CREATE INDEX IF NOT EXISTS idx_curriculum_units_combo
  ON public.curriculum_units(framework_id, grade_level_id, subject_id);