-- Function to auto-progress quests based on activity
CREATE OR REPLACE FUNCTION public.update_quest_progress()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  quest_record RECORD;
  progress_record RECORD;
  user_id_to_use UUID;
BEGIN
  -- Determine user_id based on the trigger table
  IF TG_TABLE_NAME = 'student_interactions' THEN
    user_id_to_use := NEW.student_id;
  ELSIF TG_TABLE_NAME = 'quiz_attempts' THEN
    user_id_to_use := NEW.user_id;
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
      INSERT INTO user_quest_progress (user_id, quest_id, current_value)
      VALUES (user_id_to_use, quest_record.id, 0);
      
      SELECT * INTO progress_record 
      FROM user_quest_progress 
      WHERE user_id = user_id_to_use AND quest_id = quest_record.id;
    END IF;
    
    -- Skip if already completed
    IF progress_record.completed THEN
      CONTINUE;
    END IF;
    
    -- Update progress based on quest type and activity
    IF quest_record.type = 'daily' AND quest_record.title ILIKE '%message%' AND TG_TABLE_NAME = 'student_interactions' THEN
      -- Daily messaging quest
      UPDATE user_quest_progress 
      SET current_value = current_value + 1,
          updated_at = now()
      WHERE user_id = user_id_to_use AND quest_id = quest_record.id;
      
    ELSIF quest_record.type = 'weekly' AND quest_record.title ILIKE '%study%' AND TG_TABLE_NAME = 'student_interactions' THEN
      -- Weekly study quest (based on time spent)
      UPDATE user_quest_progress 
      SET current_value = current_value + 5, -- 5 minutes per interaction
          updated_at = now()
      WHERE user_id = user_id_to_use AND quest_id = quest_record.id;
      
    ELSIF (quest_record.title ILIKE '%quiz%' OR quest_record.title ILIKE '%test%') AND TG_TABLE_NAME = 'quiz_attempts' THEN
      -- Quiz/test related quests
      UPDATE user_quest_progress 
      SET current_value = current_value + 1,
          updated_at = now()
      WHERE user_id = user_id_to_use AND quest_id = quest_record.id;
      
    ELSIF quest_record.title ILIKE '%learn%' AND TG_TABLE_NAME = 'student_interactions' THEN
      -- General learning quest
      UPDATE user_quest_progress 
      SET current_value = current_value + 1,
          updated_at = now()
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

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_quest_progress_trigger ON student_interactions;
DROP TRIGGER IF EXISTS update_quest_progress_quiz_trigger ON quiz_attempts;

-- Create triggers for quest progress
CREATE TRIGGER update_quest_progress_trigger
  AFTER INSERT ON student_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quest_progress();

CREATE TRIGGER update_quest_progress_quiz_trigger
  AFTER INSERT ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quest_progress();