-- Add status field to user_quest_progress to track failed quests
ALTER TABLE user_quest_progress 
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed'));

-- Update existing completed quests
UPDATE user_quest_progress 
SET status = 'completed' 
WHERE completed = true;

-- Create function to mark expired daily quests as failed
CREATE OR REPLACE FUNCTION mark_expired_daily_quests_as_failed()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mark daily quests as failed if they've expired and are not completed
  UPDATE user_quest_progress 
  SET status = 'failed'
  WHERE quest_id IN (
    SELECT q.id 
    FROM quests q 
    WHERE q.type = 'daily' 
    AND q.expires_at < NOW()
  )
  AND status = 'active'
  AND completed = false;
END;
$$;

-- Create trigger to automatically set expires_at for daily quests
CREATE OR REPLACE FUNCTION set_daily_quest_expiration()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If it's a daily quest and no expiration is set, set it to end of day
  IF NEW.type = 'daily' AND NEW.expires_at IS NULL THEN
    NEW.expires_at = DATE_TRUNC('day', NOW()) + INTERVAL '1 day' - INTERVAL '1 second';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new daily quests
DROP TRIGGER IF EXISTS set_daily_quest_expiration_trigger ON quests;
CREATE TRIGGER set_daily_quest_expiration_trigger
  BEFORE INSERT OR UPDATE ON quests
  FOR EACH ROW
  EXECUTE FUNCTION set_daily_quest_expiration();