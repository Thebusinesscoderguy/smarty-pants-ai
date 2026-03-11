
-- Fix study_materials storage policy: restrict reads to file owner only
DROP POLICY IF EXISTS "Users can read study materials" ON storage.objects;

CREATE POLICY "Users can read their own study materials"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'study_materials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
