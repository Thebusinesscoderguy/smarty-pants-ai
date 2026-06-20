-- Private bucket for copyrighted curriculum source files. Signed-URL access only;
-- never getPublicUrl. Path convention: {school_id}/{document_id}/{filename}.
--
-- NOTE: already applied to the live project on 2026-06-20 via Supabase MCP
-- (migration version 20260620082237). Repo/local parity file, same version, so
-- `supabase db push` treats it as already applied. Idempotent (on conflict /
-- DROP POLICY IF EXISTS) so re-running on a fresh project or `db reset` is safe.
--
-- Storage RLS assumes segment 1 of the object path is the school_id (uuid). Only
-- school admins can read/write; access is admin-only and signed-URL based.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('curriculum-docs', 'curriculum-docs', false, 104857600, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "School admins read curriculum docs"   on storage.objects;
create policy "School admins read curriculum docs" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'curriculum-docs'
    and is_school_admin_of(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "School admins upload curriculum docs" on storage.objects;
create policy "School admins upload curriculum docs" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'curriculum-docs'
    and is_school_admin_of(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "School admins update curriculum docs" on storage.objects;
create policy "School admins update curriculum docs" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'curriculum-docs'
    and is_school_admin_of(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "School admins delete curriculum docs" on storage.objects;
create policy "School admins delete curriculum docs" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'curriculum-docs'
    and is_school_admin_of(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
