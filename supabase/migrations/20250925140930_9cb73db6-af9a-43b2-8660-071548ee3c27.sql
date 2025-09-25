-- Restrict quest visibility to prevent children seeing other parents' quests
-- 1) Drop overly permissive policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'quests' 
      AND policyname = 'Users can view active quests'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view active quests" ON public.quests';
  END IF;
END $$;

-- 2) Ensure RLS is enabled (it already is, but safe to call)
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

-- 3) Allow quest creators to view their own quests explicitly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'quests' 
      AND policyname = 'Quest creators can view their quests'
  ) THEN
    CREATE POLICY "Quest creators can view their quests"
    ON public.quests
    FOR SELECT
    USING (auth.uid() = created_by_id);
  END IF;
END $$;

-- 4) Allow children to view only quests created by their own parent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'quests' 
      AND policyname = 'Children can view quests from their parent'
  ) THEN
    CREATE POLICY "Children can view quests from their parent"
    ON public.quests
    FOR SELECT
    USING (
      is_active = true AND EXISTS (
        SELECT 1 FROM public.parent_child_relationships pcr
        WHERE pcr.parent_id = public.quests.created_by_id
          AND pcr.child_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 5) Allow everyone to view system quests only (not other parents)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'quests' 
      AND policyname = 'Users can view system quests'
  ) THEN
    CREATE POLICY "Users can view system quests"
    ON public.quests
    FOR SELECT
    USING (is_active = true AND created_by = 'system');
  END IF;
END $$;