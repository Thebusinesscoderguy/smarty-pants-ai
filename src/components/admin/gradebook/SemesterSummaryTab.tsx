import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Loader2, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { StudentGradeData, SemesterMarks, calculateWeightedTotal, getLetterGrade, twoStageWeeklyAverage } from './types';
import { StudentAvatar } from '@/components/admin/StudentAvatar';
import { SemesterControl } from './SemesterControl';
import { GradePublishControl } from './GradePublishControl';
import { useActiveSemester } from '@/hooks/useActiveSemester';

interface StudentInfo {
  student_id: string;
  student_name: string;
  student_photo_path: string | null;
  section_label: string;
}

interface SemesterSummaryTabProps {
  subjectId: string;
  subjectName: string;
  students: StudentInfo[];
  schoolId: string;
  photoUrls: Record<string, string>;
}

export const SemesterSummaryTab = ({ subjectId, subjectName, students, schoolId, photoUrls }: SemesterSummaryTabProps) => {
  const { user, isSchoolAdmin } = useAuth();
  const { t } = useLanguage();
  const { activeSemester, setActiveSemester } = useActiveSemester(schoolId);
  const [semester, setSemester] = useState('S1');
  const [gradeData, setGradeData] = useState<StudentGradeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [semesterInit, setSemesterInit] = useState(false);

  // Default the view to the school's open semester once it loads; the user can still switch.
  useEffect(() => {
    if (!semesterInit && activeSemester) { setSemester(activeSemester); setSemesterInit(true); }
  }, [activeSemester, semesterInit]);

  useEffect(() => {
    if (students.length > 0) loadSummary();
  }, [subjectId, semester, students]);

  const loadSummary = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const studentIds = students.map(s => s.student_id);

      // Academic year + rubric term key, derived exactly like RubricTab (Aug boundary).
      const now = new Date();
      const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
      const academicYear = `${startYear}-${startYear + 1}`;
      const term = semester === 'S1' ? 'Semester 1' : 'Semester 2';

      // Term start anchors the weekly grouping so it matches the published roll-up.
      const { data: gradeSettings } = await supabase
        .from('school_grade_settings')
        .select('term_start_date')
        .eq('school_id', schoolId)
        .maybeSingle();
      const termStart = gradeSettings?.term_start_date ?? null;

      // Period components are scoped by the semester each mark was stamped with (the
      // semester that was active when it was entered) — no date ranges.
      const [dailyRes, attendRes, semRes, rubricRes] = await Promise.all([
        supabase.from('student_daily_grades').select('student_id, classwork_mark, homework_mark, literacy_mark, grade_date').eq('subject_id', subjectId).eq('semester', semester).in('student_id', studentIds),
        supabase.from('student_attendance').select('student_id, is_present').eq('subject_id', subjectId).eq('semester', semester).in('student_id', studentIds),
        supabase.from('student_semester_marks').select('student_id, project_mark, final_exam_mark').eq('subject_id', subjectId).eq('semester', semester).in('student_id', studentIds),
        supabase.from('rubric_grades').select('student_id, quiz_score').eq('subject_id', subjectId).eq('term', term).eq('academic_year', academicYear).in('student_id', studentIds),
      ]);

      // Collect per-period classwork/homework/literacy marks for the two-stage weekly average.
      const cwPeriods: Record<string, { date: string; mark: number }[]> = {};
      const hwPeriods: Record<string, { date: string; mark: number }[]> = {};
      const litPeriods: Record<string, { date: string; mark: number }[]> = {};
      for (const d of dailyRes.data || []) {
        if (d.classwork_mark != null) (cwPeriods[d.student_id] ||= []).push({ date: d.grade_date, mark: d.classwork_mark });
        if (d.homework_mark != null) (hwPeriods[d.student_id] ||= []).push({ date: d.grade_date, mark: d.homework_mark });
        if (d.literacy_mark != null) (litPeriods[d.student_id] ||= []).push({ date: d.grade_date, mark: d.literacy_mark });
      }

      // Aggregate attendance (single roll-up)
      const attendAgg: Record<string, { present: number; total: number }> = {};
      for (const a of attendRes.data || []) {
        if (!attendAgg[a.student_id]) attendAgg[a.student_id] = { present: 0, total: 0 };
        attendAgg[a.student_id].total++;
        if (a.is_present) attendAgg[a.student_id].present++;
      }

      // Semester marks (project + final exam only; literacy is now per-period)
      const semMap: Record<string, SemesterMarks> = {};
      for (const s of semRes.data || []) {
        semMap[s.student_id] = { project_mark: s.project_mark, final_exam_mark: s.final_exam_mark };
      }

      // Quizzes /20 = rubric_grades.quiz_score ((Quiz 1 + Quiz 2) / 2)
      const quizMap: Record<string, number> = {};
      for (const r of rubricRes.data || []) quizMap[r.student_id] = r.quiz_score ?? 0;

      const result: StudentGradeData[] = students.map(s => {
        const cw = cwPeriods[s.student_id] || [];
        const hw = hwPeriods[s.student_id] || [];
        const lit = litPeriods[s.student_id] || [];
        const a = attendAgg[s.student_id] || { present: 0, total: 0 };
        return {
          ...s,
          classwork_component: twoStageWeeklyAverage(cw, termStart) ?? 0,
          homework_component: twoStageWeeklyAverage(hw, termStart) ?? 0,
          literacy_component: twoStageWeeklyAverage(lit, termStart) ?? 0,
          classwork_count: cw.length,
          homework_count: hw.length,
          literacy_count: lit.length,
          days_present: a.present,
          total_days: a.total,
          quiz_component: quizMap[s.student_id] ?? 0,
          semester_marks: semMap[s.student_id] || { project_mark: null, final_exam_mark: null },
        };
      });

      result.sort((a, b) => a.section_label.localeCompare(b.section_label) || a.student_name.localeCompare(b.student_name));
      setGradeData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Section', 'Student', 'Classwork /10', 'Homework /10', 'Attendance /20', 'Quizzes /20', 'Final Exam /20', 'Project /10', 'Literacy /10', 'Total /100', 'Grade'];
    const rows = gradeData.map(s => {
      const w = calculateWeightedTotal(s);
      return [s.section_label, s.student_name, w.classwork, w.homework, w.attendance, w.quizzes, w.finalExam, w.project, w.literacy, w.total, getLetterGrade(w.total)];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `gradebook-${subjectName}-${semester}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: t('gbSummary.exported'), description: t('gbSummary.exportedDesc') });
  };

  const sections: Record<string, StudentGradeData[]> = {};
  for (const s of gradeData) {
    if (!sections[s.section_label]) sections[s.section_label] = [];
    sections[s.section_label].push(s);
  }

  const getGradeBadge = (grade: string) => {
    const colors: Record<string, string> = {
      A: 'bg-green-100 text-green-800 border-green-200',
      B: 'bg-blue-100 text-blue-800 border-blue-200',
      C: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      D: 'bg-violet-100 text-violet-800 border-violet-200',
      F: '',
    };
    if (grade === 'F') return <Badge variant="destructive">F</Badge>;
    return <Badge className={colors[grade]}>{grade}</Badge>;
  };

  return (
    <div className="space-y-4">
      {isSchoolAdmin && <SemesterControl schoolId={schoolId} activeSemester={activeSemester} onChanged={setActiveSemester} />}
      <GradePublishControl schoolId={schoolId} subjectId={subjectId} isAdmin={isSchoolAdmin} />
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={semester} onValueChange={setSemester}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="S1">{t('gradebook.semester1')}</SelectItem>
            <SelectItem value="S2">{t('gradebook.semester2')}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCSV} disabled={gradeData.length === 0}>
          <Download className="h-4 w-4 mr-2" />{t('gradebook.exportCsv')}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-2">
        <span>📝 {t('gbSummary.sumClasswork')}</span>
        <span>📚 {t('gbSummary.sumHomework')}</span>
        <span>✅ {t('gbSummary.sumAttendance')}</span>
        <span>📊 {t('gbSummary.sumQuizzes')}</span>
        <span>🎓 {t('gbSummary.sumFinalExam')}</span>
        <span>🔬 {t('gbSummary.sumProject')}</span>
        <span>📖 {t('gbSummary.sumLiteracy')}</span>
        <span className="font-bold">🏆 {t('gbSummary.sumTotal')}</span>
      </div>

      {isLoading ? (
        <div className="animate-pulse text-muted-foreground py-8 text-center">{t('gbSummary.loadingSummary')}</div>
      ) : Object.keys(sections).length === 0 ? (
        <Card className="bg-card border-border"><CardContent className="p-8 text-center text-muted-foreground">{t('gradebook.noStudents')}</CardContent></Card>
      ) : (
        Object.entries(sections).sort(([a], [b]) => a.localeCompare(b)).map(([sectionLabel, sectionStudents]) => (
          <SectionSummaryTable key={sectionLabel} sectionLabel={sectionLabel} students={sectionStudents} getGradeBadge={getGradeBadge} photoUrls={photoUrls} />
        ))
      )}
    </div>
  );
};

const SectionSummaryTable = ({ sectionLabel, students, getGradeBadge, photoUrls }: {
  sectionLabel: string;
  students: StudentGradeData[];
  getGradeBadge: (g: string) => React.ReactNode;
  photoUrls: Record<string, string>;
}) => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="bg-card border-border overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left">
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
          <Users className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">{sectionLabel}</span>
          <Badge variant="secondary">{students.length} {t('gradebook.studentsCount')}</Badge>
        </div>
      </button>
      {expanded && (
        <CardContent className="p-0 border-t border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('gradebook.student')}</TableHead>
                <TableHead className="text-center">{t('gbSummary.colCW')}</TableHead>
                <TableHead className="text-center">{t('gbSummary.colHW')}</TableHead>
                <TableHead className="text-center">{t('gbSummary.colAttend')}</TableHead>
                <TableHead className="text-center">{t('gbSummary.colQuizzes')}</TableHead>
                <TableHead className="text-center">{t('gbSummary.colFinal')}</TableHead>
                <TableHead className="text-center">{t('gbSummary.colProj')}</TableHead>
                <TableHead className="text-center">{t('gbSummary.colLit')}</TableHead>
                <TableHead className="text-center font-bold">{t('gbSummary.colTotal')}</TableHead>
                <TableHead className="text-center">{t('gbSummary.colGrade')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map(s => {
                const w = calculateWeightedTotal(s);
                const grade = getLetterGrade(w.total);
                return (
                  <TableRow key={s.student_id}>
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <StudentAvatar name={s.student_name} photoUrl={photoUrls[s.student_id]} />
                        {s.student_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{w.classwork}</TableCell>
                    <TableCell className="text-center">{w.homework}</TableCell>
                    <TableCell className="text-center">{w.attendance}</TableCell>
                    <TableCell className="text-center">{w.quizzes}</TableCell>
                    <TableCell className="text-center">{w.finalExam}</TableCell>
                    <TableCell className="text-center">{w.project}</TableCell>
                    <TableCell className="text-center">{w.literacy}</TableCell>
                    <TableCell className="text-center font-bold text-foreground">{w.total}</TableCell>
                    <TableCell className="text-center">{getGradeBadge(grade)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
};
