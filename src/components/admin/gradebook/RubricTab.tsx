import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, Loader2, CalendarCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface StudentInfo {
  student_id: string;
  student_name: string;
  avatar_url: string | null;
  section_label: string;
}

interface RubricTabProps {
  subjectId: string;
  students: StudentInfo[];
  schoolId: string;
}

// The 7 weighted components and their DB-enforced maxima. The sum of maxima is 100,
// so a valid row can never exceed 100 — mirrored here for live client-side validation.
const COMPONENTS = [
  { key: 'exam_score', label: 'Exam', max: 20 },
  { key: 'quiz_score', label: 'Quizzes', max: 20 },
  { key: 'attendance_score', label: 'Attendance', max: 20 },
  { key: 'literacy_score', label: 'Literacy', max: 10 },
  { key: 'project_score', label: 'Project', max: 10 },
  { key: 'cw_score', label: 'Classwork', max: 10 },
  { key: 'hw_score', label: 'Homework', max: 10 },
] as const;

type ComponentKey = typeof COMPONENTS[number]['key'];
type Row = Record<ComponentKey, string>;

const emptyRow = (): Row => ({
  exam_score: '', quiz_score: '', attendance_score: '',
  literacy_score: '', project_score: '', cw_score: '', hw_score: '',
});

const rowTotal = (row: Row): number =>
  COMPONENTS.reduce((sum, c) => sum + (parseFloat(row[c.key]) || 0), 0);

