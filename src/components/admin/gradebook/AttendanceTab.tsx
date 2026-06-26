import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Loader2, CheckCircle, XCircle, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { DataPortabilityDialog } from '@/components/admin/data-portability/DataPortabilityDialog';

interface AttendanceReason {
  id: string;
  label: string;
  excused: boolean;
}

interface StudentInfo {
  student_id: string;
  student_name: string;
  avatar_url: string | null;
  section_label: string;
}

interface AttendanceTabProps {
  subjectId: string;
  students: StudentInfo[];
  schoolId: string;
}

export const AttendanceTab = ({ subjectId, students, schoolId }: AttendanceTabProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({}); // studentId -> reason_id
  const [reasonOptions, setReasonOptions] = useState<AttendanceReason[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [ioOpen, setIoOpen] = useState(false);

  useEffect(() => {
    supabase
      .from('attendance_reasons')
      .select('id, label, excused')
      .eq('school_id', schoolId)
      .order('label')
      .then(({ data }) => setReasonOptions((data as AttendanceReason[]) || []));
  }, [schoolId]);

  const loadAttendance = async () => {
    const { data } = await supabase
      .from('student_attendance')
      .select('student_id, is_present, reason_id')
      .eq('subject_id', subjectId)
      .eq('attendance_date', selectedDate)
      .in('student_id', students.map(s => s.student_id));

    const map: Record<string, boolean> = {};
    const reasonMap: Record<string, string> = {};
    for (const s of students) map[s.student_id] = true; // default present
    for (const d of data || []) {
      map[d.student_id] = d.is_present;
      if (d.reason_id) reasonMap[d.student_id] = d.reason_id;
    }
    setAttendance(map);
    setReasons(reasonMap);
    setIsLoaded(true);
  };

  const saveAttendance = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const upserts = Object.entries(attendance).map(([studentId, isPresent]) => ({
        school_id: schoolId,
        student_id: studentId,
        subject_id: subjectId,
        attendance_date: selectedDate,
        is_present: isPresent,
        reason_id: isPresent ? null : (reasons[studentId] || null),
        created_by: user.id,
      }));

      const { error } = await supabase
        .from('student_attendance')
        .upsert(upserts, { onConflict: 'student_id,subject_id,attendance_date' });

      if (error) throw error;
      toast({ title: t('gradebook.saved'), description: `${t('gbAttendance.savedDescPrefix')} ${selectedDate}` });
    } catch (e) {
      console.error(e);
      toast({ title: t('gradebook.error'), description: t('gbAttendance.failedSave'), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Group by section
  const sections: Record<string, StudentInfo[]> = {};
  for (const s of students) {
    if (!sections[s.section_label]) sections[s.section_label] = [];
    sections[s.section_label].push(s);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setIsLoaded(false); }} className="w-auto" />
        <Button variant="outline" onClick={loadAttendance}>{t('gbAttendance.load')}</Button>
        <Button onClick={saveAttendance} disabled={isSaving || !isLoaded}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {t('gbAttendance.save')}
        </Button>
        <Button variant="outline" onClick={() => setIoOpen(true)}>
          <FileSpreadsheet className="h-4 w-4 mr-2" /> {t('gradebook.importExport')}
        </Button>
        {isLoaded && (
          <span className="text-sm text-muted-foreground">
            {t('gbAttendance.present')}: {Object.values(attendance).filter(Boolean).length} / {Object.keys(attendance).length}
          </span>
        )}
      </div>
      <DataPortabilityDialog open={ioOpen} onOpenChange={setIoOpen} defaultEntityKey="attendance" />

      {!isLoaded ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            {t('gbAttendance.selectDateHint')}
          </CardContent>
        </Card>
      ) : (
        Object.entries(sections).sort(([a], [b]) => a.localeCompare(b)).map(([section, sectionStudents]) => (
          <Card key={section} className="bg-card border-border">
            <CardContent className="p-0">
              <div className="p-3 border-b border-border bg-muted/30 font-semibold text-foreground">{section}</div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('gradebook.student')}</TableHead>
                    <TableHead className="text-center w-32">{t('gbAttendance.present')}</TableHead>
                    <TableHead className="text-center w-32">{t('gbAttendance.status')}</TableHead>
                    <TableHead className="w-48">{t('gbAttendance.absenceReason')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionStudents.map(s => (
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
                      <TableCell className="text-center">
                        <Checkbox
                          checked={attendance[s.student_id] ?? true}
                          onCheckedChange={(checked) => setAttendance(prev => ({ ...prev, [s.student_id]: !!checked }))}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        {attendance[s.student_id] ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive mx-auto" />
                        )}
                      </TableCell>
                      <TableCell>
                        {!attendance[s.student_id] && (
                          <Select
                            value={reasons[s.student_id] || ''}
                            onValueChange={(v) => setReasons(prev => ({ ...prev, [s.student_id]: v }))}
                          >
                            <SelectTrigger className="h-8"><SelectValue placeholder={t('gbAttendance.noReason')} /></SelectTrigger>
                            <SelectContent>
                              {reasonOptions.map(r => (
                                <SelectItem key={r.id} value={r.id}>
                                  {r.label}{r.excused ? t('gbAttendance.excusedSuffix') : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
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
