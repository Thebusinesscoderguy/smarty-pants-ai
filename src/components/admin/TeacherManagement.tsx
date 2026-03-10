import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, UserCog, Mail, BookOpen, FolderTree, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Teacher {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  created_at: string;
  assignments: TeacherAssignment[];
}

interface TeacherAssignment {
  id: string;
  subject_id: string;
  section_id: string;
  subject_name?: string;
  section_label?: string;
}

interface SchoolSubject {
  id: string;
  name: string;
}

interface SchoolSection {
  id: string;
  grade_level: string;
  section_name: string;
}

export const TeacherManagement = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<SchoolSubject[]>([]);
  const [sections, setSections] = useState<SchoolSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolId, setSchoolId] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [newTeacher, setNewTeacher] = useState({ email: '', first_name: '', last_name: '' });
  const [selectedAssignments, setSelectedAssignments] = useState<{ subject_id: string; section_id: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => { fetchAll(); }, [user]);

  const getSchoolId = async () => {
    if (!user) throw new Error('No user');
    const { data } = await supabase.from('school_accounts').select('id').eq('admin_user_id', user.id).single();
    if (!data) throw new Error('No school found');
    return data.id;
  };

  const fetchAll = async () => {
    try {
      const sid = await getSchoolId();
      setSchoolId(sid);
      const [teacherRes, subjectRes, sectionRes] = await Promise.all([
        supabase.from('school_teachers').select('*').eq('school_id', sid).order('created_at', { ascending: false }),
        supabase.from('school_subjects').select('id, name').eq('school_id', sid).order('name'),
        supabase.from('school_sections').select('id, grade_level, section_name').eq('school_id', sid).order('grade_level'),
      ]);

      const teacherList = teacherRes.data || [];
      const teacherIds = teacherList.map(t => t.id);

      let assignments: any[] = [];
      if (teacherIds.length > 0) {
        const { data } = await supabase.from('teacher_subject_sections').select('*').in('teacher_id', teacherIds);
        assignments = data || [];
      }

      const subjectMap: Record<string, string> = {};
      for (const s of subjectRes.data || []) subjectMap[s.id] = s.name;
      const sectionMap: Record<string, string> = {};
      for (const s of sectionRes.data || []) sectionMap[s.id] = `Grade ${s.grade_level} ${s.section_name}`;

      const teachersWithAssignments: Teacher[] = teacherList.map(t => ({
        ...t,
        assignments: assignments
          .filter(a => a.teacher_id === t.id)
          .map(a => ({
            ...a,
            subject_name: subjectMap[a.subject_id] || 'Unknown',
            section_label: sectionMap[a.section_id] || 'Unknown',
          })),
      }));

      setTeachers(teachersWithAssignments);
      setSubjects(subjectRes.data || []);
      setSections(sectionRes.data || []);
    } catch (e: any) {
      if (e.message !== 'No school found') console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const addTeacher = async () => {
    if (!newTeacher.email.trim()) {
      toast({ title: 'Email is required', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('school_teachers').insert({
        school_id: schoolId,
        email: newTeacher.email.trim().toLowerCase(),
        first_name: newTeacher.first_name.trim() || null,
        last_name: newTeacher.last_name.trim() || null,
      });
      if (error) throw error;
      toast({ title: 'Teacher added', description: `${newTeacher.email} has been added.` });
      setNewTeacher({ email: '', first_name: '', last_name: '' });
      setIsAddOpen(false);
      fetchAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message?.includes('unique') ? 'This email is already added.' : e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const removeTeacher = async (id: string) => {
    const { error } = await supabase.from('school_teachers').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to remove teacher', variant: 'destructive' });
    } else {
      toast({ title: 'Teacher removed' });
      fetchAll();
    }
  };

  const openAssignDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setSelectedAssignments(teacher.assignments.map(a => ({ subject_id: a.subject_id, section_id: a.section_id })));
    setIsAssignOpen(true);
  };

  const toggleAssignment = (subject_id: string, section_id: string) => {
    setSelectedAssignments(prev => {
      const exists = prev.some(a => a.subject_id === subject_id && a.section_id === section_id);
      if (exists) return prev.filter(a => !(a.subject_id === subject_id && a.section_id === section_id));
      return [...prev, { subject_id, section_id }];
    });
  };

  const isAssigned = (subject_id: string, section_id: string) =>
    selectedAssignments.some(a => a.subject_id === subject_id && a.section_id === section_id);

  const saveAssignments = async () => {
    if (!selectedTeacher) return;
    setIsSaving(true);
    try {
      // Delete existing assignments
      await supabase.from('teacher_subject_sections').delete().eq('teacher_id', selectedTeacher.id);
      // Insert new ones
      if (selectedAssignments.length > 0) {
        const { error } = await supabase.from('teacher_subject_sections').insert(
          selectedAssignments.map(a => ({
            teacher_id: selectedTeacher.id,
            subject_id: a.subject_id,
            section_id: a.section_id,
          }))
        );
        if (error) throw error;
      }
      toast({ title: 'Assignments saved', description: `${selectedAssignments.length} subject-section pairs assigned.` });
      setIsAssignOpen(false);
      fetchAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="animate-pulse text-muted-foreground">Loading teachers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Teacher Management</h2>
          <p className="text-sm text-muted-foreground">Add teachers and assign them to subjects &amp; sections. They get access to the Grade Book and Assessments for their assignments.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Teacher</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Teacher</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email *</Label>
                <Input type="email" placeholder="teacher@example.com" value={newTeacher.email} onChange={e => setNewTeacher(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>First Name</Label>
                  <Input placeholder="John" value={newTeacher.first_name} onChange={e => setNewTeacher(p => ({ ...p, first_name: e.target.value }))} />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input placeholder="Doe" value={newTeacher.last_name} onChange={e => setNewTeacher(p => ({ ...p, last_name: e.target.value }))} />
                </div>
              </div>
              <Button onClick={addTeacher} disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Add Teacher
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {teachers.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Mail className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No teachers added yet</p>
            <p className="text-sm mt-1">Add teachers by their email address to give them access to Grade Book &amp; Assessments.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Assignments</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map(teacher => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium text-foreground">
                    {[teacher.first_name, teacher.last_name].filter(Boolean).join(' ') || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{teacher.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {teacher.assignments.length === 0 ? (
                        <span className="text-sm text-muted-foreground">None</span>
                      ) : (
                        teacher.assignments.map(a => (
                          <Badge key={a.id} variant="secondary" className="text-xs">
                            {a.subject_name} · {a.section_label}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openAssignDialog(teacher)}>
                        <UserCog className="h-4 w-4 mr-1" />Assign
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => removeTeacher(teacher.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Assignment Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Assign Subjects &amp; Sections — {selectedTeacher?.first_name || selectedTeacher?.email}
            </DialogTitle>
          </DialogHeader>
          {subjects.length === 0 || sections.length === 0 ? (
            <p className="text-muted-foreground text-sm">Please create subjects and sections first.</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select which subject + section combinations this teacher manages.
              </p>
              {subjects.map(sub => (
                <div key={sub.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">{sub.name}</span>
                  </div>
                  <div className="ml-6 space-y-1">
                    {sections.map(sec => {
                      const label = `Grade ${sec.grade_level} ${sec.section_name}`;
                      return (
                        <label key={sec.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 py-1">
                          <Checkbox
                            checked={isAssigned(sub.id, sec.id)}
                            onCheckedChange={() => toggleAssignment(sub.id, sec.id)}
                          />
                          <FolderTree className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-foreground">{label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              <Button onClick={saveAssignments} disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Assignments ({selectedAssignments.length})
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
