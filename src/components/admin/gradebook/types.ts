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
  // Daily averages (will be scaled to /10)
  classwork_avg: number;
  homework_avg: number;
  classwork_count: number;
  homework_count: number;
  // Attendance: days_present / total_days * 20
  days_present: number;
  total_days: number;
  // Normal exams /20 (from quiz/test attempts)
  normal_exam_avg: number;
  normal_exam_count: number;
  // Semester marks (teacher input)
  semester_marks: SemesterMarks;
}

export interface WeightedTotal {
  classwork: number;    // /10
  homework: number;     // /10
  attendance: number;   // /20
  normalExams: number;  // /20
  finalExam: number;    // /20
  project: number;      // /10
  literacy: number;     // /10
  total: number;        // /100
}

export const calculateWeightedTotal = (s: StudentGradeData): WeightedTotal => {
  // Classwork: avg of daily marks scaled to /10
  const classwork = s.classwork_count > 0 ? Math.min(10, (s.classwork_avg / 100) * 10) : 0;
  // Homework: avg of daily marks scaled to /10
  const homework = s.homework_count > 0 ? Math.min(10, (s.homework_avg / 100) * 10) : 0;
  // Attendance: (present/total) * 20
  const attendance = s.total_days > 0 ? (s.days_present / s.total_days) * 20 : 0;
  // Normal exams: avg percentage scaled to /20
  const normalExams = s.normal_exam_count > 0 ? Math.min(20, (s.normal_exam_avg / 100) * 20) : 0;
  // Final exam: direct /20
  const finalExam = s.semester_marks.final_exam_mark ?? 0;
  // Project: direct /10
  const project = s.semester_marks.project_mark ?? 0;
  // Literacy: direct /10
  const literacy = s.semester_marks.literacy_mark ?? 0;

  const total = Math.round((classwork + homework + attendance + normalExams + finalExam + project + literacy) * 10) / 10;

  return { classwork: Math.round(classwork * 10) / 10, homework: Math.round(homework * 10) / 10, attendance: Math.round(attendance * 10) / 10, normalExams: Math.round(normalExams * 10) / 10, finalExam, project, literacy, total };
};

export const getLetterGrade = (total: number): string => {
  if (total >= 90) return 'A';
  if (total >= 80) return 'B';
  if (total >= 70) return 'C';
  if (total >= 60) return 'D';
  return 'F';
};
