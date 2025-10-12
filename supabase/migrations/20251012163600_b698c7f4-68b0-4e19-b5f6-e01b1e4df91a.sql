-- Re-apply function and clean triggers using IF EXISTS without dynamic SQL

-- 1) Replace function with requirements logic (idempotent)
CREATE OR REPLACE FUNCTION public.update_quest_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  quest_record RECORD;
  progress_record RECORD;
  user_id_to_use UUID;
  subject_name TEXT;
  event_subject_id UUID;
  event_percentage NUMERIC;
  event_type TEXT;
  req_trigger_type TEXT;
  req_subject_id UUID;
  req_min_percentage NUMERIC;
  trigger_types TEXT[];
BEGIN
  IF TG_TABLE_NAME = 'student_interactions' THEN
    user_id_to_use := NEW.student_id;
    event_type := 'interaction';
    event_subject_id := NEW.subject_id;
  ELSIF TG_TABLE_NAME = 'quiz_attempts' THEN
    user_id_to_use := NEW.user_id;
    event_type := 'quiz_completed';
    IF NEW.total_possible IS NOT NULL AND NEW.total_possible > 0 THEN
      event_percentage := (NEW.score::NUMERIC * 100.0) / NEW.total_possible;
    END IF;
    SELECT q.subject_id INTO event_subject_id FROM quizzes q WHERE q.id = NEW.quiz_id;
  ELSIF TG_TABLE_NAME = 'test_attempts' THEN
    user_id_to_use := NEW.student_id;
    event_type := 'test_completed';
    IF NEW.percentage IS NOT NULL THEN event_percentage := NEW.percentage; END IF;
  ELSIF TG_TABLE_NAME = 'user_progress' THEN
    user_id_to_use := NEW.user_id;
    event_type := 'lesson_completed';
    IF NEW.status != 'completed' OR (OLD IS NOT NULL AND OLD.status = 'completed') THEN
      RETURN NEW;
    END IF;
    IF NEW.lesson_id IS NOT NULL THEN
      SELECT s.name, s.id INTO subject_name, event_subject_id
      FROM lessons l
      JOIN modules m ON m.id = l.module_id
      JOIN subjects s ON s.id = m.subject_id
      WHERE l.id = NEW.lesson_id
      LIMIT 1;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  FOR quest_record IN 
    SELECT q.* FROM quests q 
    WHERE q.is_active = true 
      AND (q.expires_at IS NULL OR q.expires_at > now())
      AND (
        q.assigned_children IS NULL OR q.assigned_children = '{}'::uuid[] OR user_id_to_use = ANY(q.assigned_children)
        OR q.created_by = 'system'
      )
  LOOP
    SELECT * INTO progress_record 
    FROM user_quest_progress 
    WHERE user_id = user_id_to_use AND quest_id = quest_record.id;

    IF progress_record IS NULL THEN
      INSERT INTO user_quest_progress (user_id, quest_id, current_value, status)
      VALUES (user_id_to_use, quest_record.id, 0, 'active');
      SELECT * INTO progress_record 
      FROM user_quest_progress 
      WHERE user_id = user_id_to_use AND quest_id = quest_record.id;
    END IF;

    IF progress_record.completed THEN CONTINUE; END IF;

    req_trigger_type := NULLIF(quest_record.requirements->>'trigger_type', '');
    req_subject_id := NULLIF(quest_record.requirements->>'subject_id', '')::uuid;
    req_min_percentage := NULLIF(quest_record.requirements->>'min_percentage', '')::numeric;

    SELECT COALESCE(array_agg(elem), ARRAY[]::text[])
    INTO trigger_types
    FROM (
      SELECT jsonb_array_elements_text(quest_record.requirements->'trigger_types') AS elem
    ) s;
    IF trigger_types = ARRAY[]::text[] THEN trigger_types := NULL; END IF;

    IF quest_record.requirements IS NOT NULL AND quest_record.requirements <> '{}'::jsonb THEN
      IF (trigger_types IS NOT NULL AND NOT (event_type = ANY(trigger_types)))
         AND (req_trigger_type IS NULL OR req_trigger_type <> event_type) THEN
        CONTINUE;
      END IF;

      IF req_subject_id IS NOT NULL THEN
        IF event_subject_id IS NULL OR event_subject_id <> req_subject_id THEN CONTINUE; END IF;
      ELSE
        IF (quest_record.requirements ? 'subject_name') THEN
          IF TG_TABLE_NAME = 'user_progress' THEN
            IF subject_name IS NULL OR lower(subject_name) NOT LIKE '%' || lower(quest_record.requirements->>'subject_name') || '%' THEN CONTINUE; END IF;
          ELSIF TG_TABLE_NAME = 'test_attempts' THEN
            PERFORM 1 FROM tests t WHERE t.id = NEW.test_id AND lower(COALESCE(t.subject, '')) LIKE '%' || lower(quest_record.requirements->>'subject_name') || '%';
            IF NOT FOUND THEN CONTINUE; END IF;
          ELSIF TG_TABLE_NAME = 'quiz_attempts' THEN
            PERFORM 1 FROM quizzes q JOIN subjects s ON s.id = q.subject_id
             WHERE q.id = NEW.quiz_id AND lower(s.name) LIKE '%' || lower(quest_record.requirements->>'subject_name') || '%';
            IF NOT FOUND THEN CONTINUE; END IF;
          END IF;
        END IF;
      END IF;

      IF req_min_percentage IS NOT NULL THEN
        IF event_percentage IS NULL OR event_percentage < req_min_percentage THEN CONTINUE; END IF;
      END IF;

      UPDATE user_quest_progress 
      SET current_value = current_value + 1, updated_at = now()
      WHERE user_id = user_id_to_use AND quest_id = quest_record.id;

    ELSE
      IF TG_TABLE_NAME = 'user_progress' THEN
        IF quest_record.title ILIKE '%lesson%' OR quest_record.description ILIKE '%lesson%'
           OR quest_record.title ILIKE '%study%' OR quest_record.description ILIKE '%study%'
           OR quest_record.title ILIKE '%learn%' OR quest_record.description ILIKE '%learn%'
           OR (COALESCE(subject_name, '') ILIKE '%math%' AND (quest_record.title ILIKE '%math%' OR quest_record.description ILIKE '%math%')) THEN
          UPDATE user_quest_progress SET current_value = current_value + 1, updated_at = now()
          WHERE user_id = user_id_to_use AND quest_id = quest_record.id;
        END IF;
      ELSIF TG_TABLE_NAME IN ('quiz_attempts','test_attempts') THEN
        IF quest_record.title ILIKE '%quiz%' OR quest_record.title ILIKE '%test%' THEN
          UPDATE user_quest_progress SET current_value = current_value + 1, updated_at = now()
          WHERE user_id = user_id_to_use AND quest_id = quest_record.id;
        END IF;
      ELSIF TG_TABLE_NAME = 'student_interactions' THEN
        IF quest_record.type = 'daily' AND quest_record.title ILIKE '%message%' THEN
          UPDATE user_quest_progress SET current_value = current_value + 1, updated_at = now()
          WHERE user_id = user_id_to_use AND quest_id = quest_record.id;
        ELSIF quest_record.type = 'weekly' AND quest_record.title ILIKE '%study%' THEN
          UPDATE user_quest_progress SET current_value = current_value + GREATEST(1, COALESCE(NEW.response_time_ms, 300) / 300), updated_at = now()
          WHERE user_id = user_id_to_use AND quest_id = quest_record.id;
        ELSIF quest_record.title ILIKE '%learn%' THEN
          UPDATE user_quest_progress SET current_value = current_value + 1, updated_at = now()
          WHERE user_id = user_id_to_use AND quest_id = quest_record.id;
        END IF;
      END IF;
    END IF;

    UPDATE user_quest_progress 
    SET completed = true, completed_at = now(), status = 'completed'
    WHERE user_id = user_id_to_use AND quest_id = quest_record.id AND current_value >= quest_record.target_value AND NOT completed;
  END LOOP;
  RETURN NEW;
