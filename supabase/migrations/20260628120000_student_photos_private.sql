-- Private student photos (staff-only, signed-URL access).
-- SENSITIVITY: children's face photos. The bucket is PRIVATE and is never visible
-- to parents or students. Enforcement lives here (storage RLS), not in the UI.

-- 1) Path reference on the student record. The image itself lives in the private
--    bucket; we store ONLY the object path. Distinct from `avatar_url` (which is a
--    public gamification avatar surfaced to students/parents — never reused here).
alter table public.profiles add column if not exists student_photo_path text;

-- 2) Staff-only membership: school admin OR active teacher OR active staff.
--    Deliberately EXCLUDES students (section_students / school_student_relationships)
--    and parents (parent_child_relationships) so they can never view photos.
create or replace function public.is_school_staff(_user_id uuid, _school_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists (select 1 from public.school_accounts sa
            where sa.id = _school_id and sa.admin_user_id = _user_id)
    or exists (select 1 from public.school_teachers st
               where st.school_id = _school_id
                 and lower(st.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
                 and st.is_active = true)
    or exists (select 1 from public.school_staff ss
               where ss.school_id = _school_id
                 and (ss.user_id = _user_id
                      or lower(ss.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
                 and ss.is_active = true);
$$;
revoke all on function public.is_school_staff(uuid, uuid) from public, anon;
grant execute on function public.is_school_staff(uuid, uuid) to authenticated, service_role;

-- 3) Office-staff (write): school admin OR active staff — NOT teachers.
--    Upload/replace/remove is restricted to admin/office staff (product decision);
--    teachers can VIEW (via is_school_staff) but not modify.
create or replace function public.is_school_office(_user_id uuid, _school_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists (select 1 from public.school_accounts sa
            where sa.id = _school_id and sa.admin_user_id = _user_id)
    or exists (select 1 from public.school_staff ss
               where ss.school_id = _school_id
                 and (ss.user_id = _user_id
                      or lower(ss.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
                 and ss.is_active = true);
$$;
revoke all on function public.is_school_office(uuid, uuid) from public, anon;
grant execute on function public.is_school_office(uuid, uuid) to authenticated, service_role;

-- 4) PRIVATE bucket (public = false). Signed-URL access only. ~5 MB, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-photos', 'student-photos', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 5) Storage RLS. Path convention: {school_id}/{student_id}-{rand}.{ext}
--    so (storage.foldername(name))[1] is the owning school_id. The bucket_id
--    predicate is evaluated first, scoping these policies to this bucket only.

-- VIEW (required to mint signed URLs): any staff of that school.
drop policy if exists "Staff view student photos" on storage.objects;
create policy "Staff view student photos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'student-photos'
    and public.is_school_staff(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

-- WRITE: admin/office staff of that school only.
drop policy if exists "Office staff insert student photos" on storage.objects;
create policy "Office staff insert student photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'student-photos'
    and public.is_school_office(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Office staff update student photos" on storage.objects;
create policy "Office staff update student photos" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'student-photos'
    and public.is_school_office(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Office staff delete student photos" on storage.objects;
create policy "Office staff delete student photos" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'student-photos'
    and public.is_school_office(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
