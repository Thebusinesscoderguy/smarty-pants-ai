-- SECURITY (public_bucket_allows_listing): the "Anyone can view student avatars"
-- policy granted SELECT on storage.objects to the public/anon role, allowing
-- anonymous users to LIST/enumerate the student-avatars bucket. Replace it with an
-- authenticated-scoped SELECT policy. The bucket stays public, so avatar rendering
-- via stored getPublicUrl() download links is UNAFFECTED (public-bucket downloads
-- bypass RLS); only anonymous enumeration is removed. The app never calls .list()
-- on this bucket, so there is no frontend impact.
--
-- NOTE: already applied to the live project on 2026-06-13 via Supabase MCP
-- (migration version 20260613144517). This file exists for repo/local parity and
-- carries the same version, so `supabase db push` treats it as already applied and
-- does NOT re-run it. It is additionally written to be idempotent: re-running
-- (e.g. on `db reset` or a fresh project) drops either policy name if present and
-- recreates the authenticated-scoped one, ending in the identical end state.

DROP POLICY IF EXISTS "Anyone can view student avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can view student avatars" ON storage.objects;

CREATE POLICY "Authenticated can view student avatars"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'student-avatars');
