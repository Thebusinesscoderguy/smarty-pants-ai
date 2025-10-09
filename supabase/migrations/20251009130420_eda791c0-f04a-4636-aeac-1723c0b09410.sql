-- Add assigned_children column to quests table to track which children a quest applies to
-- If NULL or empty array, quest applies to all children of the creator
ALTER TABLE quests ADD COLUMN assigned_children uuid[] DEFAULT NULL;

-- Update RLS policy to allow children to see quests assigned to them specifically or to all children
DROP POLICY IF EXISTS "Children can view quests from their parent" ON quests;

CREATE POLICY "Children can view quests from their parent"
ON quests
FOR SELECT
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM parent_child_relationships pcr
    WHERE pcr.parent_id = quests.created_by_id 
    AND pcr.child_id = auth.uid()
    AND (
      quests.assigned_children IS NULL 
      OR quests.assigned_children = '{}' 
      OR auth.uid() = ANY(quests.assigned_children)
    )
  )
);