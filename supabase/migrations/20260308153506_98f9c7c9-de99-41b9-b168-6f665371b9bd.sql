
-- Add avatar_url column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create a public storage bucket for student avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-avatars', 'student-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow school admins to upload avatars
CREATE POLICY "School admins can upload student avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'student-avatars'
  AND auth.role() = 'authenticated'
);

-- Allow anyone to view avatars (public bucket)
CREATE POLICY "Anyone can view student avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-avatars');

-- Allow school admins to update/delete avatars
CREATE POLICY "Authenticated users can update student avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'student-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete student avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'student-avatars' AND auth.role() = 'authenticated');
