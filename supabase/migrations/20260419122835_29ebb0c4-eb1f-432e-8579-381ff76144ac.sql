ALTER TABLE public.curriculum_units
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS estimated_minutes integer,
  ADD COLUMN IF NOT EXISTS difficulty_level text CHECK (difficulty_level IN ('beginner','intermediate','advanced')),
  ADD COLUMN IF NOT EXISTS exam_topics jsonb DEFAULT '[]'::jsonb;