
-- Create tests table
CREATE TABLE public.tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  creator_id UUID NOT NULL,
  time_limit_minutes INTEGER DEFAULT 30,
  is_mandatory BOOLEAN DEFAULT false,
  ai_graded BOOLEAN DEFAULT true,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create test_questions table
CREATE TABLE public.test_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice',
  options JSONB,
  correct_answer TEXT NOT NULL,
  points INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create test_attempts table
CREATE TABLE public.test_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  score INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  percentage INTEGER DEFAULT 0,
  answers JSONB,
  time_taken_minutes INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tests
CREATE POLICY "Users can view tests they created or are assigned to" ON public.tests
  FOR SELECT USING (true); -- For now, allow all authenticated users to see tests

CREATE POLICY "Teachers and parents can create tests" ON public.tests
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Test creators can update their tests" ON public.tests
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Test creators can delete their tests" ON public.tests
  FOR DELETE USING (auth.uid() = creator_id);

-- RLS Policies for test_questions
CREATE POLICY "Users can view questions for accessible tests" ON public.test_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tests 
      WHERE tests.id = test_questions.test_id
    )
  );

CREATE POLICY "Test creators can manage questions" ON public.test_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tests 
      WHERE tests.id = test_questions.test_id 
      AND tests.creator_id = auth.uid()
    )
  );

-- RLS Policies for test_attempts
CREATE POLICY "Users can view their own attempts or created tests" ON public.test_attempts
  FOR SELECT USING (
    auth.uid() = student_id OR 
    EXISTS (
      SELECT 1 FROM public.tests 
      WHERE tests.id = test_attempts.test_id 
      AND tests.creator_id = auth.uid()
    )
  );

CREATE POLICY "Students can create attempts" ON public.test_attempts
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their attempts" ON public.test_attempts
  FOR UPDATE USING (auth.uid() = student_id);
