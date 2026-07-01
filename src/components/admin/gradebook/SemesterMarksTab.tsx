import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveSemester } from '@/hooks/useActiveSemester';
import { DataPortabilityDialog } from '@/components/admin/data-portability/DataPortabilityDialog';
import { StudentAvatar } from '@/components/admin/StudentAvatar';
import { EFFORT_LEGEND } from '@/lib/gradeScale';
import { academicContext } from './types';

// Sentinel for the Effort dropdown's "no rating" option (Radix Select disallows an
// empty-string value).
const EFFORT_NONE = '__none__';

interface StudentInfo {
  student_id: string;
  student_name: string;
  student_photo_path: string | null;
  section_label: string;
}

interface SemesterMarksTabProps {
  subjectId: string;
  students: StudentInfo[];
  schoolId: string;
  photoUrls: Record<string, string>;
}

export const SemesterMarksTab = ({ subjectId, students, schoolId, photoUrls }: SemesterMarksTabProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { activeSemester } = useActiveSemester(schoolId);
  const [semester, setSemester] = useState('S1');
  const [marks, setMarks] = useState<Record<string, { project: string; finalExam: string; effort: string; comment: string }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ioOpen, setIoOpen] = useState(false);
  const [semesterInit, setSemesterInit] = useState(false);

  // Default entry to the school's open semester once it loads; still switchable.
  useEffect(() => {
    if (!semesterInit && activeSemester) { setSemester(activeSemester); setSemesterInit(true); }
  }, [activeSemester, semesterInit]);

  useEffect(() => {
    loadMarks();
  }, [subjectId, semester]);

  // Effort + per-subject comment live on rubric_grades (the report-card grid row), keyed
  // by term + academic_year rather than S1/S2 — resolve them the same way every grade
  // view does so we read/write the exact same row.
  const { term, academicYear } = academicContext(semester);

  const loadMarks = async () => {
    setIsLoading(true);
    const studentIds = students.map(s => s.student_id);
    const [{ data }, { data: rubric }] = await Promise.all([
      supabase
        .from('student_semester_marks')
        .select('student_id, project_mark, final_exam_mark')
        .eq('subject_id', subjectId)
        .eq('semester', semester)
        .in('student_id', studentIds),
      supabase
        .from('rubric_grades')
        .select('student_id, effort, comment')
        .eq('subject_id', subjectId)
        .eq('term', term)
        .eq('academic_year', academicYear)
        .in('student_id', studentIds),
    ]);

    const map: Record<string, { project: string; finalExam: string; effort: string; comment: string }> = {};
    for (const s of students) map[s.student_id] = { project: '', finalExam: '', effort: '', comment: '' };
    for (const d of data || []) {
      map[d.student_id] = {
        ...map[d.student_id],
        project: d.project_mark?.toString() ?? '',
        finalExam: d.final_exam_mark?.toString() ?? '',
      };
    }
    for (const r of rubric || []) {
      map[r.student_id] = {
        ...map[r.student_id],
        effort: r.effort ?? '',
        comment: r.comment ?? '',
      };
    }
    setMarks(map);
    setIsLoading(false);
  };

  const saveMarks = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const upserts = Object.entries(marks)
        .filter(([_, v]) => v.project !== '' || v.finalExam !== '')
        .map(([studentId, v]) => ({
          school_id: schoolId,
          student_id: studentId,
          subject_id: subjectId,
          semester,
          project_mark: v.project !== '' ? parseFloat(v.project) : null,
          final_exam_mark: v.finalExam !== '' ? parseFloat(v.finalExam) : null,
          created_by: user.id,
        }));

      // Effort + comment go on the rubric_grades row. We upsert ONLY these two columns
      // (plus the row keys), never the score columns — so this write and the Rubric tab's
      // score write update disjoint parts of the same row and never clobber each other.
      // ON CONFLICT DO UPDATE leaves omitted columns untouched; a fresh insert defaults
      // the scores to 0 (harmless — the Rubric tab fills them later).
      const rubricUpserts = Object.entries(marks)
        .filter(([_, v]) => v.effort !== '' || v.comment.trim() !== '')
        .map(([studentId, v]) => ({
          school_id: schoolId,
          student_id: studentId,
          subject_id: subjectId,
          term,
          academic_year: academicYear,
          effort: v.effort !== '' ? v.effort : null,
          comment: v.comment.trim() !== '' ? v.comment.trim() : null,
        }));

      if (!upserts.length && !rubricUpserts.length) { toast({ title: t('gradebook.nothingToSave') }); setIsSaving(false); return; }

      if (upserts.length) {
        const { error } = await supabase
          .from('student_semester_marks')
          .upsert(upserts, { onConflict: 'student_id,subject_id,semester' });
        if (error) throw error;
      }

      if (rubricUpserts.length) {
        const { error: rubricError } = await supabase
          .from('rubric_grades')
          .upsert(rubricUpserts, { onConflict: 'student_id,subject_id,term,academic_year' });
        if (rubricError) throw rubricError;
      }
      toast({ title: t('gradebook.saved'), description: `${t('gbSemester.savedDescPrefix')} ${semester === 'S1' ? t('gradebook.semester1') : t('gradebook.semester2')}` });
    } catch (e) {
      console.error(e);
      toast({ title: t('gradebook.error'), description: t('gbSemester.failedSave'), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const sections: Record<string, typeof students> = {};
  for (const s of students) {
    if (!sections[s.section_label]) sections[s.section_label] = [];
    sections[s.section_label].push(s);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={semester} onValueChange={setSemester}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="S1">{t('gradebook.semester1')}</SelectItem>
            <SelectItem value="S2">{t('gradebook.semester2')}</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={saveMarks} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {t('gradebook.saveMarks')}
        </Button>
        <Button variant="outline" onClick={() => setIoOpen(true)}>
          <FileSpreadsheet className="h-4 w-4 mr-2" /> {t('gradebook.importExport')}
        </Button>
      </div>
      <DataPortabilityDialog open={ioOpen} onOpenChange={setIoOpen} defaultEntityKey="semester_marks" />

      <div className="text-sm text-muted-foreground">
        {t('gbSemester.legend')}
      </div>

      {isLoading ? (
        <div className="animate-pulse text-muted-foreground py-8 text-center">{t('gradebook.loadingShort')}</div>
      ) : (
        Object.entries(sections).sort(([a], [b]) => a.localeCompare(b)).map(([section, sectionStudents]) => (
          <Card key={section} className="bg-card border-border">
            <CardContent className="p-0">
              <div className="p-3 border-b border-border bg-muted/30 font-semibold text-foreground">{section}</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('gradebook.student')}</TableHead>
                    <TableHead className="text-center w-28">{t('gbSemester.projectCol')}</TableHead>
                    <TableHead className="text-center w-28">{t('gbSemester.finalExamCol')}</TableHead>
                    <TableHead className="text-center w-28">{t('gbSemester.effortCol')}</TableHead>
                    <TableHead className="text-center min-w-[220px]">{t('gbSemester.commentCol')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionStudents.map(s => (
                    <TableRow key={s.student_id}>
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <StudentAvatar name={s.student_name} photoUrl={photoUrls[s.student_id]} />
                          {s.student_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Input type="number" min="0" max="10" step="0.5" placeholder="—" className="w-20 mx-auto text-center h-8"
                          value={marks[s.student_id]?.project ?? ''}
                          onChange={e => setMarks(prev => ({ ...prev, [s.student_id]: { ...prev[s.student_id], project: e.target.value } }))}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Input type="number" min="0" max="20" step="0.5" placeholder="—" className="w-20 mx-auto text-center h-8"
                          value={marks[s.student_id]?.finalExam ?? ''}
                          onChange={e => setMarks(prev => ({ ...prev, [s.student_id]: { ...prev[s.student_id], finalExam: e.target.value } }))}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Select
                          value={marks[s.student_id]?.effort ? marks[s.student_id].effort : EFFORT_NONE}
                          onValueChange={v => setMarks(prev => ({ ...prev, [s.student_id]: { ...prev[s.student_id], effort: v === EFFORT_NONE ? '' : v } }))}
                        >
                          <SelectTrigger className="w-24 mx-auto h-8"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={EFFORT_NONE}>—</SelectItem>
                            {EFFORT_LEGEND.map(e => (
                              <SelectItem key={e.code} value={e.code}>{e.code} · {e.description}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Textarea rows={2} placeholder={t('gbSemester.commentPlaceholder')} className="min-h-[2.25rem] text-sm"
                          value={marks[s.student_id]?.comment ?? ''}
                          onChange={e => setMarks(prev => ({ ...prev, [s.student_id]: { ...prev[s.student_id], comment: e.target.value } }))}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
