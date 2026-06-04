
ALTER TABLE public.teacher_lesson_plans
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_teacher_lesson_plans_updated_at ON public.teacher_lesson_plans;
CREATE TRIGGER trg_teacher_lesson_plans_updated_at
  BEFORE UPDATE ON public.teacher_lesson_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
