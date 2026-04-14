

# Build Features 6-8: Teacher Lesson Plans, Homework System, School Analytics PDF

## Feature 6: Teacher Lesson Plan Generator

**What**: Teachers type a topic, grade level, and subject → AI generates a structured lesson plan with objectives, activities, assessment questions, and homework suggestions.

**Implementation**:
1. **New Edge Function** `generate-lesson-plan/index.ts` — Takes topic, grade level, subject, duration. Uses OpenAI to produce a structured lesson plan with: learning objectives, warm-up activity, main lesson, practice activities, assessment questions, homework assignment, and differentiation notes.
2. **New Component** `src/components/admin/TeacherLessonPlanGenerator.tsx` — Form with topic, grade, subject, duration inputs. Displays generated plan in formatted markdown with print/download option.
3. **Add "Lesson Plans" tab** to the SchoolAdmin page (for both teacher and admin views). New tab with `FileText` icon.
4. **New DB table** `teacher_lesson_plans` — stores generated plans (teacher_id, school_id, topic, subject, grade_level, content, created_at) so teachers can revisit them. RLS: teachers see their own plans.

**Database migration**:
```sql
CREATE TABLE teacher_lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  school_id UUID REFERENCES school_accounts(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  subject TEXT,
  grade_level TEXT,
  duration_minutes INTEGER DEFAULT 45,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE teacher_lesson_plans ENABLE ROW LEVEL SECURITY;
-- Teachers see own plans
CREATE POLICY "Teachers manage own plans" ON teacher_lesson_plans
  FOR ALL TO authenticated USING (teacher_id = auth.uid());
```

---

## Feature 7: Homework Assignment System

**What**: Teachers create homework assignments (linked to subjects/sections) → students see them in their dashboard → auto-graded quizzes or manual submission → results flow to gradebook.

**Implementation**:
1. **New DB tables**:
   - `homework_assignments` — school_id, teacher_id, subject_id, section_id, title, description, type (quiz/reading/practice), due_date, quiz_id (nullable, links to existing quizzes), is_active
   - `homework_submissions` — assignment_id, student_id, status (pending/submitted/graded), submitted_at, score, feedback
2. **New Component** `src/components/admin/HomeworkManagement.tsx` — Teachers create assignments, pick subject/section, set due date, optionally attach a quiz from existing assessments.
3. **New Component** `src/components/student/HomeworkList.tsx` — Students see pending homework, click to complete (opens quiz or text submission).
4. **Add "Homework" tab** to SchoolAdmin for teachers/admins.
5. **Add homework section** to the student dashboard showing pending assignments with due dates.
6. **RLS policies**: Teachers see assignments they created or for their school. Students see assignments for their section.

**Database migration**:
```sql
CREATE TABLE homework_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES school_accounts(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES school_subjects(id) ON DELETE CASCADE,
  section_id UUID REFERENCES school_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignment_type TEXT DEFAULT 'practice' CHECK (assignment_type IN ('quiz','reading','practice')),
  quiz_id UUID REFERENCES school_assessments(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE homework_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES homework_assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','submitted','graded')),
  submitted_at TIMESTAMPTZ,
  score NUMERIC,
  feedback TEXT,
  response_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

ALTER TABLE homework_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage homework" ON homework_assignments
  FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Students view homework" ON homework_assignments
  FOR SELECT TO authenticated USING (
    section_id IN (
      SELECT section_id FROM school_students WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Students manage own submissions" ON homework_submissions
  FOR ALL TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Teachers view submissions" ON homework_submissions
  FOR SELECT TO authenticated USING (
    assignment_id IN (
      SELECT id FROM homework_assignments WHERE teacher_id = auth.uid()
    )
  );
```

---

## Feature 8: School Analytics PDF Report

**What**: Admin clicks "Generate Report" → downloads a branded PDF with class averages, top performers, at-risk students, subject breakdowns, and attendance stats.

**Implementation**:
1. **New Component** `src/components/admin/SchoolAnalyticsReport.tsx` — Button on SchoolOverview that generates a PDF using `jspdf` + `jspdf-autotable`.
2. **PDF content**: School name header, date range, student count, per-subject averages (from gradebook data), top 5 performers, at-risk students (score < 50%), attendance summary, section breakdown.
3. **Data source**: Queries existing tables (`student_daily_grades`, `student_attendance`, `student_semester_marks`, `school_students`, `school_subjects`, `school_sections`).
4. **Install** `jspdf` and `jspdf-autotable` npm packages.
5. **Add "Reports" button** to the SchoolOverview tab or as a new "Reports" tab.

No new database tables needed — this reads from existing data.

---

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `supabase/functions/generate-lesson-plan/index.ts` |
| Create | `src/components/admin/TeacherLessonPlanGenerator.tsx` |
| Create | `src/components/admin/HomeworkManagement.tsx` |
| Create | `src/components/student/HomeworkList.tsx` |
| Create | `src/components/admin/SchoolAnalyticsReport.tsx` |
| Modify | `src/pages/SchoolAdmin.tsx` — Add Lesson Plans, Homework, Reports tabs |
| Modify | `src/components/dashboards/StudentDashboard.tsx` — Show pending homework |
| Migration | New tables: `teacher_lesson_plans`, `homework_assignments`, `homework_submissions` |
| Install | `jspdf`, `jspdf-autotable` |

