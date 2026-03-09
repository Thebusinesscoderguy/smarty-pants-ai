import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, BookOpen, Trophy, TrendingUp, ChevronDown, ChevronRight, Users, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface SchoolSubject {
  id: string;
  name: string;
}

interface DailyGrade {
  id?: string;
  grade_date: string;
  classwork_mark: number | null;
  homework_mark: number | null;
}

interface StudentSubjectGrade {
  student_id: string;
  student_name: string;
  avatar_url: string | null;
  section_label: string;
  daily_grades: DailyGrade[];
  assessment_avg: number;
  assessment_count: number;
  classwork_avg: number;
  homework_avg: number;
}

export const GradeBook = () => {
  const [subjects, setSubjects] = useState<SchoolSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [students, setStudents] = useState<StudentSubjectGrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingGrades, setEditingGrades] = useState<Record<string, { classwork: string; homework: string }>>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { user } = useAuth();

  useEffect(() => {
    fetchSubjects();
  }, [user]);

  useEffect(() => {
    if (selectedSubject) fetchGrades();
  }, [selectedSubject, selectedDate]);

  const getSchoolId = async () => {
    if (!user) throw new Error('No user');
    const { data } = await supabase
      .from('school_accounts')
      .select('id')
      .eq('admin_user_id', user.id)
      .single();
    if (!data) throw new Error('No school found');
    return data.id;
  };

  const fetchSubjects = async () => {
    try {
      const schoolId = await getSchoolId();
      const { data } = await supabase
        .from('school_subjects')
        .select('id, name')
        .eq('school_id', schoolId)
        .order('name');
      setSubjects(data || []);
      if (data?.length) setSelectedSubject(data[0].id);
    } catch (error: any) {
      if (error.message !== 'No school found') console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGrades = async () => {
    if (!user || !selectedSubject) return;
    try {
      setIsLoading(true);
      const schoolId = await getSchoolId();

      const [relRes, secRes, secStudRes] = await Promise.all([
        supabase.from('school_student_relationships').select('student_id').eq('school_id', schoolId).eq('is_active', true),
        supabase.from('school_sections').select('id, grade_level, section_name').eq('school_id', schoolId),
        supabase.from('section_students').select('section_id, student_id'),
      ]);

      const relationships = relRes.data;
      if (!relationships?.length) { setStudents([]); return; }

      const studentIds = relationships.map(r => r.student_id);

      const [profRes, dailyRes, quizRes, testRes] = await Promise.all([
        supabase.from('profiles').select('id, display_name, avatar_url').in('id', studentIds),
        supabase.from('student_daily_grades').select('*').eq('subject_id', selectedSubject).eq('grade_date', selectedDate).in('student_id', studentIds),
        supabase.from('quiz_attempts').select('user_id, score, total_possible').in('user_id', studentIds),
        supabase.from('test_attempts').select('student_id, percentage').in('student_id', studentIds),
      ]);

      // Build section lookup
      const studentSectionMap: Record<string, string> = {};
      const sectionMap: Record<string, { grade_level: string; section_name: string }> = {};
      for (const sec of secRes.data || []) sectionMap[sec.id] = { grade_level: sec.grade_level, section_name: sec.section_name };
      for (const ss of secStudRes.data || []) {
        const sec = sectionMap[ss.section_id];
        if (sec) studentSectionMap[ss.student_id] = `Grade ${sec.grade_level} ${sec.section_name}`;
      }

      // Build daily grades map
      const dailyMap: Record<string, DailyGrade> = {};
      for (const dg of dailyRes.data || []) {
        dailyMap[dg.student_id] = {
          id: dg.id,
          grade_date: dg.grade_date,
          classwork_mark: dg.classwork_mark,
          homework_mark: dg.homework_mark,
        };
      }

      // Build assessment averages
      const assessmentMap: Record<string, { total: number; count: number }> = {};
      for (const q of quizRes.data || []) {
        if (!assessmentMap[q.user_id]) assessmentMap[q.user_id] = { total: 0, count: 0 };
        if (q.total_possible > 0) {
          assessmentMap[q.user_id].total += (q.score / q.total_possible) * 100;
          assessmentMap[q.user_id].count++;
        }
      }
      for (const t of testRes.data || []) {
        if (!assessmentMap[t.student_id]) assessmentMap[t.student_id] = { total: 0, count: 0 };
        if (t.percentage) {
          assessmentMap[t.student_id].total += t.percentage;
          assessmentMap[t.student_id].count++;
        }
      }

      const studentGrades: StudentSubjectGrade[] = (profRes.data || []).map(p => {
        const daily = dailyMap[p.id];
        const assess = assessmentMap[p.id] || { total: 0, count: 0 };
        return {
          student_id: p.id,
          student_name: p.display_name || 'Unknown',
          avatar_url: p.avatar_url,
          section_label: studentSectionMap[p.id] || 'Unassigned',
          daily_grades: daily ? [daily] : [],
          assessment_avg: assess.count > 0 ? Math.round(assess.total / assess.count) : 0,
          assessment_count: assess.count,
          classwork_avg: daily?.classwork_mark ?? 0,
          homework_avg: daily?.homework_mark ?? 0,
        };
      });

      // Sort by section then name
      studentGrades.sort((a, b) => a.section_label.localeCompare(b.section_label) || a.student_name.localeCompare(b.student_name));
      setStudents(studentGrades);

      // Pre-fill editing state
      const editing: Record<string, { classwork: string; homework: string }> = {};
      for (const sg of studentGrades) {
        const daily = sg.daily_grades[0];
        editing[sg.student_id] = {
          classwork: daily?.classwork_mark?.toString() ?? '',
          homework: daily?.homework_mark?.toString() ?? '',
        };
      }
      setEditingGrades(editing);
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGrades = async () => {
    if (!user || !selectedSubject) return;
    try {
      setIsSaving(true);
      const schoolId = await getSchoolId();

      const upserts = Object.entries(editingGrades)
        .filter(([_, v]) => v.classwork !== '' || v.homework !== '')
        .map(([studentId, vals]) => ({
          school_id: schoolId,
          student_id: studentId,
          subject_id: selectedSubject,
          grade_date: selectedDate,
          classwork_mark: vals.classwork !== '' ? parseFloat(vals.classwork) : null,
          homework_mark: vals.homework !== '' ? parseFloat(vals.homework) : null,
          created_by: user.id,
        }));

      if (upserts.length === 0) {
        toast({ title: 'Nothing to save', description: 'Enter some marks first.' });
        return;
      }

      const { error } = await supabase
        .from('student_daily_grades')
        .upsert(upserts, { onConflict: 'student_id,subject_id,grade_date' });

      if (error) throw error;
      toast({ title: 'Saved', description: `Grades saved for ${selectedDate}` });
      fetchGrades();
    } catch (error) {
      console.error('Error saving grades:', error);
      toast({ title: 'Error', description: 'Failed to save grades', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const getGradeBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800 border-green-200">A</Badge>;
    if (score >= 80) return <Badge className="bg-blue-100 text-blue-800 border-blue-200">B</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">C</Badge>;
    if (score >= 60) return <Badge className="bg-orange-100 text-orange-800 border-orange-200">D</Badge>;
    return <Badge variant="destructive">F</Badge>;
  };

  const exportToCSV = () => {
    const subjectName = subjects.find(s => s.id === selectedSubject)?.name || 'Subject';
    const headers = ['Section', 'Student', 'Classwork', 'Homework', 'Assessment Avg', 'Grade'];
    const rows = students.map(s => {
      const overall = s.assessment_count > 0 ? s.assessment_avg : 0;
      return [
        s.section_label, s.student_name,
        editingGrades[s.student_id]?.classwork || '—',
        editingGrades[s.student_id]?.homework || '—',
        s.assessment_count > 0 ? `${s.assessment_avg}%` : '—',
        overall >= 90 ? 'A' : overall >= 80 ? 'B' : overall >= 70 ? 'C' : overall >= 60 ? 'D' : 'F',
      ];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gradebook-${subjectName}-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'Grade book exported to CSV' });
  };

  if (isLoading && !subjects.length) {
    return <div className="animate-pulse text-muted-foreground">Loading grade book...</div>;
  }

  if (subjects.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Grade Book</h2>
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No subjects created yet</p>
            <p className="text-sm mt-1">Go to the <strong>Subjects</strong> tab to create subjects first. They will appear here as tabs.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group students by section for display
  const sectionGroups: Record<string, StudentSubjectGrade[]> = {};
  for (const s of students) {
    if (!sectionGroups[s.section_label]) sectionGroups[s.section_label] = [];
    sectionGroups[s.section_label].push(s);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Grade Book</h2>
          <p className="text-muted-foreground">Daily classwork & homework marks by subject. Assessments are auto-populated.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Button onClick={saveGrades} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Marks
          </Button>
          <Button variant="outline" onClick={exportToCSV} disabled={students.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Subject Tabs */}
      <Tabs value={selectedSubject} onValueChange={setSelectedSubject}>
        <TabsList className="flex w-full overflow-x-auto bg-muted">
          {subjects.map(sub => (
            <TabsTrigger key={sub.id} value={sub.id} className="whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="h-4 w-4 mr-2" />
              {sub.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {subjects.map(sub => (
          <TabsContent key={sub.id} value={sub.id} className="mt-4 space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Students</p>
                    <p className="text-2xl font-bold text-foreground">{students.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Assessment Avg</p>
                    <p className="text-2xl font-bold text-foreground">
                      {students.filter(s => s.assessment_count > 0).length > 0
                        ? Math.round(students.filter(s => s.assessment_count > 0).reduce((a, s) => a + s.assessment_avg, 0) / students.filter(s => s.assessment_count > 0).length) + '%'
                        : '—'}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100"><Trophy className="h-5 w-5 text-green-600" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Honor Roll (≥90%)</p>
                    <p className="text-2xl font-bold text-foreground">{students.filter(s => s.assessment_avg >= 90 && s.assessment_count > 0).length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10"><TrendingUp className="h-5 w-5 text-destructive" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Needs Support</p>
                    <p className="text-2xl font-bold text-foreground">{students.filter(s => s.assessment_avg < 60 && s.assessment_count > 0).length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Grades Table grouped by section */}
            {isLoading ? (
              <div className="animate-pulse text-muted-foreground py-8 text-center">Loading grades...</div>
            ) : Object.keys(sectionGroups).length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No students enrolled yet.
                </CardContent>
              </Card>
            ) : (
              Object.entries(sectionGroups).sort(([a], [b]) => a.localeCompare(b)).map(([sectionLabel, sectionStudents]) => (
                <SectionGradeTable
                  key={sectionLabel}
                  sectionLabel={sectionLabel}
                  students={sectionStudents}
                  editingGrades={editingGrades}
                  setEditingGrades={setEditingGrades}
                  getGradeBadge={getGradeBadge}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

// Sub-component for section accordion
const SectionGradeTable = ({
  sectionLabel,
  students,
  editingGrades,
  setEditingGrades,
  getGradeBadge,
}: {
  sectionLabel: string;
  students: StudentSubjectGrade[];
  editingGrades: Record<string, { classwork: string; homework: string }>;
  setEditingGrades: React.Dispatch<React.SetStateAction<Record<string, { classwork: string; homework: string }>>>;
  getGradeBadge: (score: number) => React.ReactNode;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="bg-card border-border overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
          <Users className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">{sectionLabel}</span>
          <Badge variant="secondary">{students.length} students</Badge>
        </div>
      </button>
      {isExpanded && (
        <CardContent className="p-0 border-t border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="text-center w-28">Classwork</TableHead>
                <TableHead className="text-center w-28">Homework</TableHead>
                <TableHead className="text-center">Assessment Avg</TableHead>
                <TableHead className="text-center">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map(student => (
                <TableRow key={student.student_id}>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      {student.avatar_url ? (
                        <img src={student.avatar_url} alt={student.student_name} className="h-7 w-7 rounded-full object-cover" />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                          {student.student_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {student.student_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="—"
                      className="w-20 mx-auto text-center h-8"
                      value={editingGrades[student.student_id]?.classwork ?? ''}
                      onChange={(e) => setEditingGrades(prev => ({
                        ...prev,
                        [student.student_id]: { ...prev[student.student_id], classwork: e.target.value },
                      }))}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="—"
                      className="w-20 mx-auto text-center h-8"
                      value={editingGrades[student.student_id]?.homework ?? ''}
                      onChange={(e) => setEditingGrades(prev => ({
                        ...prev,
                        [student.student_id]: { ...prev[student.student_id], homework: e.target.value },
                      }))}
                    />
                  </TableCell>
                  <TableCell className="text-center font-semibold text-foreground">
                    {student.assessment_count > 0 ? `${student.assessment_avg}%` : '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    {student.assessment_count > 0 ? getGradeBadge(student.assessment_avg) : <Badge variant="secondary">N/A</Badge>}
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
