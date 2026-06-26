-- Option B: let a teacher create growth goals for students they teach.
-- Mirrors the existing "Teachers view their students growth goals" SELECT set
-- (section_students ⋈ teacher_subject_sections, email-matched), so write access
-- matches read access. Scoped to owner_type='student'; teacher self-goals stay
-- covered by the existing "Owners manage own growth goals" policy.
create policy "Teachers create goals for their students" on public.growth_goals
  for insert to authenticated
  with check (
    owner_type = 'student'
    and owner_id in (
      select ss.student_id
      from section_students ss
      join teacher_subject_sections tss on tss.section_id = ss.section_id
      join school_teachers t on t.id = tss.teacher_id
      where lower(t.email) = lower((auth.jwt() ->> 'email')) and t.is_active = true
    )
  );
