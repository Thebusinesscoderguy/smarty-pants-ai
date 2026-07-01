import { letterFromPercent } from '@/lib/gradeScale';

export interface SchoolSubject {
  id: string;
  name: string;
}

/**
 * Maps the school's active semester (S1/S2) to the exact `term` + `academic_year`
 * keys that rubric_grades rows are stored under. Uses the same Aug-boundary rule the
 * Rubric/Summary tabs use (academic year starts in August). Centralizing this means the
 * report card generator, the Rubric tab and the Semester Marks tab all resolve the SAME
 * rubric_grades row — a mismatch here is exactly why the old generator found nothing.
 */
export const academicContext = (
  activeSemester: string | null | undefined,
  ref: Date = new Date(),
): { term: string; academicYear: string } => {
  const startYear = ref.getMonth() >= 7 ? ref.getFullYear() : ref.getFullYear() - 1;
  return {
    academicYear: `${startYear}-${startYear + 1}`,
    term: activeSemester === 'S2' ? 'Semester 2' : 'Semester 1',
  };
};

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
  final_exam_mark: number | null;
}

export interface StudentGradeData {
  student_id: string;
  student_name: string;
  student_photo_path: string | null;
  section_label: string;
  // Classwork/Homework/Literacy: two-stage weekly→semester average, already on the /10
  // scale (see twoStageWeeklyAverage). Counts are kept for empty-state display.
  classwork_component: number;
  homework_component: number;
  literacy_component: number;
  classwork_count: number;
  homework_count: number;
  literacy_count: number;
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
 *   1. Group period marks by week (see weekKey — anchored to the term start when given,
 *      so the Summary and the publish roll-up group identically; else ISO-Monday).
 *   2. Average the marks within each week → weekly mark.
 *   3. Average the weekly marks → the semester component (/10).
 * This is NOT a flat average of all period marks. Returns null when there are none.
 */
export const twoStageWeeklyAverage = (
  periods: { date: string; mark: number }[],
  termStart?: string | null,
): number | null => {
  if (!periods.length) return null;
  const weeks: Record<string, { sum: number; count: number }> = {};
  for (const p of periods) {
    const key = weekKey(p.date, termStart);
    const w = weeks[key] || (weeks[key] = { sum: 0, count: 0 });
    w.sum += p.mark;
    w.count += 1;
  }
  const weekly = Object.values(weeks).map(w => w.sum / w.count);
  return weekly.reduce((a, b) => a + b, 0) / weekly.length;
};

// ---- Riyadh / term-start week helpers -------------------------------------------------
// Stored grade dates are naive calendar days (the Riyadh day they were entered), so week
// math is plain date arithmetic. Only "today" is converted from the clock (riyadhToday).

const MS_DAY = 86400000;
// Whole calendar-days between two YYYY-MM-DD dates (parsed as UTC midnight to avoid drift).
const dayDiff = (a: string, b: string): number =>
  Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / MS_DAY);
// Calendar weekday (0=Sun..6=Sat) for a date-only value.
const calDow = (dateStr: string): number => new Date(`${dateStr}T00:00:00Z`).getUTCDay();

// Group key for a date: a 7-day block index from the term start, else ISO-Monday date.
const weekKey = (dateStr: string, termStart?: string | null): string => {
  if (termStart) return String(Math.floor(dayDiff(dateStr, termStart) / 7));
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

// 1-based term-week number for a date, from the term start.
export const weekNumber = (dateStr: string, termStart: string): number =>
  Math.floor(dayDiff(dateStr, termStart) / 7) + 1;

// Today's Riyadh calendar date as YYYY-MM-DD (explicit Asia/Riyadh, not browser TZ).
export const riyadhToday = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(new Date());

// Client mirror of the server publish gate: P0 = first Wednesday on/after the term start;
// open on Wednesdays every 14 days from P0. `todayStr` must be the Riyadh calendar date.
export const isPublishDay = (todayStr: string, termStart: string): boolean => {
  if (calDow(todayStr) !== 3) return false; // 3 = Wednesday
  const p0Offset = ((3 - calDow(termStart)) + 7) % 7;
  const sinceP0 = dayDiff(todayStr, termStart) - p0Offset;
  return sinceP0 >= 0 && sinceP0 % 14 === 0;
};

export const calculateWeightedTotal = (s: StudentGradeData): WeightedTotal => {
  // Classwork/Homework/Literacy: already the two-stage /10 component; clamp to the max.
  const classwork = s.classwork_count > 0 ? Math.min(10, s.classwork_component) : 0;
  const homework = s.homework_count > 0 ? Math.min(10, s.homework_component) : 0;
  const literacy = s.literacy_count > 0 ? Math.min(10, s.literacy_component) : 0;
  // Attendance: (present/total) * 20
  const attendance = s.total_days > 0 ? (s.days_present / s.total_days) * 20 : 0;
  // Quizzes: (Quiz 1 + Quiz 2) / 2, direct /20
  const quizzes = Math.min(20, s.quiz_component);
  // Final exam: direct /20
  const finalExam = s.semester_marks.final_exam_mark ?? 0;
  // Project: direct /10
  const project = s.semester_marks.project_mark ?? 0;

  const total = Math.round((classwork + homework + attendance + quizzes + finalExam + project + literacy) * 10) / 10;

  return { classwork: Math.round(classwork * 10) / 10, homework: Math.round(homework * 10) / 10, attendance: Math.round(attendance * 10) / 10, quizzes: Math.round(quizzes * 10) / 10, finalExam, project, literacy, total };
};

// Delegates to the shared report-card scale so the Summary and the report card
// letter columns always agree (proper +/- bands, not the old A/B/C/D/F at 90/80/…).
export const getLetterGrade = (total: number): string => letterFromPercent(total);
