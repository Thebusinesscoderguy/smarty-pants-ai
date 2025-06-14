
-- Enhance learning_analytics table with additional fields for better tracking
ALTER TABLE learning_analytics ADD COLUMN IF NOT EXISTS response_time_ms INTEGER DEFAULT NULL;
ALTER TABLE learning_analytics ADD COLUMN IF NOT EXISTS difficulty_level TEXT DEFAULT 'medium';
ALTER TABLE learning_analytics ADD COLUMN IF NOT EXISTS interaction_context JSONB DEFAULT '{}';
ALTER TABLE learning_analytics ADD COLUMN IF NOT EXISTS baseline_score NUMERIC DEFAULT NULL;
ALTER TABLE learning_analytics ADD COLUMN IF NOT EXISTS improvement_rate NUMERIC DEFAULT NULL;

-- Create a new table for detailed interaction tracking
CREATE TABLE IF NOT EXISTS student_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL, -- 'chat', 'quiz', 'voice'
  topic_identified TEXT,
  subject_id UUID REFERENCES subjects(id),
  question_text TEXT,
  student_response TEXT,
  ai_analysis JSONB DEFAULT '{}', -- stores AI analysis results
  understanding_score NUMERIC, -- 0-1 scale of understanding
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_interactions_student_id ON student_interactions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_interactions_topic ON student_interactions(topic_identified);
CREATE INDEX IF NOT EXISTS idx_student_interactions_created_at ON student_interactions(created_at);

-- Create a table for tracking learning progress over time
CREATE TABLE IF NOT EXISTS learning_progress_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  topic_name TEXT NOT NULL,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  performance_score NUMERIC NOT NULL, -- 0-1 scale
  total_interactions INTEGER DEFAULT 0,
  correct_interactions INTEGER DEFAULT 0,
  average_response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint to prevent duplicate snapshots per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_learning_progress_unique 
ON learning_progress_snapshots(student_id, subject_id, topic_name, snapshot_date);

-- Enable RLS on new tables
ALTER TABLE student_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Students can view their own interactions" 
  ON student_interactions 
  FOR SELECT 
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own interactions" 
  ON student_interactions 
  FOR INSERT 
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view their own progress snapshots" 
  ON learning_progress_snapshots 
  FOR SELECT 
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own progress snapshots" 
  ON learning_progress_snapshots 
  FOR INSERT 
  WITH CHECK (auth.uid() = student_id);

-- Create a function to update learning analytics automatically
CREATE OR REPLACE FUNCTION update_learning_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert learning analytics based on the new interaction
  INSERT INTO learning_analytics (
    user_id, subject_id, topic_name, strength_score, 
    total_attempts, correct_attempts, last_updated
  )
  VALUES (
    NEW.student_id,
    NEW.subject_id,
    NEW.topic_identified,
    COALESCE(NEW.understanding_score, 0),
    1,
    CASE WHEN NEW.understanding_score >= 0.7 THEN 1 ELSE 0 END,
    NOW()
  )
  ON CONFLICT (user_id, subject_id, topic_name) 
  DO UPDATE SET
    total_attempts = learning_analytics.total_attempts + 1,
    correct_attempts = learning_analytics.correct_attempts + 
      CASE WHEN NEW.understanding_score >= 0.7 THEN 1 ELSE 0 END,
    strength_score = (
      learning_analytics.correct_attempts + 
      CASE WHEN NEW.understanding_score >= 0.7 THEN 1 ELSE 0 END
    )::NUMERIC / (learning_analytics.total_attempts + 1),
    last_updated = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update learning analytics
DROP TRIGGER IF EXISTS trigger_update_learning_analytics ON student_interactions;
CREATE TRIGGER trigger_update_learning_analytics
  AFTER INSERT ON student_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_analytics();
