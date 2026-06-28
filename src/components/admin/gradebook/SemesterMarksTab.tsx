import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Loader2, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataPortabilityDialog } from '@/components/admin/data-portability/DataPortabilityDialog';
import { StudentAvatar } from '@/components/admin/StudentAvatar';

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
  const [semester, setSemester] = useState('S1');
  const [marks, setMarks] = useState<Record<string, { project: string; literacy: string; finalExam: string }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ioOpen, setIoOpen] = useState(false);

  useEffect(() => {
    loadMarks();
  }, [subjectId, semester]);

  const loadMarks = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('student_semester_marks')
      .select('student_id, project_mark, literacy_mark, final_exam_mark')
      .eq('subject_id', subjectId)
      .eq('semester', semester)
      .in('student_id', students.map(s => s.student_id));

    const map: Record<string, { project: string; literacy: string; finalExam: string }> = {};
    for (const s of students) map[s.student_id] = { project: '', literacy: '', finalExam: '' };
    for (const d of data || []) {
      map[d.student_id] = {
        project: d.project_mark?.toString() ?? '',
        literacy: d.literacy_mark?.toString() ?? '',
        finalExam: d.final_exam_mark?.toString() ?? '',
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
        .filter(([_, v]) => v.project !== '' || v.literacy !== '' || v.finalExam !== '')
        .map(([studentId, v]) => ({
          school_id: schoolId,
          student_id: studentId,
          subject_id: subjectId,
          semester,
          project_mark: v.project !== '' ? parseFloat(v.project) : null,
          literacy_mark: v.literacy !== '' ? parseFloat(v.literacy) : null,
          final_exam_mark: v.finalExam !== '' ? parseFloat(v.finalExam) : null,
          created_by: user.id,
        }));

      if (!upserts.length) { toast({ title: t('gradebook.nothingToSave') }); setIsSaving(false); return; }

      const { error } = await supabase
        .from('student_semester_marks')
        .upsert(upserts, { onConflict: 'student_id,subject_id,semester' });

      if (error) throw error;
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
                    <TableHead className="text-center w-28">{t('gbSemester.literacyCol')}</TableHead>
                    <TableHead className="text-center w-28">{t('gbSemester.finalExamCol')}</TableHead>
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
                        <Input type="number" min="0" max="10" step="0.5" placeholder="—" className="w-20 mx-auto text-center h-8"
                          value={marks[s.student_id]?.literacy ?? ''}
                          onChange={e => setMarks(prev => ({ ...prev, [s.student_id]: { ...prev[s.student_id], literacy: e.target.value } }))}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Input type="number" min="0" max="20" step="0.5" placeholder="—" className="w-20 mx-auto text-center h-8"
                          value={marks[s.student_id]?.finalExam ?? ''}
                          onChange={e => setMarks(prev => ({ ...prev, [s.student_id]: { ...prev[s.student_id], finalExam: e.target.value } }))}
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