export const RubricTab = ({ subjectId, students, schoolId }: RubricTabProps) => {
  const { user } = useAuth();
  const now = new Date();
  const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const [term, setTerm] = useState('Semester 1');
  const [academicYear, setAcademicYear] = useState(`${startYear}-${startYear + 1}`);
  const [grades, setGrades] = useState<Record<string, Row>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeriving, setIsDeriving] = useState(false);

  const load = useCallback(async () => {
    if (!students.length) return;
    const { data } = await supabase
      .from('rubric_grades')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('term', term)
      .eq('academic_year', academicYear)
      .in('student_id', students.map(s => s.student_id));

    const map: Record<string, Row> = {};
    for (const s of students) map[s.student_id] = emptyRow();
    for (const g of data || []) {
      map[g.student_id] = {
        exam_score: g.exam_score?.toString() ?? '',
        quiz_score: g.quiz_score?.toString() ?? '',
        attendance_score: g.attendance_score?.toString() ?? '',
        literacy_score: g.literacy_score?.toString() ?? '',
        project_score: g.project_score?.toString() ?? '',
        cw_score: g.cw_score?.toString() ?? '',
        hw_score: g.hw_score?.toString() ?? '',
      };
    }
    setGrades(map);
  }, [subjectId, term, academicYear, students]);

  useEffect(() => { load(); }, [load]);

  // Per-cell validation: clamp to [0, max] so a teacher can't enter above a component's max.
  const setCell = (studentId: string, key: ComponentKey, max: number, raw: string) => {
    let value = raw;
    if (raw !== '') {
      const n = parseFloat(raw);
      if (!Number.isNaN(n)) value = String(Math.max(0, Math.min(max, n)));
    }
    setGrades(prev => ({ ...prev, [studentId]: { ...(prev[studentId] || emptyRow()), [key]: value } }));
  };

  // Derive attendance /20 from session attendance: only UNEXCUSED absences lower it.
  // attendance_score = round((present + excused_absences) / total_sessions * 20).
  const deriveAttendance = async () => {
    setIsDeriving(true);
    try {
      const [{ data: records }, { data: reasons }] = await Promise.all([
        supabase.from('student_attendance')
          .select('student_id, is_present, reason_id, attendance_date')
          .eq('subject_id', subjectId)
          .in('student_id', students.map(s => s.student_id)),
        supabase.from('attendance_reasons').select('id, excused').eq('school_id', schoolId),
      ]);
      const excusedIds = new Set((reasons || []).filter(r => r.excused).map(r => r.id));
      const tally: Record<string, { credited: number; total: number }> = {};
      for (const r of records || []) {
        const t = tally[r.student_id] || (tally[r.student_id] = { credited: 0, total: 0 });
        t.total += 1;
        if (r.is_present || (r.reason_id && excusedIds.has(r.reason_id))) t.credited += 1;
      }
      setGrades(prev => {
        const next = { ...prev };
        for (const s of students) {
          const t = tally[s.student_id];
          const score = t && t.total > 0 ? Math.round((t.credited / t.total) * 20) : 0;
          next[s.student_id] = { ...(next[s.student_id] || emptyRow()), attendance_score: String(score) };
        }
        return next;
      });
      toast({ title: 'Attendance filled', description: 'Attendance /20 derived from session records. Adjust any row if needed.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to derive attendance', variant: 'destructive' });
    } finally {
      setIsDeriving(false);
    }
  };

  const save = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const upserts = students
        .map(s => ({ s, row: grades[s.student_id] }))
        .filter(({ row }) => row && COMPONENTS.some(c => row[c.key] !== ''))
        .map(({ s, row }) => ({
          school_id: schoolId,
          student_id: s.student_id,
          subject_id: subjectId,
          term,
          academic_year: academicYear,
          exam_score: parseFloat(row.exam_score) || 0,
          quiz_score: parseFloat(row.quiz_score) || 0,
          attendance_score: parseFloat(row.attendance_score) || 0,
          literacy_score: parseFloat(row.literacy_score) || 0,
          project_score: parseFloat(row.project_score) || 0,
          cw_score: parseFloat(row.cw_score) || 0,
          hw_score: parseFloat(row.hw_score) || 0,
          created_by: user.id,
          updated_at: new Date().toISOString(),
        }));
      if (!upserts.length) { toast({ title: 'Nothing to save' }); setIsSaving(false); return; }
      const { error } = await supabase
        .from('rubric_grades')
        .upsert(upserts, { onConflict: 'student_id,subject_id,term,academic_year' });
      if (error) throw error;
      toast({ title: 'Saved', description: `Rubric grades saved for ${term} ${academicYear}` });
      load();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to save rubric grades', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const sections: Record<string, StudentInfo[]> = {};
  for (const s of students) (sections[s.section_label] ||= []).push(s);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Input value={term} onChange={e => setTerm(e.target.value)} className="w-40" placeholder="Term" />
        <Input value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-36" placeholder="Academic year" />
        <Button variant="outline" onClick={deriveAttendance} disabled={isDeriving}>
          {isDeriving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarCheck className="h-4 w-4 mr-2" />}
          Auto-fill Attendance /20
        </Button>
        <Button onClick={save} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Rubric
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Exam /20 · Quizzes /20 · Attendance /20 · Literacy /10 · Project /10 · Classwork /10 · Homework /10 = <strong>Total /100</strong>.
        Marks are capped per component; the total can never exceed 100. Attendance is teacher-overridable after auto-fill.
      </p>

      {Object.entries(sections).sort(([a], [b]) => a.localeCompare(b)).map(([section, sectionStudents]) => (
        <Card key={section} className="bg-card border-border">
          <CardContent className="p-0">
            <div className="p-3 border-b border-border bg-muted/30 font-semibold text-foreground">{section}</div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">Student</TableHead>
                    {COMPONENTS.map(c => (
                      <TableHead key={c.key} className="text-center w-24">{c.label} /{c.max}</TableHead>
                    ))}
                    <TableHead className="text-center w-20">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionStudents.map(s => {
                    const row = grades[s.student_id] || emptyRow();
                    const total = rowTotal(row);
                    return (
                      <TableRow key={s.student_id}>
                        <TableCell className="font-medium text-foreground">{s.student_name}</TableCell>
                        {COMPONENTS.map(c => (
                          <TableCell key={c.key} className="text-center">
                            <Input
                              type="number" min={0} max={c.max} placeholder="—"
                              className="w-16 mx-auto text-center h-8"
                              value={row[c.key]}
                              onChange={e => setCell(s.student_id, c.key, c.max, e.target.value)}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-bold">{Math.round(total * 10) / 10}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
