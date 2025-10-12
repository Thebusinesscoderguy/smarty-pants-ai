-- Create or refresh triggers to call public.update_quest_progress on relevant events
-- Wrap in a transaction for safety
begin;

-- Ensure the function exists (do not overwrite here since it's already defined in the project)
-- We rely on the existing public.update_quest_progress() implementation.

-- USER PROGRESS: fire on insert and update (needed to detect status transitions)
DROP TRIGGER IF EXISTS trg_update_quest_progress_on_user_progress ON public.user_progress;
CREATE TRIGGER trg_update_quest_progress_on_user_progress
AFTER INSERT OR UPDATE ON public.user_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_quest_progress();

-- QUIZ ATTEMPTS: fire on insert (when an attempt is recorded)
DROP TRIGGER IF EXISTS trg_update_quest_progress_on_quiz_attempts ON public.quiz_attempts;
CREATE TRIGGER trg_update_quest_progress_on_quiz_attempts
AFTER INSERT ON public.quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION public.update_quest_progress();

-- TEST ATTEMPTS: fire on insert
DROP TRIGGER IF EXISTS trg_update_quest_progress_on_test_attempts ON public.test_attempts;
CREATE TRIGGER trg_update_quest_progress_on_test_attempts
AFTER INSERT ON public.test_attempts
FOR EACH ROW
EXECUTE FUNCTION public.update_quest_progress();

-- STUDENT INTERACTIONS: fire on insert
DROP TRIGGER IF EXISTS trg_update_quest_progress_on_student_interactions ON public.student_interactions;
CREATE TRIGGER trg_update_quest_progress_on_student_interactions
AFTER INSERT ON public.student_interactions
FOR EACH ROW
EXECUTE FUNCTION public.update_quest_progress();

commit;