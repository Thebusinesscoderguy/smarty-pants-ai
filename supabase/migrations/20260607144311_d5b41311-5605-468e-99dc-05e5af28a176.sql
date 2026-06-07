DROP VIEW IF EXISTS public.school_curriculum_coverage CASCADE;
DROP TABLE IF EXISTS public.content_curriculum_tags CASCADE;
DROP TABLE IF EXISTS public.school_curriculum_settings CASCADE;
DROP TABLE IF EXISTS public.curriculum_units CASCADE;
DROP TABLE IF EXISTS public.curriculum_grade_levels CASCADE;
DROP TABLE IF EXISTS public.curriculum_subjects CASCADE;
DROP TABLE IF EXISTS public.curriculum_frameworks CASCADE;
ALTER TABLE public.school_onboarding_progress DROP COLUMN IF EXISTS framework_chosen;