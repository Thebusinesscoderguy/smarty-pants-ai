-- FamilyHub showed "No children linked yet": parent_child_relationships links exist and
-- are readable by the parent, but profiles RLS had no policy letting a parent read their
-- OWN children's profile rows (only "Users can view their own profile" + "Teachers can
-- view student profiles" existed). FamilyHub builds its child list from profiles, so it
-- got 0 rows and rendered the empty state despite the links existing.
--
-- Add a scoped SELECT policy: a parent may read the profile rows of children linked to
-- them via parent_child_relationships. Image privacy is unaffected — the private
-- student-photos bucket RLS stays staff-only, so a parent still cannot fetch a child's
-- photo (they can only read the path string, which is useless without bucket access).
create policy "Parents can view their children's profiles" on public.profiles
  for select to authenticated
  using (
    id in (select pcr.child_id from public.parent_child_relationships pcr
           where pcr.parent_id = auth.uid())
  );
