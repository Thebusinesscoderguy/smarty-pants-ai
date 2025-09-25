-- Tighten quests policies to authenticated role only
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'quests' AND policyname = 'Users can view system quests'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view system quests" ON public.quests';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'quests' AND policyname = 'Children can view quests from their parent'
  ) THEN
    EXECUTE 'DROP POLICY "Children can view quests from their parent" ON public.quests';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'quests' AND policyname = 'Quest creators can view their quests'
  ) THEN
    EXECUTE 'DROP POLICY "Quest creators can view their quests" ON public.quests';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'quests' AND policyname = 'Quest creators can manage quests'
  ) THEN
    -- Recreate manage policy scoping to authenticated as well
    EXECUTE 'DROP POLICY "Quest creators can manage quests" ON public.quests';
  END IF;
END $$;

-- Recreate policies with TO authenticated
CREATE POLICY "Users can view system quests"
ON public.quests
FOR SELECT
TO authenticated
USING (is_active = true AND created_by = 'system');

CREATE POLICY "Children can view quests from their parent"
ON public.quests
FOR SELECT
TO authenticated
USING (
  is_active = true AND EXISTS (
    SELECT 1 FROM public.parent_child_relationships pcr
    WHERE pcr.parent_id = public.quests.created_by_id
      AND pcr.child_id = auth.uid()
  )
);

CREATE POLICY "Quest creators can view their quests"
ON public.quests
FOR SELECT
TO authenticated
USING (auth.uid() = created_by_id);

CREATE POLICY "Quest creators can manage quests"
ON public.quests
FOR ALL
TO authenticated
USING (auth.uid() = created_by_id)
WITH CHECK (auth.uid() = created_by_id);