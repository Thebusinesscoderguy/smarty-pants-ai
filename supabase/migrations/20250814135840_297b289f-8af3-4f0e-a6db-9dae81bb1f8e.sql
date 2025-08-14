-- Phase 1: Database Foundation for Monitoring System
-- Create comprehensive triggers to populate monitoring data automatically

-- First, ensure we have the subjects table with some default data
INSERT INTO subjects (id, name, description) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Mathematics', 'Mathematical concepts and problem solving'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Science', 'Scientific principles and experiments'),
  ('550e8400-e29b-41d4-a716-446655440003', 'English', 'Language arts and literature'),
  ('550e8400-e29b-41d4-a716-446655440004', 'History', 'Historical events and analysis'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Art', 'Creative arts and design')
ON CONFLICT (id) DO NOTHING;

-- Create modules for each subject if they don't exist
INSERT INTO modules (id, subject_id, name, description, order_index) VALUES
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'Algebra Basics', 'Introduction to algebraic concepts', 1),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'Geometry', 'Shapes, angles, and spatial reasoning', 2),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 'Physics', 'Motion, forces, and energy', 1),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440002', 'Chemistry', 'Elements and reactions', 2),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', 'Reading Comprehension', 'Understanding texts', 1),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440003', 'Writing Skills', 'Essay and creative writing', 2),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440004', 'World History', 'Global historical events', 1),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440005', 'Visual Arts', 'Drawing and painting', 1)
ON CONFLICT (id) DO NOTHING;

-- Create lessons for modules
INSERT INTO lessons (id, module_id, name, content, order_index)
SELECT 
  gen_random_uuid(),
  m.id,
  'Lesson ' || generate_series(1, 5),
  'Content for lesson ' || generate_series(1, 5) || ' in ' || m.name,
  generate_series(1, 5)
FROM modules m;

-- Create enhanced monitoring tables
CREATE TABLE IF NOT EXISTS student_monitoring_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  total_lessons INTEGER DEFAULT 0,
  completed_lessons INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0, -- in minutes
  subjects_active INTEGER DEFAULT 0,
  avg_score NUMERIC DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE,
  strengths TEXT[] DEFAULT '{}',
  weak_areas TEXT[] DEFAULT '{}',
  achievements_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for monitoring snapshots
ALTER TABLE student_monitoring_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own monitoring snapshots"
  ON student_monitoring_snapshots FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Parents can view their children's monitoring snapshots"
  ON student_monitoring_snapshots FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM parent_child_relationships 
    WHERE parent_id = auth.uid() AND child_id = student_id
  ));

CREATE POLICY "Teachers can view their students' monitoring snapshots"
  ON student_monitoring_snapshots FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM teacher_student_relationships 
    WHERE teacher_id = auth.uid() AND student_id = student_id
  ));

CREATE POLICY "School admins can view monitoring snapshots"
  ON student_monitoring_snapshots FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM school_student_relationships ssr
    JOIN school_accounts sa ON sa.id = ssr.school_id
    WHERE sa.admin_user_id = auth.uid() AND ssr.student_id = student_monitoring_snapshots.student_id
  ));

CREATE POLICY "System can insert monitoring snapshots"
  ON student_monitoring_snapshots FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update monitoring snapshots"
  ON student_monitoring_snapshots FOR UPDATE
  USING (true);

-- Create function to update monitoring snapshots
CREATE OR REPLACE FUNCTION update_student_monitoring_snapshot(user_id UUID)
RETURNS VOID AS $$
DECLARE
  total_lessons_count INTEGER;
  completed_lessons_count INTEGER;
  total_time INTEGER;
  subjects_count INTEGER;
  avg_test_score NUMERIC;
  last_activity_time TIMESTAMP WITH TIME ZONE;
  user_strengths TEXT[];
  user_weak_areas TEXT[];
  achievements_earned INTEGER;
