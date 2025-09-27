-- First, let's ensure user_quest_progress table has proper RLS policies for parents
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own quest progress" ON public.user_quest_progress;
DROP POLICY IF EXISTS "Parents can view their children quest progress" ON public.user_quest_progress;

-- Enable RLS on user_quest_progress
ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;

-- Users can manage their own quest progress  
CREATE POLICY "Users can manage their own quest progress" 
ON public.user_quest_progress 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Parents can view their children's quest progress
CREATE POLICY "Parents can view their children quest progress" 
ON public.user_quest_progress 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM parent_child_relationships pcr 
    WHERE pcr.parent_id = auth.uid() 
    AND pcr.child_id = user_quest_progress.user_id
  )
);

-- Also add a policy to allow parents to update quest progress for their children (in case they need to help)
CREATE POLICY "Parents can update their children quest progress" 
ON public.user_quest_progress 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM parent_child_relationships pcr 
    WHERE pcr.parent_id = auth.uid() 
    AND pcr.child_id = user_quest_progress.user_id
  )
);

-- Make sure children table has proper parent relationship
UPDATE children 
SET parent_id = (
  SELECT id FROM auth.users 
  WHERE email LIKE '%' || children.first_name || '%' 
  OR raw_user_meta_data->>'full_name' LIKE '%' || children.first_name || '%'
  LIMIT 1
)
WHERE parent_id IS NULL;