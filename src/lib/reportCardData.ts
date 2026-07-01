// Shared shape + builder for a term report card. The admin generator, the jsPDF
// renderer and the student/parent viewers all use these so the numbers, letters and
// End-Year math live in exactly one place.
//
// Grid math (verified against the school's reference card):
//   Term%      = rubric_grades.total (the 7 weighted components, 0–100)
//   Term Total = Term% / 2            (each term is worth 50% of the year)
//   End Year   = (Semester1.total + Semester2.total) / 2   (running year total, 0–100;
//                a missing semester counts as 0, so mid-year it equals this term's Term Total)
//   Grade Letter / End Year Grade = letterFromPercent() of Term% / End Year
//   Score Card Average = mean of the subjects' Term%.

import { letterFromPercent } from './gradeScale';

export interface RubricRowInput {
  subject_id: string;
  term: string; // 'Semester 1' | 'Semester 2'
  total: number | null;
  exam_score: number;
  quiz_score: number;
  hw_score: number;
  cw_score: number;
  project_score: number;
  attendance_score: number;
  literacy_score: number;
  effort: string | null;
  comment: string | null;
}

export interface ReportCardSubjectRow {
  no: number;
  subject: string;
  subjectAr: string | null;
  exams: number;
  quizzes: number;
  homework: number;
  classwork: number;
  projects: number;
  attendance: number;
  literacy: number;
  termTotal: number; // /50
  termPct: number; // /100
  letter: string;
  effort: string | null;
  endYear: number; // /100 running
  endYearLetter: string;
  comment: string | null;
  /** Legacy alias (= termPct) kept for the simple viewer grid. */
  avg: number;
}

export interface ReportCardData {
  version: 2;
  student_line: string;
  grade_label: string;
  overall: number; // score-card average (= mean of subject Term%)
  scoreCardLetter: string;
  subjects: ReportCardSubjectRow[];
  termComment: string;
  // Legacy fields so pre-existing simple readers don't crash.
  attendance_rate?: number | null;
  comments?: string;
}

export const round2 = (n: number): number => Math.round((Number(n) || 0) * 100) / 100;

/** "Semester 1" -> "Term 1" for display; the reference card labels terms this way. */
export const termDisplayLabel = (term: string): string => term.replace('Semester', 'Term').trim();

export function buildStudentReportData(opts: {
  displayName: string;
  gradeLabel: string;
  selectedTerm: string; // 'Semester 1' | 'Semester 2'
  rows: RubricRowInput[]; // all rubric rows for this student, both terms, the academic year
  subjectName: (subjectId: string) => string;
  subjectNameAr?: (subjectId: string) => string | null;
  termComment?: string;
}): ReportCardData {
  const { displayName, gradeLabel, selectedTerm, rows, subjectName, subjectNameAr, termComment = '' } = opts;

  const bySubject = new Map<string, { s1?: RubricRowInput; s2?: RubricRowInput }>();
  for (const r of rows) {
    // Only exact semester keys count; rows under legacy/foreign term labels (e.g. '1')
    // must not silently overwrite a real semester's marks.
    if (r.term !== 'Semester 1' && r.term !== 'Semester 2') continue;
    const e = bySubject.get(r.subject_id) ?? {};
    if (r.term === 'Semester 2') e.s2 = r;
    else e.s1 = r;
    bySubject.set(r.subject_id, e);
  }

  const subjects: ReportCardSubjectRow[] = [];
  for (const [subjectId, { s1, s2 }] of bySubject) {
    const cur = selectedTerm === 'Semester 2' ? s2 : s1;
    if (!cur) continue; // subject has no grades for the selected term
    const termPct = round2(Number(cur.total ?? 0));
    const endYear = round2((Number(s1?.total ?? 0) + Number(s2?.total ?? 0)) / 2);
    subjects.push({
      no: 0,
      subject: subjectName(subjectId),
      subjectAr: subjectNameAr ? subjectNameAr(subjectId) : null,
      exams: round2(cur.exam_score),
      quizzes: round2(cur.quiz_score),
      homework: round2(cur.hw_score),
      classwork: round2(cur.cw_score),
      projects: round2(cur.project_score),
      attendance: round2(cur.attendance_score),
      literacy: round2(cur.literacy_score),
      termTotal: round2(termPct / 2),
      termPct,
      letter: letterFromPercent(termPct),
      effort: cur.effort ?? null,
      endYear,
      endYearLetter: letterFromPercent(endYear),
      comment: cur.comment ?? null,
      avg: termPct,
    });
  }

  subjects.sort((a, b) => a.subject.localeCompare(b.subject));
  subjects.forEach((s, i) => { s.no = i + 1; });

  const overall = subjects.length
    ? round2(subjects.reduce((sum, x) => sum + x.termPct, 0) / subjects.length)
    : 0;

  return {
    version: 2,
    student_line: displayName,
    grade_label: gradeLabel,
    overall,
    scoreCardLetter: letterFromPercent(overall),
    subjects,
    termComment,
    attendance_rate: null,
    comments: termComment,
  };
}
