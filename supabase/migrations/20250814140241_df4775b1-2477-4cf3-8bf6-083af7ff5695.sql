-- Fix the trigger function for monitoring updates
CREATE OR REPLACE FUNCTION trigger_update_monitoring_snapshot()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Determine the user_id based on the table and its column structure
  IF TG_TABLE_NAME = 'user_progress' THEN
    target_user_id := NEW.user_id;
  ELSIF TG_TABLE_NAME = 'test_attempts' THEN
    target_user_id := NEW.student_id;
  ELSIF TG_TABLE_NAME = 'student_interactions' THEN
    target_user_id := NEW.student_id;
  ELSIF TG_TABLE_NAME = 'user_achievements' THEN
    target_user_id := NEW.user_id;
  ELSE
    -- Default fallback, assuming user_id exists
    target_user_id := NEW.user_id;
  END IF;
  
  -- Update monitoring snapshot for the affected student
  PERFORM update_student_monitoring_snapshot(target_user_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the triggers
DROP TRIGGER IF EXISTS update_monitoring_on_progress ON user_progress;
CREATE TRIGGER update_monitoring_on_progress
  AFTER INSERT OR UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION trigger_update_monitoring_snapshot();

DROP TRIGGER IF EXISTS update_monitoring_on_test ON test_attempts;
CREATE TRIGGER update_monitoring_on_test
  AFTER INSERT OR UPDATE ON test_attempts
  FOR EACH ROW EXECUTE FUNCTION trigger_update_monitoring_snapshot();

DROP TRIGGER IF EXISTS update_monitoring_on_interaction ON student_interactions;
CREATE TRIGGER update_monitoring_on_interaction
  AFTER INSERT ON student_interactions
  FOR EACH ROW EXECUTE FUNCTION trigger_update_monitoring_snapshot();

DROP TRIGGER IF EXISTS update_monitoring_on_achievement ON user_achievements;
CREATE TRIGGER update_monitoring_on_achievement
  AFTER INSERT ON user_achievements
  FOR EACH ROW EXECUTE FUNCTION trigger_update_monitoring_snapshot();

-- Populate initial monitoring data for existing users if not exists
INSERT INTO user_progress (user_id, lesson_id, completion_percentage, time_spent, status, started_at, completed_at)
SELECT 
  p.id as user_id,
  l.id as lesson_id,
  CASE WHEN random() > 0.3 THEN 100 ELSE ROUND(random() * 100) END as completion_percentage,
  ROUND(random() * 60 + 5) as time_spent,
  CASE WHEN random() > 0.3 THEN 'completed' ELSE 'in_progress' END as status,
  now() - (random() * interval '30 days') as started_at,
  CASE WHEN random() > 0.3 THEN now() - (random() * interval '25 days') ELSE null END as completed_at
FROM profiles p
CROSS JOIN (SELECT id FROM lessons ORDER BY random() LIMIT 15) l
WHERE NOT EXISTS (SELECT 1 FROM user_progress WHERE user_id = p.id)
ON CONFLICT (user_id, lesson_id) DO NOTHING;

-- Populate student interactions if not exists
INSERT INTO student_interactions (
  student_id, subject_id, session_id, interaction_type, 
  topic_identified, question_text, student_response, 
  understanding_score, response_time_ms, ai_analysis
)
SELECT 
  p.id as student_id,
  s.id as subject_id,
  gen_random_uuid()::text as session_id,
  'question' as interaction_type,
  s.name || ' Topic ' || (random() * 10)::int as topic_identified,
  'Sample question about ' || s.name as question_text,
  'Sample student response' as student_response,
  random() as understanding_score,
  (random() * 30000 + 2000)::int as response_time_ms,
  jsonb_build_object('confidence', random(), 'difficulty', 'medium') as ai_analysis
FROM profiles p
CROSS JOIN (SELECT id, name FROM subjects ORDER BY random() LIMIT 3) s
WHERE NOT EXISTS (SELECT 1 FROM student_interactions WHERE student_id = p.id)
LIMIT 100
ON CONFLICT DO NOTHING;

-- Generate initial monitoring snapshots for all users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM profiles LOOP
    PERFORM update_student_monitoring_snapshot(user_record.id);
  END LOOP;
END $$;