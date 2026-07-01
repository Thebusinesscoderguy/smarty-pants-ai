import { useState, useEffect, useCallback, Fragment } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, Loader2, CalendarCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveSemester } from '@/hooks/useActiveSemester';

const COMP_LABEL_KEY: Record<string, string> = {
  exam_score: 'rubric.exam', quiz1_score: 'rubric.quiz1', quiz2_score: 'rubric.quiz2', attendance_score: 'rubric.attendance',
  literacy_score: 'rubric.literacy', project_score: 'rubric.project', cw_score: 'rubric.classwork', hw_score: 'rubric.homework',
};

interface StudentInfo {
  student_id: string;
  student_name: string;
  student_photo_path: string | null;
  section_label: string;
}

interface RubricTabProps {
  subjectId: string;
  students: StudentInfo[];
  schoolId: string;
}

// The marks a teacher enters and their DB-enforced maxima. Quiz 1 and Quiz 2 are two
// separate /20 marks that combine (averaged) into the single Quizzes component (/20);
// see quizCombined below. The resulting 7 weighted components sum to 100.
const COMPONENTS = [
  { key: 'exam_score', label: 'Final Exam', max: 20 },
  { key: 'quiz1_score', label: 'Quiz 1', max: 20 },
  { key: 'quiz2_score', label: 'Quiz 2', max: 20 },
  { key: 'attendance_score', label: 'Attendance', max: 20 },
  { key: 'literacy_score', label: 'Literacy', max: 10 },
  { key: 'project_score', label: 'Projects', max: 10 },
  { key: 'cw_score', label: 'Classwork', max: 10 },
  { key: 'hw_score', label: 'Homework', max: 10 },
] as const;

type ComponentKey = typeof COMPONENTS[number]['key'];
type Row = Record<ComponentKey, string>;

const emptyRow = (): Row => ({
  exam_score: '', quiz1_score: '', quiz2_score: '', attendance_score: '',
  literacy_score: '', project_score: '', cw_score: '', hw_score: '',
});

// Quizzes component (/20) = average of the two entered quiz marks.
const quizCombined = (row: Row): number =>
  ((parseFloat(row.quiz1_score) || 0) + (parseFloat(row.quiz2_score) || 0)) / 2;

// Weighted total of the 7 components: Quiz 1/Quiz 2 count once, as their average.
const rowTotal = (row: Row): number =>
  COMPONENTS.reduce(
    (sum, c) => (c.key === 'quiz1_score' || c.key === 'quiz2_score' ? sum : sum + (parseFloat(row[c.key]) || 0)),
    0,
  ) + quizCombined(row);

export const RubricTab = ({ subjectId, students, schoolId }: RubricTabProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { activeSemester } = useActiveSemester(schoolId);
  const now = new Date();
  const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const [term, setTerm] = useState('Semester 1');
  const [academicYear, setAcademicYear] = useState(`${startYear}-${startYear + 1}`);
  const [termInit, setTermInit] = useState(false);

  // Default the term to the school's open semester so quizzes flow to it; still editable.
  useEffect(() => {
    if (!termInit && activeSemester) {
      setTerm(activeSemester === 'S1' ? 'Semester 1' : 'Semester 2');
      setTermInit(true);
    }
  }, [activeSemester, termInit]);
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
        quiz1_score: g.quiz1_score?.toString() ?? '',
        quiz2_score: g.quiz2_score?.toString() ?? '',
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
      toast({ title: t('rubric.attendanceFilled'), description: t('rubric.attendanceFilledDesc') });
    } catch (e) {
      console.error(e);
      toast({ title: t('rubric.error'), description: t('rubric.failedDerive'), variant: 'destructive' });
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
          quiz1_score: parseFloat(row.quiz1_score) || 0,
          quiz2_score: parseFloat(row.quiz2_score) || 0,
          quiz_score: quizCombined(row),
          attendance_score: parseFloat(row.attendance_score) || 0,
          literacy_score: parseFloat(row.literacy_score) || 0,
          project_score: parseFloat(row.project_score) || 0,
          cw_score: parseFloat(row.cw_score) || 0,
          hw_score: parseFloat(row.hw_score) || 0,
          created_by: user.id,
          updated_at: new Date().toISOString(),
        }));
      if (!upserts.length) { toast({ title: t('rubric.nothingToSave') }); setIsSaving(false); return; }
      const { error } = await supabase
        .from('rubric_grades')
        .upsert(upserts, { onConflict: 'student_id,subject_id,term,academic_year' });
      if (error) throw error;
      toast({ title: t('rubric.saved'), description: `${t('rubric.savedDescPrefix')} ${term} ${academicYear}` });
      load();
    } catch (e) {
      console.error(e);
      toast({ title: t('rubric.error'), description: t('rubric.failedSave'), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const sections: Record<string, StudentInfo[]> = {};
  for (const s of students) (sections[s.section_label] ||= []).push(s);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Input value={term} onChange={e => setTerm(e.target.value)} className="w-40" placeholder={t('rubric.term')} />
        <Input value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-36" placeholder={t('rubric.academicYear')} />
        <Button variant="outline" onClick={deriveAttendance} disabled={isDeriving}>
          {isDeriving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarCheck className="h-4 w-4 mr-2" />}
          {t('rubric.autofillAttendance')}
        </Button>
        <Button onClick={save} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {t('rubric.save')}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {t('rubric.legendComponents')}<strong>{t('rubric.total100')}</strong>. {t('rubric.legendCapped')}
      </p>

      {Object.entries(sections).sort(([a], [b]) => a.localeCompare(b)).map(([section, sectionStudents]) => (
        <Card key={section} className="bg-card border-border">
          <CardContent className="p-0">
            <div className="p-3 border-b border-border bg-muted/30 font-semibold text-foreground">{section}</div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">{t('rubric.student')}</TableHead>
                    {COMPONENTS.map(c => (
                      <Fragment key={c.key}>
                        <TableHead className="text-center w-24">{t(COMP_LABEL_KEY[c.key])} /{c.max}</TableHead>
                        {c.key === 'quiz2_score' && (
                          <TableHead className="text-center w-24">{t('rubric.quizzes')} /20</TableHead>
                        )}
                      </Fragment>
                    ))}
                    <TableHead className="text-center w-20">{t('rubric.total')}</TableHead>
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
                          <Fragment key={c.key}>
                            <TableCell className="text-center">
                              <Input
                                type="number" min={0} max={c.max}
                                className="w-16 mx-auto text-center h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={row[c.key]}
                                onChange={e => setCell(s.student_id, c.key, c.max, e.target.value)}
                              />
                            </TableCell>
                            {c.key === 'quiz2_score' && (
                              <TableCell className="text-center font-medium text-muted-foreground">
                                {Math.round(quizCombined(row) * 10) / 10}
                              </TableCell>
                            )}
                          </Fragment>
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
