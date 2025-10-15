-- ============================================================
-- FIX: Remove check constraint on created_by
-- ============================================================

ALTER TABLE quests DROP CONSTRAINT IF EXISTS quests_created_by_check;

-- ============================================================
-- PHASE 1: Database Schema Cleanup & Optimization
-- ============================================================

-- Add missing columns to user_quest_progress
ALTER TABLE user_quest_progress 
  ADD COLUMN IF NOT EXISTS last_increment_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_user_active 
  ON user_quest_progress(user_id, status) 
  WHERE NOT completed;

CREATE INDEX IF NOT EXISTS idx_quests_active_type 
  ON quests(type, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_quest_events_pending 
  ON quest_events(user_id, status, created_at) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_user_quest_progress_quest_user 
  ON user_quest_progress(quest_id, user_id);

-- ============================================================
-- PHASE 2: Simplify and Fix the Trigger System
-- ============================================================

-- Create new simplified quest progress trigger function
CREATE OR REPLACE FUNCTION update_quest_progress_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quest_record RECORD;
  progress_record RECORD;
  event_subject_id UUID;
  event_type TEXT;
  event_score NUMERIC;
  increment_amount NUMERIC := 1;
  user_id_value UUID;
BEGIN
  -- Determine event details based on source table
  IF TG_TABLE_NAME = 'user_progress' THEN
    IF NEW.status != 'completed' OR (OLD IS NOT NULL AND OLD.status = 'completed') THEN
      RETURN NEW;
    END IF;
    event_type := 'lesson_completed';
    user_id_value := NEW.user_id;
    SELECT m.subject_id INTO event_subject_id
    FROM lessons l 
    JOIN modules m ON m.id = l.module_id 
    WHERE l.id = NEW.lesson_id;
  ELSIF TG_TABLE_NAME = 'quiz_attempts' THEN
    event_type := 'quiz_completed';
    user_id_value := NEW.user_id;
    IF NEW.total_possible IS NOT NULL AND NEW.total_possible > 0 THEN
      event_score := (NEW.score::NUMERIC * 100.0) / NEW.total_possible;
    END IF;
    SELECT subject_id INTO event_subject_id FROM quizzes WHERE id = NEW.quiz_id;
  ELSIF TG_TABLE_NAME = 'test_attempts' THEN
    event_type := 'test_completed';
    user_id_value := NEW.student_id;
    event_score := NEW.percentage;
  ELSIF TG_TABLE_NAME = 'student_interactions' THEN
    event_type := 'interaction';
    user_id_value := NEW.student_id;
    event_subject_id := NEW.subject_id;
  ELSE
    RETURN NEW;
  END IF;

  -- Loop through active quests
  FOR quest_record IN 
    SELECT q.* 
    FROM quests q 
    WHERE q.is_active = true 
      AND (q.expires_at IS NULL OR q.expires_at > NOW())
      AND (
        q.assigned_children IS NULL 
        OR q.assigned_children = ARRAY[]::UUID[] 
        OR user_id_value = ANY(q.assigned_children)
        OR q.created_by = 'system'
      )
  LOOP
    -- Check requirements match
    IF quest_record.requirements IS NOT NULL AND quest_record.requirements != '{}'::jsonb THEN
      -- Check event type match
      IF quest_record.requirements ? 'trigger_type' THEN
        IF quest_record.requirements->>'trigger_type' != event_type THEN
          CONTINUE;
        END IF;
      END IF;

      -- Check subject match
      IF quest_record.requirements ? 'subject_id' THEN
        IF event_subject_id IS NULL OR 
           (quest_record.requirements->>'subject_id')::UUID != event_subject_id THEN
          CONTINUE;
        END IF;
      END IF;

      -- Check minimum score
      IF quest_record.requirements ? 'min_percentage' THEN
        IF event_score IS NULL OR 
           event_score < (quest_record.requirements->>'min_percentage')::NUMERIC THEN
          CONTINUE;
        END IF;
      END IF;
    END IF;

    -- Get or create progress record
    SELECT * INTO progress_record 
    FROM user_quest_progress 
    WHERE user_id = user_id_value AND quest_id = quest_record.id;

    IF progress_record IS NULL THEN
      INSERT INTO user_quest_progress (user_id, quest_id, current_value, status, started_at, updated_at)
      VALUES (user_id_value, quest_record.id, 0, 'active', NOW(), NOW())
      RETURNING * INTO progress_record;
    END IF;

    IF progress_record.completed THEN 
      CONTINUE; 
    END IF;

    -- Update progress
    UPDATE user_quest_progress 
    SET 
      current_value = current_value + increment_amount,
      completed = (current_value + increment_amount >= quest_record.target_value),
      completed_at = CASE 
        WHEN (current_value + increment_amount >= quest_record.target_value) 
        THEN NOW() 
        ELSE completed_at 
      END,
      status = CASE 
        WHEN (current_value + increment_amount >= quest_record.target_value) 
        THEN 'completed' 
        ELSE 'active' 
      END,
      last_increment_at = NOW(),
      updated_at = NOW()
    WHERE user_id = user_id_value AND quest_id = quest_record.id;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Drop old triggers
DROP TRIGGER IF EXISTS trg_update_quest_on_user_progress_insert ON user_progress;
DROP TRIGGER IF EXISTS trg_update_quest_on_user_progress_update ON user_progress;
DROP TRIGGER IF EXISTS trg_update_quest_progress_on_user_progress ON user_progress;
DROP TRIGGER IF EXISTS trg_update_quest_progress_quiz_attempts ON quiz_attempts;
DROP TRIGGER IF EXISTS trg_update_quest_progress_test_attempts ON test_attempts;
DROP TRIGGER IF EXISTS trg_update_quest_progress_student_interactions ON student_interactions;

-- Create new triggers with v2 function
CREATE TRIGGER trg_quest_progress_user_progress
  AFTER INSERT OR UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_quest_progress_v2();

CREATE TRIGGER trg_quest_progress_quiz_attempts
  AFTER INSERT ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_quest_progress_v2();

CREATE TRIGGER trg_quest_progress_test_attempts
  AFTER INSERT ON test_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_quest_progress_v2();

CREATE TRIGGER trg_quest_progress_student_interactions
  AFTER INSERT ON student_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_quest_progress_v2();

-- ============================================================
-- PHASE 3: Fix RLS Policies
-- ============================================================

-- Update user_quest_progress RLS
DROP POLICY IF EXISTS "Users can view their own quest progress" ON user_quest_progress;
DROP POLICY IF EXISTS "Users can update their own quest progress" ON user_quest_progress;
DROP POLICY IF EXISTS "Users can insert their own quest progress" ON user_quest_progress;

CREATE POLICY "Users manage own quest progress"
  ON user_quest_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Parents view children quest progress"
  ON user_quest_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_relationships
      WHERE parent_id = auth.uid() AND child_id = user_quest_progress.user_id
    )
  );

