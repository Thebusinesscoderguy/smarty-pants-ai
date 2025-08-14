-- Create the monitoring snapshot update function first
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