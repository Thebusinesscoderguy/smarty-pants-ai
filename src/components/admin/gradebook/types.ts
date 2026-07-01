export interface SchoolSubject {
  id: string;
  name: string;
}

export interface DailyGrade {
  id?: string;
  grade_date: string;
  classwork_mark: number | null;
  homework_mark: number | null;
}

export interface AttendanceRecord {
  attendance_date: string;
  is_present: boolean;
}

export interface SemesterMarks {
  project_mark: number | null;
  literacy_mark: number | null;
  final_exam_mark: number | null;
}

export interface StudentGradeData {
  student_id: string;
  student_name: string;
  student_photo_path: string | null;
  section_label: string;
  // Classwork/Homework: two-stage weekly→semester average, already on the /10 scale
  // (see twoStageWeeklyAverage). Counts are kept for empty-state display.
  classwork_component: number;
  homework_component: number;
  classwork_count: number;
  homework_count: number;
  // Attendance: days_present / total_days * 20 (single roll-up)
  days_present: number;
  total_days: number;
  // Quizzes /20 = (Quiz 1 + Quiz 2) / 2, from rubric_grades.quiz_score
  quiz_component: number;
  // Semester marks (teacher input)
  semester_marks: SemesterMarks;
}

export interface WeightedTotal {
  classwork: number;    // /10
  homework: number;     // /10
  attendance: number;   // /20
  quizzes: number;      // /20
  finalExam: number;    // /20
  project: number;      // /10
  literacy: number;     // /10
  total: number;        // /100
}

/**
 * Two-stage average for period marks (out of 10):
 *   1. Group period marks by ISO week (Monday of the mark's week).
 *   2. Average the marks within each week → weekly mark.
 *   3. Average the weekly marks → the semester component (/10).
 * This is NOT a flat average of all period marks. Returns null when there are none.
 */
export const twoStageWeeklyAverage = (periods: { date: string; mark: number }[]): number | null => {
  if (!periods.length) return null;
  const weeks: Record<string, { sum: number; count: number }> = {};
  for (const p of periods) {
    const key = weekKey(p.date);
    const w = weeks[key] || (weeks[key] = { sum: 0, count: 0 });
    w.sum += p.mark;
    w.count += 1;
  }
  const weekly = Object.values(weeks).map(w => w.sum / w.count);
  return weekly.reduce((a, b) => a + b, 0) / weekly.length;
};

// Stable key for the ISO week a date falls in: the date of that week's Monday (UTC).
const weekKey = (dateStr: string): string => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = (day + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diffToMonday);
  return d.toISOString().slice(0, 10);
};

export const calculateWeightedTotal = (s: StudentGradeData): WeightedTotal => {
  // Classwork/Homework: already the two-stage /10 component; clamp to the max.
  const classwork = s.classwork_count > 0 ? Math.min(10, s.classwork_component) : 0;
  const homework = s.homework_count > 0 ? Math.min(10, s.homework_component) : 0;
  // Attendance: (present/total) * 20
  const attendance = s.total_days > 0 ? (s.days_present / s.total_days) * 20 : 0;
  // Quizzes: (Quiz 1 + Quiz 2) / 2, direct /20
  const quizzes = Math.min(20, s.quiz_component);
  // Final exam: direct /20
  const finalExam = s.semester_marks.final_exam_mark ?? 0;
  // Project: direct /10
  const project = s.semester_marks.project_mark ?? 0;
  // Literacy: direct /10
  const literacy = s.semester_marks.literacy_mark ?? 0;

  const total = Math.round((classwork + homework + attendance + quizzes + finalExam + project + literacy) * 10) / 10;

  return { classwork: Math.round(classwork * 10) / 10, homework: Math.round(homework * 10) / 10, attendance: Math.round(attendance * 10) / 10, quizzes: Math.round(quizzes * 10) / 10, finalExam, project, literacy, total };
};

export const getLetterGrade = (total: number): string => {
  if (total >= 90) return 'A';
  if (total >= 80) return 'B';
  if (total >= 70) return 'C';
  if (total >= 60) return 'D';
  return 'F';
};
