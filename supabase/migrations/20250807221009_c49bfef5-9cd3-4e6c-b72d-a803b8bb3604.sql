-- Create a children table for managing child information without auth accounts
CREATE TABLE public.children (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  grade_level TEXT,
  subjects TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Create policies for children table
CREATE POLICY "Parents can manage their children" 
ON public.children 
FOR ALL 
USING (auth.uid() = parent_id)
WITH CHECK (auth.uid() = parent_id);