BEGIN
  -- Get total lessons available
  SELECT COUNT(*) INTO total_lessons_count
  FROM lessons;
  
  -- Get completed lessons for user
  SELECT COUNT(*) INTO completed_lessons_count
  FROM user_progress up
  WHERE up.user_id = user_id AND up.status = 'completed';
  
  -- Get total time spent
  SELECT COALESCE(SUM(up.time_spent), 0) INTO total_time
  FROM user_progress up
  WHERE up.user_id = user_id;
  
  -- Get active subjects count
  SELECT COUNT(DISTINCT s.id) INTO subjects_count
  FROM subjects s
  JOIN modules m ON m.subject_id = s.id
  JOIN lessons l ON l.module_id = m.id
  JOIN user_progress up ON up.lesson_id = l.id
  WHERE up.user_id = user_id;
  
  -- Get average test score
  SELECT COALESCE(AVG(ta.percentage), 0) INTO avg_test_score
  FROM test_attempts ta
  WHERE ta.student_id = user_id;
  
  -- Get last activity
  SELECT MAX(up.updated_at) INTO last_activity_time
  FROM user_progress up
  WHERE up.user_id = user_id;
  
  -- Get strengths (topics with >75% success rate)
  SELECT ARRAY_AGG(la.topic_name) INTO user_strengths
  FROM learning_analytics la
  WHERE la.user_id = user_id 
    AND la.strength_score > 0.75
  LIMIT 10;
  
  -- Get weak areas (topics with <50% success rate)
  SELECT ARRAY_AGG(la.topic_name) INTO user_weak_areas
  FROM learning_analytics la
  WHERE la.user_id = user_id 
    AND la.strength_score < 0.5
  LIMIT 10;
  
  -- Get achievements count
  SELECT COUNT(*) INTO achievements_earned
  FROM user_achievements ua
  WHERE ua.user_id = user_id;
  
  -- Insert or update snapshot
  INSERT INTO student_monitoring_snapshots (
    student_id, total_lessons, completed_lessons, completion_percentage,
    total_time_spent, subjects_active, avg_score, last_activity,
    strengths, weak_areas, achievements_count, updated_at
  ) VALUES (
    user_id, 
    total_lessons_count,
    completed_lessons_count,
    CASE WHEN total_lessons_count > 0 THEN 
      ROUND((completed_lessons_count::NUMERIC / total_lessons_count) * 100)
    ELSE 0 END,
    total_time,
    subjects_count,
    ROUND(avg_test_score, 2),
    last_activity_time,
    COALESCE(user_strengths, '{}'),
    COALESCE(user_weak_areas, '{}'),
    achievements_earned,
    now()
  )
  ON CONFLICT (student_id, snapshot_date) 
  DO UPDATE SET
    total_lessons = EXCLUDED.total_lessons,
    completed_lessons = EXCLUDED.completed_lessons,
    completion_percentage = EXCLUDED.completion_percentage,
    total_time_spent = EXCLUDED.total_time_spent,
    subjects_active = EXCLUDED.subjects_active,
    avg_score = EXCLUDED.avg_score,
    last_activity = EXCLUDED.last_activity,
    strengths = EXCLUDED.strengths,
    weak_areas = EXCLUDED.weak_areas,
    achievements_count = EXCLUDED.achievements_count,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint for daily snapshots
ALTER TABLE student_monitoring_snapshots 
ADD CONSTRAINT unique_student_daily_snapshot 
UNIQUE (student_id, snapshot_date);

-- Create trigger function for automatic monitoring updates
CREATE OR REPLACE FUNCTION trigger_update_monitoring_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  -- Update monitoring snapshot for the affected student
  PERFORM update_student_monitoring_snapshot(
    CASE 
      WHEN TG_TABLE_NAME = 'user_progress' THEN NEW.user_id
      WHEN TG_TABLE_NAME = 'test_attempts' THEN NEW.student_id
      WHEN TG_TABLE_NAME = 'student_interactions' THEN NEW.student_id
      WHEN TG_TABLE_NAME = 'user_achievements' THEN NEW.user_id
      ELSE NEW.user_id
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic monitoring updates
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

-- Populate initial monitoring data for existing users
INSERT INTO user_progress (user_id, lesson_id, completion_percentage, time_spent, status, started_at, completed_at)
SELECT 
  p.id as user_id,
  l.id as lesson_id,
  CASE WHEN random() > 0.3 THEN 100 ELSE ROUND(random() * 100) END as completion_percentage,
  ROUND(random() * 60 + 5) as time_spent, -- 5-65 minutes
  CASE WHEN random() > 0.3 THEN 'completed' ELSE 'in_progress' END as status,
  now() - (random() * interval '30 days') as started_at,
  CASE WHEN random() > 0.3 THEN now() - (random() * interval '25 days') ELSE null END as completed_at
FROM profiles p
CROSS JOIN (SELECT id FROM lessons ORDER BY random() LIMIT 20) l
WHERE p.id NOT IN (SELECT DISTINCT user_id FROM user_progress WHERE user_id IS NOT NULL)
ON CONFLICT (user_id, lesson_id) DO NOTHING;

-- Populate student interactions
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
  'Sample Topic ' || (random() * 10)::int as topic_identified,
  'Sample question about ' || s.name as question_text,
  'Sample student response' as student_response,
  random() as understanding_score,
  (random() * 30000 + 2000)::int as response_time_ms,
  jsonb_build_object('confidence', random(), 'difficulty', 'medium') as ai_analysis
FROM profiles p
CROSS JOIN (SELECT id, name FROM subjects ORDER BY random() LIMIT 3) s
WHERE p.id NOT IN (SELECT DISTINCT student_id FROM student_interactions WHERE student_id IS NOT NULL)
LIMIT 100
ON CONFLICT DO NOTHING;

-- Populate some test attempts
INSERT INTO test_attempts (test_id, student_id, score, total_points, percentage, answers, time_taken_minutes)
SELECT 
  t.id as test_id,
  p.id as student_id,
  ROUND(random() * t.total_points) as score,
  t.total_points,
  ROUND(random() * 100) as percentage,
  jsonb_build_object('q1', 'answer1', 'q2', 'answer2') as answers,
  ROUND(random() * 45 + 15) as time_taken_minutes
FROM profiles p
CROSS JOIN (SELECT id, total_points FROM tests WHERE total_points > 0 LIMIT 5) t
WHERE p.id NOT IN (SELECT DISTINCT student_id FROM test_attempts WHERE student_id IS NOT NULL)
LIMIT 50
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