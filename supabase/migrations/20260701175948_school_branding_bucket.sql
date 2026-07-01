-- Public bucket for per-school report-card branding (the header logo). Report card PDFs
-- are rendered client-side by admins, students AND parents, so the logo URL must be
-- publicly readable — hence a public bucket. Writes are restricted to a school's own admin,
-- and objects are namespaced by school id: `<school_id>/<file>`.

insert into storage.buckets (id, name, public)
values ('school-branding', 'school-branding', true)
on conflict (id) do nothing;

drop policy if exists "Public read school branding" on storage.objects;
create policy "Public read school branding" on storage.objects
  for select using (bucket_id = 'school-branding');

drop policy if exists "Admins upload school branding" on storage.objects;
create policy "Admins upload school branding" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'school-branding'
    and (storage.foldername(name))[1] in (select id::text from school_accounts where admin_user_id = auth.uid())
  );

drop policy if exists "Admins update school branding" on storage.objects;
create policy "Admins update school branding" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'school-branding'
    and (storage.foldername(name))[1] in (select id::text from school_accounts where admin_user_id = auth.uid())
  );

drop policy if exists "Admins delete school branding" on storage.objects;
create policy "Admins delete school branding" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'school-branding'
    and (storage.foldername(name))[1] in (select id::text from school_accounts where admin_user_id = auth.uid())
  );
