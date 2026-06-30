-- Rubric structure: split the single Quizzes mark into Quiz 1 (/20) and Quiz 2 (/20),
-- two separately-entered marks that combine (averaged) into the existing Quizzes
-- component (quiz_score, /20). The 7 weighted components and the generated `total`
-- are unchanged: total still sums via quiz_score, so the rubric still caps at 100.

alter table public.rubric_grades
  add column if not exists quiz1_score numeric not null default 0 check (quiz1_score between 0 and 20),
  add column if not exists quiz2_score numeric not null default 0 check (quiz2_score between 0 and 20);

-- Backfill existing rows: carry the prior single quiz mark into BOTH Quiz 1 and Quiz 2
-- so the averaged Quizzes component equals the old quiz_score and no total shifts.
update public.rubric_grades
  set quiz1_score = quiz_score, quiz2_score = quiz_score
  where quiz1_score = 0 and quiz2_score = 0 and quiz_score > 0;
