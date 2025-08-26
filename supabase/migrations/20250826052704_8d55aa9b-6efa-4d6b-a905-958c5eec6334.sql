-- Create user quest progress table
CREATE TABLE public.user_quest_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  current_value INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, quest_id)
);

-- Enable RLS
ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for user quest progress
CREATE POLICY "Users can view their own quest progress" 
ON public.user_quest_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quest progress" 
ON public.user_quest_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quest progress" 
ON public.user_quest_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Function to auto-progress quests based on activity
CREATE OR REPLACE FUNCTION public.update_quest_progress()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  quest_record RECORD;
  progress_record RECORD;
BEGIN
  -- Loop through active quests for this user
  FOR quest_record IN 
    SELECT q.* FROM quests q 
    WHERE q.is_active = true 
    AND (q.expires_at IS NULL OR q.expires_at > now())
  LOOP
    -- Check if user already has progress for this quest
    SELECT * INTO progress_record 
    FROM user_quest_progress 
    WHERE user_id = NEW.student_id AND quest_id = quest_record.id;
    
    -- Initialize progress if doesn't exist
    IF progress_record IS NULL THEN
      INSERT INTO user_quest_progress (user_id, quest_id, current_value)
      VALUES (NEW.student_id, quest_record.id, 0);
      
      SELECT * INTO progress_record 
      FROM user_quest_progress 
      WHERE user_id = NEW.student_id AND quest_id = quest_record.id;
    END IF;
    
    -- Skip if already completed
    IF progress_record.completed THEN
      CONTINUE;
    END IF;
    
    -- Update progress based on quest type
    IF quest_record.type = 'daily' AND quest_record.title ILIKE '%message%' THEN
      -- Daily messaging quest
      UPDATE user_quest_progress 
      SET current_value = current_value + 1,
          updated_at = now()
      WHERE user_id = NEW.student_id AND quest_id = quest_record.id;
      
    ELSIF quest_record.type = 'weekly' AND quest_record.title ILIKE '%study%' THEN
      -- Weekly study quest (based on time spent)
      UPDATE user_quest_progress 
      SET current_value = current_value + 5, -- 5 minutes per interaction
          updated_at = now()
      WHERE user_id = NEW.student_id AND quest_id = quest_record.id;
      
    ELSIF quest_record.title ILIKE '%quiz%' OR quest_record.title ILIKE '%test%' THEN
      -- Quiz/test related quests
      UPDATE user_quest_progress 
      SET current_value = current_value + 1,
          updated_at = now()
      WHERE user_id = NEW.student_id AND quest_id = quest_record.id;
    END IF;
    
    -- Check if quest is completed and update
    UPDATE user_quest_progress 
    SET completed = true,
        completed_at = now()
    WHERE user_id = NEW.student_id 
    AND quest_id = quest_record.id 
    AND current_value >= quest_record.target_value 
    AND NOT completed;
    
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for quest progress on student interactions
CREATE TRIGGER update_quest_progress_trigger
  AFTER INSERT ON student_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quest_progress();

-- Create trigger for quest progress on quiz attempts
CREATE TRIGGER update_quest_progress_quiz_trigger
  AFTER INSERT ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quest_progress();

-- Update updated_at trigger for user_quest_progress
CREATE TRIGGER update_user_quest_progress_updated_at
  BEFORE UPDATE ON public.user_quest_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();