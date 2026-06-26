-- Allow active teachers to create/manage behavior categories for their own school.
-- Previously only school admins could (the "School admins manage behavior categories" policy);
-- the Behavior Management → Categories section is now available to teachers too.
drop policy if exists "Teachers manage behavior categories" on public.behavior_categories;
create policy "Teachers manage behavior categories" on public.behavior_categories
  for all to authenticated
  using (
    school_id in (
      select st.school_id from public.school_teachers st
      where lower(st.email) = lower(auth.jwt() ->> 'email') and st.is_active = true
    )
  )
  with check (
    school_id in (
      select st.school_id from public.school_teachers st
      where lower(st.email) = lower(auth.jwt() ->> 'email') and st.is_active = true
    )
  );
