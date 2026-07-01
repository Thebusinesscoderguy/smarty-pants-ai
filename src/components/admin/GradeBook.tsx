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
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveSemester } from '@/hooks/useActiveSemester';
import { AttendanceTab } from './gradebook/AttendanceTab';
import { RubricTab } from './gradebook/RubricTab';
import { SemesterMarksTab } from './gradebook/SemesterMarksTab';
import { SemesterSummaryTab } from './gradebook/SemesterSummaryTab';
import { StudentAvatar } from '@/components/admin/StudentAvatar';
import { useStudentPhotos } from '@/hooks/useStudentPhotos';
import type { SchoolSubject } from './gradebook/types';

interface StudentInfo {
  student_id: string;
  student_name: string;
  student_photo_path: string | null;
  section_label: string;
}

export const GradeBook = () => {
  const [subjects, setSubjects] = useState<SchoolSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolId, setSchoolId] = useState('');
  const [activeTab, setActiveTab] = useState('daily');
  const { user, isSchoolAdmin, isTeacher, teacherInfo } = useAuth();
  const { t } = useLanguage();
  const { activeSemester } = useActiveSemester(schoolId);

  // Staff-only signed URLs for private student photos, resolved once and shared
  // across every roster tab below.
  const photoUrls = useStudentPhotos(students);

  // Teacher filtering state
  const [teacherSections, setTeacherSections] = useState<string[]>([]);

  // Daily marks state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingGrades, setEditingGrades] = useState<Record<string, { classwork: string; homework: string; literacy: string }>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchSubjects(); }, [user]);
  useEffect(() => { if (selectedSubject) fetchStudentsAndGrades(); }, [selectedSubject, selectedDate]);

  const getSchoolId = async () => {
    if (!user) throw new Error('No user');
    // If teacher, use their school_id from teacherInfo
    if (isTeacher && !isSchoolAdmin && teacherInfo) {
      return teacherInfo.school_id;
    }
    const { data } = await supabase.from('school_accounts').select('id').eq('admin_user_id', user.id).single();
    if (!data) throw new Error('No school found');
    return data.id;
  };

  const fetchSubjects = async () => {
    try {
      const sid = await getSchoolId();
      setSchoolId(sid);

      let subjectData: SchoolSubject[] = [];

      if (isTeacher && !isSchoolAdmin && teacherInfo) {
        // Teacher: only fetch assigned subjects and sections
        const { data: assignments } = await supabase
          .from('teacher_subject_sections')
          .select('subject_id, section_id')
          .eq('teacher_id', teacherInfo.teacher_id);

        if (assignments?.length) {
          const subjectIds = [...new Set(assignments.map(a => a.subject_id))];
          const sectionIds = [...new Set(assignments.map(a => a.section_id))];
          setTeacherSections(sectionIds);

          const { data } = await supabase
            .from('school_subjects')
            .select('id, name')
            .in('id', subjectIds)
            .order('name');
          subjectData = data || [];
        }
      } else {
        // Admin: fetch all subjects
        const { data } = await supabase.from('school_subjects').select('id, name').eq('school_id', sid).order('name');
        subjectData = data || [];
      }

      setSubjects(subjectData);
      if (subjectData.length) setSelectedSubject(subjectData[0].id);
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
      let studentIds = relationships.map(r => r.student_id);

      // If teacher, filter students to only those in assigned sections
      if (isTeacher && !isSchoolAdmin && teacherSections.length > 0) {
        const assignedStudentIds = new Set(
          (secStudRes.data || [])
            .filter(ss => teacherSections.includes(ss.section_id))
            .map(ss => ss.student_id)
        );
        studentIds = studentIds.filter(id => assignedStudentIds.has(id));
        if (!studentIds.length) { setStudents([]); setIsLoading(false); return; }
      }

      const [profRes, dailyRes] = await Promise.all([
        supabase.from('profiles').select('id, display_name, student_photo_path').in('id', studentIds),
        supabase.from('student_daily_grades').select('*').eq('subject_id', selectedSubject).eq('grade_date', selectedDate).in('student_id', studentIds),
      ]);

      const studentSectionMap: Record<string, string> = {};
      const sectionMap: Record<string, { grade_level: string; section_name: string }> = {};
      for (const sec of secRes.data || []) sectionMap[sec.id] = { grade_level: sec.grade_level, section_name: sec.section_name };
      for (const ss of secStudRes.data || []) {
        const sec = sectionMap[ss.section_id];
        if (sec) studentSectionMap[ss.student_id] = `${t('gradebook.gradePrefix')} ${sec.grade_level} ${sec.section_name}`;
      }

      const dailyMap: Record<string, { classwork_mark: number | null; homework_mark: number | null; literacy_mark: number | null }> = {};
      for (const dg of dailyRes.data || []) dailyMap[dg.student_id] = { classwork_mark: dg.classwork_mark, homework_mark: dg.homework_mark, literacy_mark: dg.literacy_mark };

      const studentList: StudentInfo[] = (profRes.data || []).map(p => ({
        student_id: p.id,
        student_name: p.display_name || 'Unknown',
        student_photo_path: (p as any).student_photo_path ?? null,
        section_label: studentSectionMap[p.id] || t('gradebook.unassigned'),
      }));

      studentList.sort((a, b) => a.section_label.localeCompare(b.section_label) || a.student_name.localeCompare(b.student_name));
      setStudents(studentList);

      const editing: Record<string, { classwork: string; homework: string; literacy: string }> = {};
      for (const s of studentList) {
        const d = dailyMap[s.student_id];
        editing[s.student_id] = { classwork: d?.classwork_mark?.toString() ?? '', homework: d?.homework_mark?.toString() ?? '', literacy: d?.literacy_mark?.toString() ?? '' };
      }
      setEditingGrades(editing);
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const saveDailyGrades = async () => {
    if (!user || !selectedSubject) return;
    setIsSaving(true);
    try {
      const upserts = Object.entries(editingGrades)
        .filter(([_, v]) => v.classwork !== '' || v.homework !== '' || v.literacy !== '')
        .map(([studentId, v]) => ({
          school_id: schoolId, student_id: studentId, subject_id: selectedSubject, grade_date: selectedDate,
          semester: activeSemester,
          classwork_mark: v.classwork !== '' ? parseFloat(v.classwork) : null,
          homework_mark: v.homework !== '' ? parseFloat(v.homework) : null,
          literacy_mark: v.literacy !== '' ? parseFloat(v.literacy) : null,
          created_by: user.id,
        }));
      if (!upserts.length) { toast({ title: t('gradebook.nothingToSave') }); setIsSaving(false); return; }
      const { error } = await supabase.from('student_daily_grades').upsert(upserts, { onConflict: 'student_id,subject_id,grade_date' });
      if (error) throw error;
      toast({ title: t('gradebook.saved'), description: `${t('gradebook.savedDescPrefix')} ${selectedDate}` });
      fetchStudentsAndGrades();
    } catch (e) {
      console.error(e);
      toast({ title: t('gradebook.error'), description: t('gradebook.failedSave'), variant: 'destructive' });
    } finally { setIsSaving(false); }
  };

  if (isLoading && !subjects.length) return <div className="animate-pulse text-muted-foreground">{t('gradebook.loading')}</div>;

  if (subjects.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">{t('gradebook.title')}</h2>
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">{t('gradebook.noSubjectsTitle')}</p>
            <p className="text-sm mt-1">{t('gradebook.noSubjectsHintPre')}<strong>{t('gradebook.subjectsTab')}</strong>{t('gradebook.noSubjectsHintPost')}</p>
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
        <h2 className="text-2xl font-bold text-foreground">{t('gradebook.title')}</h2>
        <p className="text-muted-foreground text-sm">{t('gradebook.weightedPre')}<strong>{t('gradebook.total100')}</strong></p>
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
                <TabsTrigger value="daily"><ClipboardList className="h-4 w-4 mr-1" />{t('gradebook.tabDaily')}</TabsTrigger>
                <TabsTrigger value="attendance"><CalendarCheck className="h-4 w-4 mr-1" />{t('gradebook.tabAttendance')}</TabsTrigger>
                <TabsTrigger value="rubric"><ClipboardList className="h-4 w-4 mr-1" />{t('gradebook.tabRubric')}</TabsTrigger>
                <TabsTrigger value="semester"><FileText className="h-4 w-4 mr-1" />{t('gradebook.tabSemester')}</TabsTrigger>
                <TabsTrigger value="summary"><BarChart3 className="h-4 w-4 mr-1" />{t('gradebook.tabSummary')}</TabsTrigger>
              </TabsList>

              {/* Daily Marks */}
              <TabsContent value="daily" className="mt-4 space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-auto" />
                  <Button onClick={saveDailyGrades} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}{t('gradebook.saveMarks')}
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">{t('gradebook.dailyHint')}</div>

                {isLoading ? (
                  <div className="animate-pulse text-muted-foreground py-8 text-center">{t('gradebook.loadingShort')}</div>
                ) : Object.keys(sectionGroups).length === 0 ? (
                  <Card className="bg-card border-border"><CardContent className="p-8 text-center text-muted-foreground">{t('gradebook.noStudents')}</CardContent></Card>
                ) : (
                  Object.entries(sectionGroups).sort(([a], [b]) => a.localeCompare(b)).map(([sectionLabel, sectionStudents]) => (
                    <DailySectionTable key={sectionLabel} sectionLabel={sectionLabel} students={sectionStudents} editingGrades={editingGrades} setEditingGrades={setEditingGrades} photoUrls={photoUrls} />
                  ))
                )}
              </TabsContent>

              {/* Attendance */}
              <TabsContent value="attendance" className="mt-4">
                <AttendanceTab subjectId={selectedSubject} students={students} schoolId={schoolId} photoUrls={photoUrls} />
              </TabsContent>

              {/* Rubric */}
              <TabsContent value="rubric" className="mt-4">
                <RubricTab subjectId={selectedSubject} students={students} schoolId={schoolId} />
              </TabsContent>

              {/* Semester Marks */}
              <TabsContent value="semester" className="mt-4">
                <SemesterMarksTab subjectId={selectedSubject} students={students} schoolId={schoolId} photoUrls={photoUrls} />
              </TabsContent>

              {/* Summary */}
              <TabsContent value="summary" className="mt-4">
                <SemesterSummaryTab subjectId={selectedSubject} subjectName={sub.name} students={students} schoolId={schoolId} photoUrls={photoUrls} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

// Daily section accordion
const DailySectionTable = ({ sectionLabel, students, editingGrades, setEditingGrades, photoUrls }: {
  sectionLabel: string;
  students: StudentInfo[];
  editingGrades: Record<string, { classwork: string; homework: string; literacy: string }>;
  setEditingGrades: React.Dispatch<React.SetStateAction<Record<string, { classwork: string; homework: string; literacy: string }>>>;
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
        <CardContent className="p-0 border-t border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('gradebook.student')}</TableHead>
                <TableHead className="text-center w-28">{t('gradebook.classwork')}</TableHead>
                <TableHead className="text-center w-28">{t('gradebook.homework')}</TableHead>
                <TableHead className="text-center w-28">{t('gradebook.literacy')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map(s => (
                <TableRow key={s.student_id}>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <StudentAvatar name={s.student_name} photoUrl={photoUrls[s.student_id]} />
                      {s.student_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Input type="number" min="0" max="10" step="0.5" placeholder="—" className="w-20 mx-auto text-center h-8"
                      value={editingGrades[s.student_id]?.classwork ?? ''}
                      onChange={e => setEditingGrades(prev => ({ ...prev, [s.student_id]: { ...prev[s.student_id], classwork: e.target.value } }))}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Input type="number" min="0" max="10" step="0.5" placeholder="—" className="w-20 mx-auto text-center h-8"
                      value={editingGrades[s.student_id]?.homework ?? ''}
                      onChange={e => setEditingGrades(prev => ({ ...prev, [s.student_id]: { ...prev[s.student_id], homework: e.target.value } }))}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Input type="number" min="0" max="10" step="0.5" placeholder="—" className="w-20 mx-auto text-center h-8"
                      value={editingGrades[s.student_id]?.literacy ?? ''}
                      onChange={e => setEditingGrades(prev => ({ ...prev, [s.student_id]: { ...prev[s.student_id], literacy: e.target.value } }))}
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