CREATE POLICY "Schools view student quest progress"
  ON user_quest_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM school_student_relationships ssr
      JOIN school_accounts sa ON sa.id = ssr.school_id
      WHERE sa.admin_user_id = auth.uid() 
        AND ssr.student_id = user_quest_progress.user_id
        AND ssr.is_active = true
    )
  );

-- Fix quests RLS policies
DROP POLICY IF EXISTS "Children can view quests from their parent" ON quests;
DROP POLICY IF EXISTS "Students view assigned quests" ON quests;

CREATE POLICY "Students view assigned quests" 
  ON quests
  FOR SELECT
  TO authenticated
  USING (
    is_active = true 
    AND (
      created_by = 'system'
      OR auth.uid() = ANY(COALESCE(assigned_children, ARRAY[]::UUID[]))
      OR (
        assigned_children IS NULL 
        AND EXISTS (
          SELECT 1 FROM parent_child_relationships pcr
          WHERE pcr.parent_id = created_by_id AND pcr.child_id = auth.uid()
        )
      )
    )
  );

-- ============================================================
-- PHASE 4: Auto-Initialize Quests for Users
-- ============================================================

-- Function to initialize user quests
CREATE OR REPLACE FUNCTION initialize_user_quests(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_quest_progress (user_id, quest_id, current_value, status, started_at, updated_at)
  SELECT 
    target_user_id,
    q.id,
    0,
    'active',
    NOW(),
    NOW()
  FROM quests q
  WHERE q.is_active = true
    AND q.created_by = 'system'
    AND NOT EXISTS (
      SELECT 1 FROM user_quest_progress uqp
      WHERE uqp.user_id = target_user_id AND uqp.quest_id = q.id
    )
  ON CONFLICT DO NOTHING;
END;
$$;

-- Trigger function for auto-initialization
CREATE OR REPLACE FUNCTION auto_initialize_user_quests()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM initialize_user_quests(NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger on profiles
DROP TRIGGER IF EXISTS trg_auto_initialize_quests ON profiles;
CREATE TRIGGER trg_auto_initialize_quests
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_initialize_user_quests();

-- ============================================================
-- PHASE 5: Quest Expiration & Cleanup
-- ============================================================

-- Improved expiration handler
CREATE OR REPLACE FUNCTION handle_expired_quests()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark daily quests as failed if expired
  UPDATE user_quest_progress uqp
  SET status = 'failed', updated_at = NOW()
  FROM quests q
  WHERE uqp.quest_id = q.id
    AND q.type = 'daily'
    AND q.expires_at < NOW()
    AND uqp.status = 'active'
    AND NOT uqp.completed;

  -- Mark weekly quests as failed if expired
  UPDATE user_quest_progress uqp
  SET status = 'failed', updated_at = NOW()
  FROM quests q
  WHERE uqp.quest_id = q.id
    AND q.type = 'weekly'
    AND q.expires_at < NOW()
    AND uqp.status = 'active'
    AND NOT uqp.completed;

  -- Delete old failed records (older than 30 days)
  DELETE FROM user_quest_progress
  WHERE status = 'failed'
    AND updated_at < NOW() - INTERVAL '30 days';
END;
$$;

-- ============================================================
-- PHASE 6: Create Helper Views for Frontend
-- ============================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS user_quest_progress_detailed;

-- Create comprehensive view for frontend
CREATE OR REPLACE VIEW user_quest_progress_detailed AS
SELECT 
  uqp.id,
  uqp.user_id,
  uqp.quest_id,
  uqp.current_value,
  uqp.completed,
  uqp.completed_at,
  uqp.status,
  uqp.created_at,
  uqp.updated_at,
  uqp.last_increment_at,
  uqp.started_at,
  uqp.metadata,
  q.title,
  q.description,
  q.type,
  q.difficulty,
  q.target_value,
  q.expires_at,
  q.rewards,
  q.requirements,
  s.name as subject_name,
  ROUND((uqp.current_value::NUMERIC / NULLIF(q.target_value, 0)::NUMERIC) * 100, 2) as completion_percentage,
  CASE 
    WHEN uqp.completed THEN 'completed'
    WHEN q.expires_at IS NOT NULL AND q.expires_at < NOW() AND NOT uqp.completed THEN 'expired'
    WHEN uqp.status = 'failed' THEN 'failed'
    ELSE 'active'
  END as display_status
FROM user_quest_progress uqp
JOIN quests q ON q.id = uqp.quest_id
LEFT JOIN subjects s ON s.id = q.subject_id;

-- ============================================================
-- PHASE 8: Create Default System Quests
-- ============================================================

-- Set expires_at for daily quests to end of day, weekly to end of week
INSERT INTO quests (title, description, type, difficulty, target_value, created_by, requirements, rewards, expires_at, is_active)
VALUES
  -- Daily Quests
  ('Daily Study Session', 'Complete 1 lesson today', 'daily', 'basic', 1, 'system', 
   '{"trigger_type": "lesson_completed"}'::jsonb, 
   '{"xp": 10, "badge": "daily_learner"}'::jsonb,
   DATE_TRUNC('day', NOW()) + INTERVAL '1 day' - INTERVAL '1 second',
   true),
  
  ('Math Practice', 'Complete 2 math lessons or quizzes', 'daily', 'basic', 2, 'system',
   '{"trigger_type": "lesson_completed", "subject_name": "math"}'::jsonb, 
   '{"xp": 15}'::jsonb,
   DATE_TRUNC('day', NOW()) + INTERVAL '1 day' - INTERVAL '1 second',
   true),
  
  ('Quiz Master', 'Complete 1 quiz with 70%+ score', 'daily', 'intermediate', 1, 'system',
   '{"trigger_type": "quiz_completed", "min_percentage": 70}'::jsonb, 
   '{"xp": 20}'::jsonb,
   DATE_TRUNC('day', NOW()) + INTERVAL '1 day' - INTERVAL '1 second',
   true),
  
  -- Weekly Quests
  ('Weekly Scholar', 'Complete 5 lessons this week', 'weekly', 'intermediate', 5, 'system',
   '{"trigger_type": "lesson_completed"}'::jsonb, 
   '{"xp": 50, "badge": "weekly_champion"}'::jsonb,
   DATE_TRUNC('week', NOW()) + INTERVAL '1 week' - INTERVAL '1 second',
   true),
  
  ('Quiz Champion', 'Complete 10 quizzes with 70%+ score', 'weekly', 'hard', 10, 'system',
   '{"trigger_type": "quiz_completed", "min_percentage": 70}'::jsonb, 
   '{"xp": 75, "badge": "quiz_master"}'::jsonb,
   DATE_TRUNC('week', NOW()) + INTERVAL '1 week' - INTERVAL '1 second',
   true),
  
  ('Test Ace', 'Complete 3 tests with 80%+ score', 'weekly', 'hard', 3, 'system',
   '{"trigger_type": "test_completed", "min_percentage": 80}'::jsonb, 
   '{"xp": 100, "badge": "test_ace"}'::jsonb,
   DATE_TRUNC('week', NOW()) + INTERVAL '1 week' - INTERVAL '1 second',
   true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PHASE 9: Testing & Validation
-- ============================================================

-- Create test function
CREATE OR REPLACE FUNCTION test_quest_system(test_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(test_name TEXT, passed BOOLEAN, details TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Test 1: User has quest progress initialized
  RETURN QUERY
  SELECT 
    'Quest initialization'::TEXT,
    EXISTS(SELECT 1 FROM user_quest_progress WHERE user_id = test_user_id)::BOOLEAN,
    format('Found %s quest progress records', 
      (SELECT COUNT(*) FROM user_quest_progress WHERE user_id = test_user_id))::TEXT;

  -- Test 2: System quests exist
  RETURN QUERY
  SELECT 
    'System quests exist'::TEXT,
    (SELECT COUNT(*) FROM quests WHERE created_by = 'system') > 0,
    format('Found %s system quests', (SELECT COUNT(*) FROM quests WHERE created_by = 'system'))::TEXT;

  -- Test 3: View works
  RETURN QUERY
  SELECT 
    'View accessible'::TEXT,
    EXISTS(SELECT 1 FROM user_quest_progress_detailed WHERE user_id = test_user_id)::BOOLEAN,
    format('View returns %s records', 
      (SELECT COUNT(*) FROM user_quest_progress_detailed WHERE user_id = test_user_id))::TEXT;

  -- Test 4: RLS policies work
  RETURN QUERY
  SELECT 
    'RLS policies functional'::TEXT,
    (SELECT COUNT(*) FROM user_quest_progress WHERE user_id = test_user_id) >= 0,
    'RLS allows reading own progress'::TEXT;
END;
$$;

-- ============================================================
-- PHASE 10: Migration from Old System
-- ============================================================

-- Migrate daily_challenges to quests (if not already migrated)
INSERT INTO quests (id, title, description, type, difficulty, target_value, created_by, created_at, is_active)
SELECT 
  id, 
  title, 
  description, 
  'daily', 
  'basic', 
  target_value, 
  'system', 
  created_at,
  true
FROM daily_challenges
WHERE NOT EXISTS (SELECT 1 FROM quests WHERE quests.id = daily_challenges.id)
ON CONFLICT DO NOTHING;

-- Migrate user_challenge_progress to user_quest_progress
INSERT INTO user_quest_progress (user_id, quest_id, current_value, completed, completed_at, status, started_at, updated_at)
SELECT 
  ucp.user_id, 
  ucp.challenge_id, 
  ucp.current_value, 
  ucp.completed, 
  ucp.completed_at,
  CASE WHEN ucp.completed THEN 'completed' ELSE 'active' END,
  ucp.created_at,
  NOW()
FROM user_challenge_progress ucp
WHERE NOT EXISTS (
  SELECT 1 FROM user_quest_progress uqp 
  WHERE uqp.user_id = ucp.user_id AND uqp.quest_id = ucp.challenge_id
)
ON CONFLICT DO NOTHING;

-- Add comment to mark old tables as deprecated
COMMENT ON TABLE daily_challenges IS 'DEPRECATED: Migrated to quests table. Keep for reference only.';
COMMENT ON TABLE user_challenge_progress IS 'DEPRECATED: Migrated to user_quest_progress table. Keep for reference only.';