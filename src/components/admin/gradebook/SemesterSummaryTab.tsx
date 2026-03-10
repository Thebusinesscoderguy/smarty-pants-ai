import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Loader2, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { StudentGradeData, SemesterMarks, calculateWeightedTotal, getLetterGrade } from './types';

interface StudentInfo {
  student_id: string;
  student_name: string;
  avatar_url: string | null;
  section_label: string;
}

interface SemesterSummaryTabProps {
  subjectId: string;
  subjectName: string;
  students: StudentInfo[];
  schoolId: string;
}

export const SemesterSummaryTab = ({ subjectId, subjectName, students, schoolId }: SemesterSummaryTabProps) => {
  const { user } = useAuth();
  const [semester, setSemester] = useState('S1');
  const [gradeData, setGradeData] = useState<StudentGradeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (students.length > 0) loadSummary();
  }, [subjectId, semester, students]);

  const loadSummary = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const studentIds = students.map(s => s.student_id);

      const [dailyRes, attendRes, semRes, quizRes, testRes] = await Promise.all([
        supabase.from('student_daily_grades').select('student_id, classwork_mark, homework_mark').eq('subject_id', subjectId).in('student_id', studentIds),
        supabase.from('student_attendance').select('student_id, is_present').eq('subject_id', subjectId).in('student_id', studentIds),
        supabase.from('student_semester_marks').select('student_id, project_mark, literacy_mark, final_exam_mark').eq('subject_id', subjectId).eq('semester', semester).in('student_id', studentIds),
        supabase.from('quiz_attempts').select('user_id, score, total_possible').in('user_id', studentIds),
        supabase.from('test_attempts').select('student_id, percentage').in('student_id', studentIds),
      ]);

      // Aggregate daily grades
      const dailyAgg: Record<string, { cwTotal: number; cwCount: number; hwTotal: number; hwCount: number }> = {};
      for (const d of dailyRes.data || []) {
        if (!dailyAgg[d.student_id]) dailyAgg[d.student_id] = { cwTotal: 0, cwCount: 0, hwTotal: 0, hwCount: 0 };
        if (d.classwork_mark != null) { dailyAgg[d.student_id].cwTotal += d.classwork_mark; dailyAgg[d.student_id].cwCount++; }
        if (d.homework_mark != null) { dailyAgg[d.student_id].hwTotal += d.homework_mark; dailyAgg[d.student_id].hwCount++; }
      }

      // Aggregate attendance
      const attendAgg: Record<string, { present: number; total: number }> = {};
      for (const a of attendRes.data || []) {
        if (!attendAgg[a.student_id]) attendAgg[a.student_id] = { present: 0, total: 0 };
        attendAgg[a.student_id].total++;
        if (a.is_present) attendAgg[a.student_id].present++;
      }

      // Semester marks
      const semMap: Record<string, SemesterMarks> = {};
      for (const s of semRes.data || []) {
        semMap[s.student_id] = { project_mark: s.project_mark, literacy_mark: s.literacy_mark, final_exam_mark: s.final_exam_mark };
      }

      // Normal exams
      const examAgg: Record<string, { total: number; count: number }> = {};
      for (const q of quizRes.data || []) {
        if (!examAgg[q.user_id]) examAgg[q.user_id] = { total: 0, count: 0 };
        if (q.total_possible > 0) { examAgg[q.user_id].total += (q.score / q.total_possible) * 100; examAgg[q.user_id].count++; }
      }
      for (const t of testRes.data || []) {
        if (!examAgg[t.student_id]) examAgg[t.student_id] = { total: 0, count: 0 };
        if (t.percentage) { examAgg[t.student_id].total += t.percentage; examAgg[t.student_id].count++; }
      }

      const result: StudentGradeData[] = students.map(s => {
        const d = dailyAgg[s.student_id] || { cwTotal: 0, cwCount: 0, hwTotal: 0, hwCount: 0 };
        const a = attendAgg[s.student_id] || { present: 0, total: 0 };
        const e = examAgg[s.student_id] || { total: 0, count: 0 };
        return {
          ...s,
          classwork_avg: d.cwCount > 0 ? d.cwTotal / d.cwCount : 0,
          homework_avg: d.hwCount > 0 ? d.hwTotal / d.hwCount : 0,
          classwork_count: d.cwCount,
          homework_count: d.hwCount,
          days_present: a.present,
          total_days: a.total,
          normal_exam_avg: e.count > 0 ? e.total / e.count : 0,
          normal_exam_count: e.count,
          semester_marks: semMap[s.student_id] || { project_mark: null, literacy_mark: null, final_exam_mark: null },
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
    const headers = ['Section', 'Student', 'Classwork /10', 'Homework /10', 'Attendance /20', 'Normal Exams /20', 'Final Exam /20', 'Project /10', 'Literacy /10', 'Total /100', 'Grade'];
    const rows = gradeData.map(s => {
      const w = calculateWeightedTotal(s);
      return [s.section_label, s.student_name, w.classwork, w.homework, w.attendance, w.normalExams, w.finalExam, w.project, w.literacy, w.total, getLetterGrade(w.total)];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `gradebook-${subjectName}-${semester}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'Grade book exported to CSV' });
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
      D: 'bg-orange-100 text-orange-800 border-orange-200',
      F: '',
    };
    if (grade === 'F') return <Badge variant="destructive">F</Badge>;
    return <Badge className={colors[grade]}>{grade}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={semester} onValueChange={setSemester}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="S1">Semester 1</SelectItem>
            <SelectItem value="S2">Semester 2</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCSV} disabled={gradeData.length === 0}>
          <Download className="h-4 w-4 mr-2" />Export CSV
        </Button>
      </div>

      <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-2">
        <span>📝 Classwork: /10</span>
        <span>📚 Homework: /10</span>
        <span>✅ Attendance: /20</span>
        <span>📊 Normal Exams: /20</span>
        <span>🎓 Final Exam: /20</span>
        <span>🔬 Project: /10</span>
        <span>📖 Literacy: /10</span>
        <span className="font-bold">🏆 Total: /100</span>
      </div>

      {isLoading ? (
        <div className="animate-pulse text-muted-foreground py-8 text-center">Loading summary...</div>
      ) : Object.keys(sections).length === 0 ? (
        <Card className="bg-card border-border"><CardContent className="p-8 text-center text-muted-foreground">No students enrolled.</CardContent></Card>
      ) : (
        Object.entries(sections).sort(([a], [b]) => a.localeCompare(b)).map(([sectionLabel, sectionStudents]) => (
          <SectionSummaryTable key={sectionLabel} sectionLabel={sectionLabel} students={sectionStudents} getGradeBadge={getGradeBadge} />
        ))
      )}
    </div>
  );
};

const SectionSummaryTable = ({ sectionLabel, students, getGradeBadge }: {
  sectionLabel: string;
  students: StudentGradeData[];
  getGradeBadge: (g: string) => React.ReactNode;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="bg-card border-border overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left">
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
          <Users className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">{sectionLabel}</span>
          <Badge variant="secondary">{students.length} students</Badge>
        </div>
      </button>
      {expanded && (
        <CardContent className="p-0 border-t border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="text-center">CW /10</TableHead>
                <TableHead className="text-center">HW /10</TableHead>
                <TableHead className="text-center">Attend /20</TableHead>
                <TableHead className="text-center">Exams /20</TableHead>
                <TableHead className="text-center">Final /20</TableHead>
                <TableHead className="text-center">Proj /10</TableHead>
                <TableHead className="text-center">Lit /10</TableHead>
                <TableHead className="text-center font-bold">Total</TableHead>
                <TableHead className="text-center">Grade</TableHead>
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
                        {s.avatar_url ? (
                          <img src={s.avatar_url} alt={s.student_name} className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                            {s.student_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {s.student_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{w.classwork}</TableCell>
                    <TableCell className="text-center">{w.homework}</TableCell>
                    <TableCell className="text-center">{w.attendance}</TableCell>
                    <TableCell className="text-center">{w.normalExams}</TableCell>
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
