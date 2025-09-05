-- Add RLS policy to allow parents to view their children's achievements
CREATE POLICY "Parents can view their children's achievements"
ON public.user_achievements
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM parent_child_relationships
    WHERE parent_child_relationships.parent_id = auth.uid()
    AND parent_child_relationships.child_id = user_achievements.user_id
  )
);