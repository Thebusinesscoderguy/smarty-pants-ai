import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ClipboardCheck, Clock, Users, Trash2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { HomeworkSubmissionsDrawer } from './HomeworkSubmissionsDrawer';

const HW_TYPE_KEY: Record<string, string> = {
  practice: 'hw.typePractice', reading: 'hw.typeReading', quiz: 'hw.typeQuiz',
};

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  assignment_type: string;
  due_date: string | null;
  is_active: boolean;
  created_at: string;
  subject_id: string | null;
  section_id: string | null;
  school_id: string;
}

export const HomeworkManagement = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submissions, setSubmissions] = useState<Record<string, any[]>>({});
  const [sectionCounts, setSectionCounts] = useState<Record<string, number>>({});
  const [drawerAssignment, setDrawerAssignment] = useState<Assignment | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignmentType, setAssignmentType] = useState('practice');
  const [subjectId, setSubjectId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    fetchSchoolData();
  }, [user]);

  const fetchSchoolData = async () => {
    if (!user) return;

    // Get school ID
    const { data: school } = await supabase
      .from('school_accounts')
      .select('id')
      .eq('admin_user_id', user.id)
      .maybeSingle();

    let sid = school?.id;
    if (!sid) {
      const { data: teacher } = await supabase
        .from('school_teachers')
        .select('school_id')
        .eq('email', user.email?.toLowerCase() || '')
        .eq('is_active', true)
        .maybeSingle();
      sid = teacher?.school_id;
    }
    if (!sid) return;
    setSchoolId(sid);

    // Fetch subjects, sections, assignments in parallel
    const [subjectsRes, sectionsRes, assignmentsRes] = await Promise.all([
      supabase.from('school_subjects').select('*').eq('school_id', sid),
      supabase.from('school_sections').select('*').eq('school_id', sid),
      supabase.from('homework_assignments').select('*').eq('school_id', sid).order('created_at', { ascending: false }),
    ]);

    if (subjectsRes.data) setSubjects(subjectsRes.data);
    if (sectionsRes.data) setSections(sectionsRes.data);
    if (assignmentsRes.data) {
      setAssignments(assignmentsRes.data);
      const counts: Record<string, number> = {};
      for (const a of assignmentsRes.data) {
        const [subsRes, ssRes] = await Promise.all([
          supabase.from('homework_submissions').select('*').eq('assignment_id', a.id),
          a.section_id ? supabase.from('section_students').select('student_id', { count: 'exact', head: true }).eq('section_id', a.section_id) : Promise.resolve({ count: 0 } as any),
        ]);
        if (subsRes.data) setSubmissions(prev => ({ ...prev, [a.id]: subsRes.data }));
        counts[a.id] = (ssRes as any).count || 0;
      }
      setSectionCounts(counts);
    }
  };

  const handleCreate = async () => {
    if (!user || !schoolId || !title.trim()) {
      toast({ title: t('hw.error'), description: t('hw.titleRequired'), variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.from('homework_assignments').insert({
        school_id: schoolId,
        teacher_id: user.id,
        title,
        description: description || null,
        assignment_type: assignmentType,
        subject_id: subjectId || null,
        section_id: sectionId || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });
      if (error) throw error;
      toast({ title: t('hw.created'), description: t('hw.createdDesc') });
      setIsDialogOpen(false);
      resetForm();
      fetchSchoolData();
    } catch (err: any) {
      toast({ title: t('hw.error'), description: err.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssignmentType('practice');
    setSubjectId('');
    setSectionId('');
    setDueDate('');
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('homework_assignments').update({ is_active: !current }).eq('id', id);
    fetchSchoolData();
  };

  const deleteAssignment = async (id: string) => {
    await supabase.from('homework_assignments').delete().eq('id', id);
    fetchSchoolData();
  };

  const getSubjectName = (id: string | null) => subjects.find(s => s.id === id)?.name || '—';
  const getSectionName = (id: string | null) => {
    const sec = sections.find(s => s.id === id);
    return sec ? `${sec.grade_level} ${sec.section_name}` : '—';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t('hw.title')}</h2>
          <p className="text-muted-foreground">{t('hw.subtitle')}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />{t('hw.newAssignment')}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('hw.createAssignment')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t('hw.titleLabel')}</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={t('hw.titlePlaceholder')} />
              </div>
              <div>
                <Label>{t('hw.description')}</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t('hw.descriptionPlaceholder')} />
              </div>
              <div>
                <Label>{t('hw.type')}</Label>
                <Select value={assignmentType} onValueChange={setAssignmentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="practice">{t('hw.typePractice')}</SelectItem>
                    <SelectItem value="reading">{t('hw.typeReading')}</SelectItem>
                    <SelectItem value="quiz">{t('hw.typeQuiz')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('hw.subject')}</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger><SelectValue placeholder={t('hw.selectSubject')} /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('hw.section')}</Label>
                <Select value={sectionId} onValueChange={setSectionId}>
                  <SelectTrigger><SelectValue placeholder={t('hw.selectSection')} /></SelectTrigger>
                  <SelectContent>
                    {sections.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.grade_level} {s.section_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('hw.dueDate')}</Label>
                <Input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
              <Button onClick={handleCreate} className="w-full">{t('hw.createAssignment')}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>{t('hw.emptyTitle')}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('hw.colTitle')}</TableHead>
                  <TableHead>{t('hw.colType')}</TableHead>
                  <TableHead>{t('hw.colSubject')}</TableHead>
                  <TableHead>{t('hw.colSection')}</TableHead>
                  <TableHead>{t('hw.colDueDate')}</TableHead>
                  <TableHead>{t('hw.colSubmissions')}</TableHead>
                  <TableHead>{t('hw.colStatus')}</TableHead>
                  <TableHead>{t('hw.colActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell><Badge variant="outline">{t(HW_TYPE_KEY[a.assignment_type] || 'hw.typePractice')}</Badge></TableCell>
                    <TableCell>{getSubjectName(a.subject_id)}</TableCell>
                    <TableCell>{getSectionName(a.section_id)}</TableCell>
                    <TableCell>
                      {a.due_date ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {new Date(a.due_date).toLocaleDateString()}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {submissions[a.id]?.filter(s => s.status === 'submitted' || s.status === 'graded' || s.status === 'ai_graded').length || 0}
                        {sectionCounts[a.id] ? ` / ${sectionCounts[a.id]}` : ''}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={a.is_active ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => toggleActive(a.id, a.is_active)}
                      >
                        {a.is_active ? t('hw.active') : t('hw.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setDrawerAssignment(a)} title={t('hw.viewSubmissions')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteAssignment(a.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <HomeworkSubmissionsDrawer
        assignmentId={drawerAssignment?.id || null}
        sectionId={drawerAssignment?.section_id || null}
        title={drawerAssignment?.title || ''}
        open={!!drawerAssignment}
        onOpenChange={(v) => { if (!v) { setDrawerAssignment(null); fetchSchoolData(); } }}
      />
    </div>
  );
};
