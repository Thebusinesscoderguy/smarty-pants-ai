# Arabic Terms — Review List

Running list of education/UI terms whose Arabic rendering is genuinely ambiguous
(multiple acceptable options or dialect-sensitive). English → chosen Arabic (MSA,
school context) → where it appears. Review all in one pass.

Standing decisions already applied everywhere:
- **Section** → `الفصل`
- **Excused** → `بعذر`

| English | Arabic (chosen) | Area / file | Note |
|---|---|---|---|
| Section | الفصل | all (standing decision) | vs الشعبة / الصف |
| Excused | بعذر | attendance, rubric, gb attendance | standing decision |
| Grade (level) | الصف | gradebook, sections, teachers | grade level vs Section=الفصل |
| Term (semester) | الفصل الدراسي | rubric, gradebook | overlaps wording with Section=الفصل but standard |
| Late | متأخر | attendance | vs "تأخّر" |
| Rubric | التقييم | gradebook tab, RubricTab | vs "سلّم التقدير" (more literal) |
| Literacy | القراءة والكتابة | rubric, gradebook, semester | vs "المهارات اللغوية" |
| Quizzes | الاختبارات القصيرة | rubric | vs "الكويزات" |
| Classwork | العمل الصفي | rubric, gradebook | |
| Observation (classroom) | الملاحظة الصفية | observations | vs "الزيارة الصفية" |
| Incident (behavior) | موقف | behavior | vs "حادثة" (implies accident) |
| Growth Goals | أهداف التطوّر المهني | growth goals | "professional growth" reading |
| Assessment | تقييم | assessments | vs "اختبار" (=exam/test) |
| Exam (mode) | اختبار | assessments, exam monitoring | distinct from "تقييم" |
| Practice (mode) | تدريب | assessments | |
| Violation (exam) | مخالفة | assessments, exam monitoring | proctoring sense |
| Students (counter, "5 students") | طالبًا / طالب | attendance, gradebook | tamyiz; singular form after number |
| Registrar | المسجّل | staff | role title |
| Vice Principal | وكيل المدرسة | staff | Gulf convention; vs "نائب المدير" |
| Grade (letter A–F) | التقدير | gradebook summary | distinct from الصف (grade level) |
| Manual (entry) | يدوي | import/export | |
| Quest | المهمة / المهام | monitoring dashboards | gamification sense |
| Curriculum | المنهج | landing, importer, nav | |
| Insights | رؤى | monitoring dashboards | vs "بصائر" |
| Engagement | التفاعل / تفاعلًا | monitoring AI-insights | |
| Roster | قائمة الطلاب | school-onboarding RosterStep | |
| Pre-K / Kindergarten | ما قبل الروضة / الروضة | ChildrenManagement grades | |
| Strengths / Weaknesses | نقاط القوة / نقاط الضعف | analytics, monitoring | |
| College (grade option) | الجامعة | QuizGenerator, importer | |
| Mastery | إتقان | monitoring AI-insights | |
| ELI5 (explain like I'm 5) | بَسِّط | QuizResults | chose verb "simplify" over literal |
| Vice Principal etc. | (see staff above) | — | — |

## Component-migration batch (pages + feature components)
Added en+ar for ~40 component namespaces (landing, onboarding, monitoring, quiz,
school-onboarding steps, analytics, news, share, exam, attendance, subjects,
curriculum, student). Education terms followed the standing decisions above; the
new ambiguous ones are listed in the table rows added in this batch.

## Not translated by design (flagged)
- **PDF exports** (Behavior incident report): left in **English** — jsPDF cannot render
  Arabic without an embedded Arabic font; translating would produce broken glyphs.
- **CSV export column headers** (Grade Book summary): left in **English** — these are
  data-interchange files, not on-screen UI.
- **`Grade N` section labels coming from the database** (e.g. "Grade 1 A"): the digit/letter
  are stored data; the word "Grade" is localized via `gradebook.gradePrefix` where built
  in-app, and the runtime DOM translator covers any DB-origin strings.
