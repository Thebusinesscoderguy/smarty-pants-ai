CREATE OR REPLACE FUNCTION public.update_quest_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  quest_record RECORD;
  progress_record RECORD;
  user_id_to_use UUID;
  subject_name TEXT;
BEGIN
  -- Determine user_id based on the trigger table
  IF TG_TABLE_NAME = 'student_interactions' THEN
    user_id_to_use := NEW.student_id;
  ELSIF TG_TABLE_NAME = 'quiz_attempts' THEN
    user_id_to_use := NEW.user_id;
  ELSIF TG_TABLE_NAME = 'user_progress' THEN
    user_id_to_use := NEW.user_id;
    -- Only process if lesson is being marked as completed (and wasn't already completed)
    IF NEW.status != 'completed' OR (OLD IS NOT NULL AND OLD.status = 'completed') THEN
      RETURN NEW;
    END IF;

    -- Try to resolve the subject name from the lesson
    IF NEW.lesson_id IS NOT NULL THEN
      SELECT s.name INTO subject_name
      FROM lessons l
      JOIN modules m ON m.id = l.module_id
      JOIN subjects s ON s.id = m.subject_id
      WHERE l.id = NEW.lesson_id
      LIMIT 1;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Loop through active quests for this user
  FOR quest_record IN 
    SELECT q.* FROM quests q 
    WHERE q.is_active = true 
      AND (q.expires_at IS NULL OR q.expires_at > now())
  LOOP
    -- Check if user already has progress for this quest
    SELECT * INTO progress_record 
    FROM user_quest_progress 
    WHERE user_id = user_id_to_use AND quest_id = quest_record.id;
    
    -- Initialize progress if doesn't exist
    IF progress_record IS NULL THEN
      INSERT INTO user_quest_progress (user_id, quest_id, current_value, status)
      VALUES (user_id_to_use, quest_record.id, 0, 'active');
      
      SELECT * INTO progress_record 
      FROM user_quest_progress 
      WHERE user_id = user_id_to_use AND quest_id = quest_record.id;
    END IF;

    -- Skip if already completed
    IF progress_record.completed THEN
      CONTINUE;
    END IF;

    -- Determine if this quest should increment for this event
    IF TG_TABLE_NAME = 'user_progress' THEN
      -- Match lesson-based quests or math-specific quests
      IF 
        -- Generic lesson/study/learn quests (match in title or description)
        quest_record.title ILIKE '%lesson%' OR quest_record.description ILIKE '%lesson%'
        OR quest_record.title ILIKE '%study%' OR quest_record.description ILIKE '%study%'
        OR quest_record.title ILIKE '%learn%' OR quest_record.description ILIKE '%learn%'
        OR (
          -- Math-specific: only increment when both the lesson's subject and quest mention math
          COALESCE(subject_name, '') ILIKE '%math%'
          AND (quest_record.title ILIKE '%math%' OR quest_record.description ILIKE '%math%')
        )
      THEN
        UPDATE user_quest_progress 
        SET current_value = current_value + 1, updated_at = now()
        WHERE user_id = user_id_to_use AND quest_id = quest_record.id;
      END IF;

    ELSIF quest_record.type = 'daily' AND quest_record.title ILIKE '%message%' AND TG_TABLE_NAME = 'student_interactions' THEN
      -- Daily messaging quest
      UPDATE user_quest_progress 
      SET current_value = current_value + 1, updated_at = now()
      WHERE user_id = user_id_to_use AND quest_id = quest_record.id;

    ELSIF quest_record.type = 'weekly' AND quest_record.title ILIKE '%study%' AND TG_TABLE_NAME = 'student_interactions' THEN
      -- Weekly study quest (based on time spent)
      UPDATE user_quest_progress 
      SET current_value = current_value + 5, updated_at = now()
      WHERE user_id = user_id_to_use AND quest_id = quest_record.id;

    ELSIF (quest_record.title ILIKE '%quiz%' OR quest_record.title ILIKE '%test%') AND TG_TABLE_NAME = 'quiz_attempts' THEN
      -- Quiz/test related quests
      UPDATE user_quest_progress 
      SET current_value = current_value + 1, updated_at = now()
      WHERE user_id = user_id_to_use AND quest_id = quest_record.id;

    ELSIF quest_record.title ILIKE '%learn%' AND TG_TABLE_NAME = 'student_interactions' THEN
      -- General learning quest
      UPDATE user_quest_progress 
      SET current_value = current_value + 1, updated_at = now()
      WHERE user_id = user_id_to_use AND quest_id = quest_record.id;
    END IF;

    -- Check if quest is completed and update
    UPDATE user_quest_progress 
    SET completed = true,
        completed_at = now()
    WHERE user_id = user_id_to_use 
      AND quest_id = quest_record.id 
      AND current_value >= quest_record.target_value 
      AND NOT completed;
  END LOOP;
  
  RETURN NEW;
END;
$function$;