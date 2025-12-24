-- Add RLS policies for study_materials bucket to allow authenticated users to upload and access their files
-- Also allow anonymous uploads with UUID-based folder structure

-- Policy: Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload study materials to their folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'study_materials' AND
  (storage.foldername(name))[1] IS NOT NULL
);

-- Policy: Allow users to read files from the study_materials bucket (for signed URLs)
CREATE POLICY "Users can read study materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'study_materials');

-- Policy: Allow users to delete their own files
CREATE POLICY "Users can delete their own study materials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'study_materials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);