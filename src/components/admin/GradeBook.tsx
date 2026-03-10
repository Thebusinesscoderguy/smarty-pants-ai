import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Save, Loader2, Users, ChevronDown, ChevronRight, CalendarCheck, FileText, BarChart3, ClipboardList } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AttendanceTab } from './gradebook/AttendanceTab';
import { SemesterMarksTab } from './gradebook/SemesterMarksTab';
import { SemesterSummaryTab } from './gradebook/SemesterSummaryTab';
import type { SchoolSubject } from './gradebook/types';

interface StudentInfo {
  student_id: string;
  student_name: string;
  avatar_url: string | null;
  section_label: string;
}

export const GradeBook = () => {
  const [subjects, setSubjects] = useState<SchoolSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolId, setSchoolId] = useState('');
  const [activeTab, setActiveTab] = useState('daily');
  const { user } = useAuth();

  // Daily marks state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingGrades, setEditingGrades] = useState<Record<string, { classwork: string; homework: string }>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchSubjects(); }, [user]);
  useEffect(() => { if (selectedSubject) fetchStudentsAndGrades(); }, [selectedSubject, selectedDate]);

  const getSchoolId = async () => {
    if (!user) throw new Error('No user');
    const { data } = await supabase.from('school_accounts').select('id').eq('admin_user_id', user.id).single();
    if (!data) throw new Error('No school found');
    return data.id;
  };

  const fetchSubjects = async () => {
    try {
      const sid = await getSchoolId();
      setSchoolId(sid);
      const { data } = await supabase.from('school_subjects').select('id, name').eq('school_id', sid).order('name');
      setSubjects(data || []);
      if (data?.length) setSelectedSubject(data[0].id);
    } catch (e: any) {
      if (e.message !== 'No school found') console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentsAndGrades = async () => {
    if (!user || !selectedSubject) return;
    try {
      setIsLoading(true);
      const sid = schoolId || await getSchoolId();

      const [relRes, secRes, secStudRes] = await Promise.all([
        supabase.from('school_student_relationships').select('student_id').eq('school_id', sid).eq('is_active', true),
        supabase.from('school_sections').select('id, grade_level, section_name').eq('school_id', sid),
        supabase.from('section_students').select('section_id, student_id'),
      ]);

      const relationships = relRes.data;
      if (!relationships?.length) { setStudents([]); setIsLoading(false); return; }
      const studentIds = relationships.map(r => r.student_id);

      const [profRes, dailyRes] = await Promise.all([
        supabase.from('profiles').select('id, display_name, avatar_url').in('id', studentIds),
        supabase.from('student_daily_grades').select('*').eq('subject_id', selectedSubject).eq('grade_date', selectedDate).in('student_id', studentIds),
      ]);

      const studentSectionMap: Record<string, string> = {};
      const sectionMap: Record<string, { grade_level: string; section_name: string }> = {};
      for (const sec of secRes.data || []) sectionMap[sec.id] = { grade_level: sec.grade_level, section_name: sec.section_name };
      for (const ss of secStudRes.data || []) {
        const sec = sectionMap[ss.section_id];
        if (sec) studentSectionMap[ss.student_id] = `Grade ${sec.grade_level} ${sec.section_name}`;
      }

      const dailyMap: Record<string, { classwork_mark: number | null; homework_mark: number | null }> = {};
      for (const dg of dailyRes.data || []) dailyMap[dg.student_id] = { classwork_mark: dg.classwork_mark, homework_mark: dg.homework_mark };

      const studentList: StudentInfo[] = (profRes.data || []).map(p => ({
        student_id: p.id,
        student_name: p.display_name || 'Unknown',
        avatar_url: p.avatar_url,
        section_label: studentSectionMap[p.id] || 'Unassigned',
      }));

      studentList.sort((a, b) => a.section_label.localeCompare(b.section_label) || a.student_name.localeCompare(b.student_name));
      setStudents(studentList);

      const editing: Record<string, { classwork: string; homework: string }> = {};
      for (const s of studentList) {
        const d = dailyMap[s.student_id];
        editing[s.student_id] = { classwork: d?.classwork_mark?.toString() ?? '', homework: d?.homework_mark?.toString() ?? '' };
      }
      setEditingGrades(editing);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const saveDailyGrades = async () => {
    if (!user || !selectedSubject) return;
    setIsSaving(true);
    try {
      const upserts = Object.entries(editingGrades)
        .filter(([_, v]) => v.classwork !== '' || v.homework !== '')
        .map(([studentId, v]) => ({
          school_id: schoolId, student_id: studentId, subject_id: selectedSubject, grade_date: selectedDate,
          classwork_mark: v.classwork !== '' ? parseFloat(v.classwork) : null,
          homework_mark: v.homework !== '' ? parseFloat(v.homework) : null,
          created_by: user.id,
        }));
      if (!upserts.length) { toast({ title: 'Nothing to save' }); setIsSaving(false); return; }
      const { error } = await supabase.from('student_daily_grades').upsert(upserts, { onConflict: 'student_id,subject_id,grade_date' });
      if (error) throw error;
      toast({ title: 'Saved', description: `Daily grades saved for ${selectedDate}` });
      fetchStudentsAndGrades();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to save grades', variant: 'destructive' });
    } finally { setIsSaving(false); }
  };

  if (isLoading && !subjects.length) return <div className="animate-pulse text-muted-foreground">Loading grade book...</div>;

  if (subjects.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Grade Book</h2>
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No subjects created yet</p>
            <p className="text-sm mt-1">Go to the <strong>Subjects</strong> tab to create subjects first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sectionGroups: Record<string, StudentInfo[]> = {};
  for (const s of students) {
    if (!sectionGroups[s.section_label]) sectionGroups[s.section_label] = [];
    sectionGroups[s.section_label].push(s);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Grade Book</h2>
        <p className="text-muted-foreground text-sm">Weighted: Classwork /10 • Homework /10 • Attendance /20 • Normal Exams /20 • Final Exam /20 • Project /10 • Literacy /10 = <strong>Total /100</strong></p>
      </div>

      {/* Subject Tabs */}
      <Tabs value={selectedSubject} onValueChange={setSelectedSubject}>
        <TabsList className="flex w-full overflow-x-auto bg-muted">
          {subjects.map(sub => (
            <TabsTrigger key={sub.id} value={sub.id} className="whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="h-4 w-4 mr-2" />{sub.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {subjects.map(sub => (
          <TabsContent key={sub.id} value={sub.id} className="mt-4">
            {/* Inner tabs for each mode */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted/50">
                <TabsTrigger value="daily"><ClipboardList className="h-4 w-4 mr-1" />Daily Marks</TabsTrigger>
                <TabsTrigger value="attendance"><CalendarCheck className="h-4 w-4 mr-1" />Attendance</TabsTrigger>
                <TabsTrigger value="semester"><FileText className="h-4 w-4 mr-1" />Semester Marks</TabsTrigger>
                <TabsTrigger value="summary"><BarChart3 className="h-4 w-4 mr-1" />Summary</TabsTrigger>
              </TabsList>

              {/* Daily Marks */}
              <TabsContent value="daily" className="mt-4 space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-auto" />
                  <Button onClick={saveDailyGrades} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}Save Marks
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">Enter classwork and homework marks (0–100) for each student.</div>

                {isLoading ? (
                  <div className="animate-pulse text-muted-foreground py-8 text-center">Loading...</div>
                ) : Object.keys(sectionGroups).length === 0 ? (
                  <Card className="bg-card border-border"><CardContent className="p-8 text-center text-muted-foreground">No students enrolled.</CardContent></Card>
                ) : (
                  Object.entries(sectionGroups).sort(([a], [b]) => a.localeCompare(b)).map(([sectionLabel, sectionStudents]) => (
                    <DailySectionTable key={sectionLabel} sectionLabel={sectionLabel} students={sectionStudents} editingGrades={editingGrades} setEditingGrades={setEditingGrades} />
                  ))
                )}
              </TabsContent>

              {/* Attendance */}
              <TabsContent value="attendance" className="mt-4">
                <AttendanceTab subjectId={selectedSubject} students={students} schoolId={schoolId} />
              </TabsContent>

              {/* Semester Marks */}
              <TabsContent value="semester" className="mt-4">
                <SemesterMarksTab subjectId={selectedSubject} students={students} schoolId={schoolId} />
              </TabsContent>

              {/* Summary */}
              <TabsContent value="summary" className="mt-4">
                <SemesterSummaryTab subjectId={selectedSubject} subjectName={sub.name} students={students} schoolId={schoolId} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

// Daily section accordion
const DailySectionTable = ({ sectionLabel, students, editingGrades, setEditingGrades }: {
  sectionLabel: string;
  students: StudentInfo[];
  editingGrades: Record<string, { classwork: string; homework: string }>;
  setEditingGrades: React.Dispatch<React.SetStateAction<Record<string, { classwork: string; homework: string }>>>;
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
        <CardContent className="p-0 border-t border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="text-center w-28">Classwork</TableHead>
                <TableHead className="text-center w-28">Homework</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map(s => (
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
                    <Input type="number" min="0" max="100" placeholder="—" className="w-20 mx-auto text-center h-8"
                      value={editingGrades[s.student_id]?.classwork ?? ''}
                      onChange={e => setEditingGrades(prev => ({ ...prev, [s.student_id]: { ...prev[s.student_id], classwork: e.target.value } }))}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Input type="number" min="0" max="100" placeholder="—" className="w-20 mx-auto text-center h-8"
                      value={editingGrades[s.student_id]?.homework ?? ''}
                      onChange={e => setEditingGrades(prev => ({ ...prev, [s.student_id]: { ...prev[s.student_id], homework: e.target.value } }))}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
};
