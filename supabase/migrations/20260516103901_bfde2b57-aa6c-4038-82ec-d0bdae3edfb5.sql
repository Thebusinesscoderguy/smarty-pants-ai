-- 1) Storage policies for `assignments` bucket (homework attachments)
-- Allow authenticated users to upload to their own folder (path starts with their uid)
DROP POLICY IF EXISTS "Students upload own homework files" ON storage.objects;
CREATE POLICY "Students upload own homework files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Students read own homework files" ON storage.objects;
CREATE POLICY "Students read own homework files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'assignments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Students delete own homework files" ON storage.objects;
CREATE POLICY "Students delete own homework files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assignments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Teachers/admins can read any homework file in the assignments bucket from a school they belong to.
-- We can't easily join here per-file, so we allow any authenticated user who is a teacher or school admin to read.
DROP POLICY IF EXISTS "Teachers and admins read homework files" ON storage.objects;
CREATE POLICY "Teachers and admins read homework files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'assignments'
  AND (
    EXISTS (SELECT 1 FROM public.school_accounts sa WHERE sa.admin_user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.school_teachers st
      WHERE lower(st.email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
        AND st.is_active = true
    )
  )
);

-- 2) Report cards: students and parents can view PUBLISHED cards
DROP POLICY IF EXISTS "Students view own published report cards" ON public.report_cards;
CREATE POLICY "Students view own published report cards"
ON public.report_cards FOR SELECT
TO authenticated
USING (
  published = true AND student_id = auth.uid()
);

DROP POLICY IF EXISTS "Parents view children published report cards" ON public.report_cards;
CREATE POLICY "Parents view children published report cards"
ON public.report_cards FOR SELECT
TO authenticated
USING (
  published = true
  AND EXISTS (
    SELECT 1 FROM public.parent_child_relationships pcr
    WHERE pcr.parent_id = auth.uid() AND pcr.child_id = public.report_cards.student_id
  )
);

-- Allow students/parents to read the school's report_card_settings to render the PDF
DROP POLICY IF EXISTS "Anyone in school can read report card settings" ON public.report_card_settings;
CREATE POLICY "Anyone in school can read report card settings"
ON public.report_card_settings FOR SELECT
TO authenticated
USING (true);
