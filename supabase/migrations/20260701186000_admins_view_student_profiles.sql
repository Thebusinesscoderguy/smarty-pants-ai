-- School admins could not read their own students' profiles (only teachers/parents/self
-- had SELECT policies), so admin-side features that resolve student names — notably the
-- report card generator — got NULL display_name and fell back to "Unknown". Grant school
-- admins SELECT on the profiles of students enrolled in their school.
create policy "School admins view student profiles" on public.profiles
  for select to authenticated
  using (
    id in (
      select ssr.student_id
      from public.school_student_relationships ssr
      join public.school_accounts sa on sa.id = ssr.school_id
      where sa.admin_user_id = auth.uid() and ssr.is_active = true
    )
  );
