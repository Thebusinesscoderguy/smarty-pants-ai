-- Assessment creator upgrade: question/option images + matching question type.
-- Additive only: existing question types and rows are untouched.

-- 1) New nullable columns on test_questions ------------------------------------
-- image_url: public URL of an image attached to the question (nullable).
-- option_images: jsonb array parallel to `options`, each entry a url|null (MCQ).
ALTER TABLE public.test_questions ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.test_questions ADD COLUMN IF NOT EXISTS option_images jsonb;

-- Matching questions reuse existing columns (no schema change):
--   question_type = 'matching'
--   options       = { "left": string[], "right": string[] }  (pair i = left[i] <-> right[i])
--   correct_answer = JSON.stringify(right)  (canonical right order)

-- 2) Public bucket for assessment images --------------------------------------
-- Mirrors the `student-avatars` bucket: public read, authenticated (teacher) write.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assessment-images',
  'assessment-images',
  true,
  10485760, -- 10 MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view (public bucket — images are quiz content).
CREATE POLICY "Anyone can view assessment images"
ON storage.objects FOR SELECT
USING (bucket_id = 'assessment-images');

-- Authenticated users may upload/update/delete only within their own uid folder
-- (path is `${auth.uid()}/...`).
CREATE POLICY "Authenticated users can upload assessment images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assessment-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated users can update own assessment images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'assessment-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated users can delete own assessment images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'assessment-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3) Expose the new columns to the student exam RPC ---------------------------
-- Same auth/order logic as before; just returns image_url + option_images so the
-- student-facing runner can render images. (correct_answer is still never exposed.)
-- DROP first: the return type changes (new OUT columns), which CREATE OR REPLACE
-- cannot do.
DROP FUNCTION IF EXISTS public.get_exam_questions_for_student(uuid);
CREATE OR REPLACE FUNCTION public.get_exam_questions_for_student(_test_id uuid)
RETURNS TABLE (
  id uuid,
  test_id uuid,
  question text,
  question_type text,
  options jsonb,
  image_url text,
  option_images jsonb,
  points integer,
  order_index integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id, q.test_id, q.question, q.question_type, q.options,
         q.image_url, q.option_images, q.points, q.order_index
  FROM public.test_questions q
  JOIN public.tests t ON t.id = q.test_id
  WHERE q.test_id = _test_id
    AND (
      t.creator_id = auth.uid()
      OR public.is_test_assigned_to_student(t.id, auth.uid())
    )
  ORDER BY q.order_index ASC;
$$;

REVOKE ALL ON FUNCTION public.get_exam_questions_for_student(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_exam_questions_for_student(uuid) TO authenticated;
