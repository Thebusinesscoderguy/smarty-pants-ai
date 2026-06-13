
-- Add student classification system tables
CREATE TABLE IF NOT EXISTS public.student_classifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  classification_tag TEXT NOT NULL,
  assigned_by UUID,
  assigned_automatically BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add content assignments table for targeted distribution
CREATE TABLE IF NOT EXISTS public.content_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL, -- 'test', 'quest', 'curriculum', 'achievement'
  content_id UUID NOT NULL,
  assignment_type TEXT NOT NULL, -- 'individual', 'classification', 'all'
  target_id UUID, -- student_id for individual, null for classification/all
  classification_tag TEXT, -- for classification-based assignments
  assigned_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  due_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Add AI summary cache table
CREATE TABLE IF NOT EXISTS public.student_ai_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  summary_text TEXT NOT NULL,
  strengths JSONB DEFAULT '[]',
  weaknesses JSONB DEFAULT '[]',
  improvement_metrics JSONB DEFAULT '{}',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours')
);

-- Enable RLS on new tables
ALTER TABLE public.student_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_ai_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_classifications
CREATE POLICY "Students can view their own classifications" ON public.student_classifications
FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "School admins can manage classifications" ON public.student_classifications
FOR ALL USING (EXISTS (
  SELECT 1 FROM school_student_relationships 
  WHERE student_id = student_classifications.student_id 
  AND school_id IN (
    SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()
  )
));

-- RLS Policies for content_assignments
CREATE POLICY "Assigned users can view content assignments" ON public.content_assignments
FOR SELECT USING (
  (assignment_type = 'individual' AND target_id = auth.uid()) OR
  (assignment_type = 'classification' AND EXISTS (
    SELECT 1 FROM student_classifications 
    WHERE student_id = auth.uid() AND classification_tag = content_assignments.classification_tag
  )) OR
  (assignment_type = 'all')
);

CREATE POLICY "Content creators can manage assignments" ON public.content_assignments
FOR ALL USING (auth.uid() = assigned_by);

-- RLS Policies for student_ai_summaries
CREATE POLICY "Students can view their own summaries" ON public.student_ai_summaries
FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "School admins can view student summaries" ON public.student_ai_summaries
FOR SELECT USING (EXISTS (
  SELECT 1 FROM school_student_relationships 
  WHERE student_id = student_ai_summaries.student_id 
  AND school_id IN (
    SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()
  )
));

CREATE POLICY "System can insert summaries" ON public.student_ai_summaries
FOR INSERT WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_classifications_student_id ON public.student_classifications(student_id);
CREATE INDEX IF NOT EXISTS idx_student_classifications_tag ON public.student_classifications(classification_tag);
CREATE INDEX IF NOT EXISTS idx_content_assignments_type_id ON public.content_assignments(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_assignments_target ON public.content_assignments(assignment_type, target_id);
CREATE INDEX IF NOT EXISTS idx_student_ai_summaries_student_id ON public.student_ai_summaries(student_id);
CREATE INDEX IF NOT EXISTS idx_student_ai_summaries_expires ON public.student_ai_summaries(expires_at);

-- Add demo data for student classifications
INSERT INTO public.student_classifications (student_id, classification_tag, assigned_automatically) VALUES
-- Generate some demo student IDs and classifications
(gen_random_uuid(), 'High Achiever', true),
(gen_random_uuid(), 'Visual Learner', true),
(gen_random_uuid(), 'Needs Support', false),
(gen_random_uuid(), 'STEM Focused', true),
(gen_random_uuid(), 'Creative Explorer', true),
(gen_random_uuid(), 'Fast Paced', true),
(gen_random_uuid(), 'Collaborative', false);
