-- Add missing columns to existing tables
ALTER TABLE public.quests 
ADD COLUMN IF NOT EXISTS rewards JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '{}';

ALTER TABLE public.user_quest_progress
ADD COLUMN IF NOT EXISTS progress_data JSONB DEFAULT '{}';

ALTER TABLE public.achievements
ADD COLUMN IF NOT EXISTS school_id UUID,
ADD COLUMN IF NOT EXISTS creator_id UUID,
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 10;

ALTER TABLE public.tests
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;

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

-- Enable RLS on curriculum_progress
ALTER TABLE public.curriculum_progress ENABLE ROW LEVEL SECURITY;

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

-- Add policy for parents to manage curricula
CREATE POLICY "Parents can manage curricula for their children" ON public.curricula
FOR ALL USING (EXISTS (
  SELECT 1 FROM parent_child_relationships 
  WHERE parent_child_relationships.parent_id = auth.uid()
));

-- Add policy for quest creators
CREATE POLICY "Quest creators can manage quests" ON public.quests
FOR ALL USING (auth.uid() = created_by_id);

-- Add policy for achievement creators  
CREATE POLICY "Achievement creators can manage achievements" ON public.achievements
FOR ALL USING (auth.uid() = creator_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_curriculum_progress_student_id ON public.curriculum_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_progress_curriculum_id ON public.curriculum_progress(curriculum_id);