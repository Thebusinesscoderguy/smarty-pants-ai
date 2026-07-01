-- Arabic subject name for the bilingual report card grid (English + Arabic subject
-- names, matching the reference card). Optional; English `name` stays required.
alter table public.school_subjects
  add column if not exists name_ar text;

-- Seed Arabic names for common subjects (only where unset) so bilingual cards work
-- out of the box for existing schools.
update public.school_subjects set name_ar = 'اللغة الإنجليزية' where lower(name) = 'english' and name_ar is null;
update public.school_subjects set name_ar = 'الرياضيات' where lower(name) = 'mathematics' and name_ar is null;
update public.school_subjects set name_ar = 'العلوم' where lower(name) = 'science' and name_ar is null;
