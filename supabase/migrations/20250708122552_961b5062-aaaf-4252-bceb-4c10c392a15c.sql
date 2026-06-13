-- Create tests table if it doesn't exist and add missing columns
CREATE TABLE IF NOT EXISTS public.tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  time_limit_minutes INTEGER DEFAULT 30,
  is_mandatory BOOLEAN DEFAULT false,
  ai_graded BOOLEAN DEFAULT true,
  ai_generated BOOLEAN DEFAULT false,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create test_questions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.test_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL,
  question TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice',
  options JSONB,
  correct_answer TEXT NOT NULL,
  points INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create test_attempts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.test_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL,
  student_id UUID NOT NULL,
  score INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  percentage INTEGER DEFAULT 0,
  answers JSONB,
  time_taken_minutes INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create quests table updates
ALTER TABLE public.quests 
ADD COLUMN IF NOT EXISTS rewards JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '{}';

-- Create user_quest_progress updates
ALTER TABLE public.user_quest_progress
ADD COLUMN IF NOT EXISTS progress_data JSONB DEFAULT '{}';

-- Create achievements updates  
ALTER TABLE public.achievements
ADD COLUMN IF NOT EXISTS school_id UUID,
ADD COLUMN IF NOT EXISTS creator_id UUID,
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 10;

-- Create curriculum_progress table
CREATE TABLE IF NOT EXISTS public.curriculum_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  curriculum_id UUID NOT NULL,
  student_id UUID NOT NULL,
  progress_percentage INTEGER DEFAULT 0,
  current_section TEXT,
  completed_sections TEXT[] DEFAULT '{}',
  time_spent_minutes INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tests
CREATE POLICY "Test creators can manage their tests" ON public.tests
FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Users can view tests they created or are assigned to" ON public.tests
FOR SELECT USING (true);

-- RLS Policies for test_questions
CREATE POLICY "Test creators can manage questions" ON public.test_questions
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.tests 
  WHERE tests.id = test_questions.test_id 
  AND tests.creator_id = auth.uid()
));

CREATE POLICY "Users can view questions for accessible tests" ON public.test_questions
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.tests 
  WHERE tests.id = test_questions.test_id
));

-- RLS Policies for test_attempts
CREATE POLICY "Students can create attempts" ON public.test_attempts
FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their attempts" ON public.test_attempts
FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Users can view their own attempts or created tests" ON public.test_attempts
FOR SELECT USING (
  auth.uid() = student_id OR 
  EXISTS (
    SELECT 1 FROM public.tests 
    WHERE tests.id = test_attempts.test_id 
    AND tests.creator_id = auth.uid()
  )
);

-- RLS Policies for curriculum_progress
CREATE POLICY "Students can manage their curriculum progress" ON public.curriculum_progress
FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Curriculum creators can view progress" ON public.curriculum_progress
FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.curricula 
  WHERE curricula.id = curriculum_progress.curriculum_id 
  AND (curricula.school_id IN (
    SELECT school_accounts.id FROM school_accounts 
    WHERE school_accounts.admin_user_id = auth.uid()
  ))
));

-- Update curricula RLS to allow parents
CREATE POLICY "Parents can manage curricula for their children" ON public.curricula
FOR ALL USING (EXISTS (
  SELECT 1 FROM parent_child_relationships 
  WHERE parent_child_relationships.parent_id = auth.uid()
));

-- Update quests RLS policies
CREATE POLICY "Quest creators can manage quests" ON public.quests
FOR ALL USING (auth.uid() = created_by_id);

-- Update achievements RLS policies  
CREATE POLICY "Achievement creators can manage achievements" ON public.achievements
FOR ALL USING (auth.uid() = creator_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tests_creator_id ON public.tests(creator_id);
CREATE INDEX IF NOT EXISTS idx_test_questions_test_id ON public.test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_student_id ON public.test_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_id ON public.test_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_progress_student_id ON public.curriculum_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_progress_curriculum_id ON public.curriculum_progress(curriculum_id);