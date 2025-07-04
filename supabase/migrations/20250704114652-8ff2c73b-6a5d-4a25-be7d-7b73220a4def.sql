
-- Create table for instant quiz tracking
CREATE TABLE instant_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  topic TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  difficulty_level TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create table for topic prerequisites and relationships
CREATE TABLE topic_prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_name TEXT NOT NULL,
  prerequisite_topic TEXT NOT NULL,
  strength_required DECIMAL(3,2) DEFAULT 0.7,
  subject_area TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for student topic mastery tracking
CREATE TABLE student_topic_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  topic_name TEXT NOT NULL,
  subject_area TEXT,
  mastery_level DECIMAL(3,2) DEFAULT 0.0,
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  total_interactions INTEGER DEFAULT 0,
  correct_interactions INTEGER DEFAULT 0,
  last_practiced TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, topic_name, subject_area)
);

-- Create table for homework helper sessions
CREATE TABLE homework_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  problem_type TEXT NOT NULL,
  problem_description TEXT,
  file_url TEXT,
  steps_completed INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  difficulty_level TEXT DEFAULT 'medium',
  success_rate DECIMAL(3,2) DEFAULT 0.0,
  session_data JSONB DEFAULT '{}'::jsonb,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create table for learning path tracking
CREATE TABLE student_learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  path_name TEXT NOT NULL,
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 0,
  topics_completed TEXT[] DEFAULT '{}',
  next_recommended_topics TEXT[] DEFAULT '{}',
  path_data JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE instant_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_topic_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_learning_paths ENABLE ROW LEVEL SECURITY;

-- RLS policies for instant_quizzes
CREATE POLICY "Students can manage their own quizzes" ON instant_quizzes
  FOR ALL USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- RLS policies for topic_prerequisites (public read)
CREATE POLICY "Anyone can view topic prerequisites" ON topic_prerequisites
  FOR SELECT USING (true);

-- RLS policies for student_topic_mastery
CREATE POLICY "Students can manage their own mastery data" ON student_topic_mastery
  FOR ALL USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- RLS policies for homework_sessions
CREATE POLICY "Students can manage their own homework sessions" ON homework_sessions
  FOR ALL USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- RLS policies for student_learning_paths
CREATE POLICY "Students can manage their own learning paths" ON student_learning_paths
  FOR ALL USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- Insert some sample topic prerequisites for common subjects
INSERT INTO topic_prerequisites (topic_name, prerequisite_topic, strength_required, subject_area) VALUES
  ('Algebra', 'Basic Math', 0.8, 'Mathematics'),
  ('Calculus', 'Algebra', 0.9, 'Mathematics'),
  ('Trigonometry', 'Geometry', 0.8, 'Mathematics'),
  ('Physics', 'Algebra', 0.7, 'Science'),
  ('Chemistry', 'Basic Math', 0.6, 'Science'),
  ('Biology', 'Scientific Method', 0.6, 'Science'),
  ('Essay Writing', 'Grammar', 0.7, 'English'),
  ('Literature Analysis', 'Reading Comprehension', 0.8, 'English');