END;
$$;

-- 2) Drop duplicates safely
DROP TRIGGER IF EXISTS track_lesson_completion_for_quests ON public.user_progress;
DROP TRIGGER IF EXISTS trg_update_quest_on_user_progress ON public.user_progress;
DROP TRIGGER IF EXISTS trg_update_quest_on_student_interactions ON public.student_interactions;
DROP TRIGGER IF EXISTS update_quest_progress_trigger ON public.student_interactions;
DROP TRIGGER IF EXISTS trg_update_quest_on_quiz_attempts ON public.quiz_attempts;
DROP TRIGGER IF EXISTS update_quest_progress_quiz_trigger ON public.quiz_attempts;
DROP TRIGGER IF EXISTS trg_update_quest_on_test_attempts ON public.test_attempts;

-- 3) Recreate clean triggers with precise conditions
CREATE TRIGGER trg_update_quest_on_user_progress_insert
  AFTER INSERT ON public.user_progress
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.update_quest_progress();

CREATE TRIGGER trg_update_quest_on_user_progress_update
  AFTER UPDATE ON public.user_progress
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed'))
  EXECUTE FUNCTION public.update_quest_progress();

CREATE TRIGGER trg_update_quest_on_student_interactions
  AFTER INSERT ON public.student_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quest_progress();

CREATE TRIGGER trg_update_quest_on_quiz_attempts
  AFTER INSERT ON public.quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quest_progress();

CREATE TRIGGER trg_update_quest_on_test_attempts
  AFTER INSERT ON public.test_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quest_progress();