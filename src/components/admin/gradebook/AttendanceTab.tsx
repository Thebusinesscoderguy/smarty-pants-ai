import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadAttendance = async () => {
    const { data } = await supabase
      .from('student_attendance')
      .select('student_id, is_present')
      .eq('subject_id', subjectId)
      .eq('attendance_date', selectedDate)
      .in('student_id', students.map(s => s.student_id));

    const map: Record<string, boolean> = {};
    for (const s of students) map[s.student_id] = true; // default present
    for (const d of data || []) map[d.student_id] = d.is_present;
    setAttendance(map);
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
        created_by: user.id,
      }));

      const { error } = await supabase
        .from('student_attendance')
        .upsert(upserts, { onConflict: 'student_id,subject_id,attendance_date' });

      if (error) throw error;
      toast({ title: 'Saved', description: `Attendance saved for ${selectedDate}` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to save attendance', variant: 'destructive' });
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
        <Button variant="outline" onClick={loadAttendance}>Load Attendance</Button>
        <Button onClick={saveAttendance} disabled={isSaving || !isLoaded}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Attendance
        </Button>
        {isLoaded && (
          <span className="text-sm text-muted-foreground">
            Present: {Object.values(attendance).filter(Boolean).length} / {Object.keys(attendance).length}
          </span>
        )}
      </div>

      {!isLoaded ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            Select a date and click "Load Attendance" to begin marking.
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
                    <TableHead>Student</TableHead>
                    <TableHead className="text-center w-32">Present</TableHead>
                    <TableHead className="text-center w-32">Status</TableHead>
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
