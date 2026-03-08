import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FolderTree, Plus, X, Users, ChevronRight, GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Section {
  id: string;
  school_id: string;
  grade_level: string;
  section_name: string;
  created_at: string;
  students: { id: string; student_id: string; display_name: string }[];
}

interface SchoolStudent {
  student_id: string;
  display_name: string;
}

const GRADE_LEVELS = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);

export const SectionManagement = () => {
  const { user } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<SchoolStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [newSectionName, setNewSectionName] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [expandedGrade, setExpandedGrade] = useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningSectionId, setAssigningSectionId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: school } = await supabase
        .from('school_accounts')
        .select('id')
        .eq('admin_user_id', user.id)
        .single();

      if (!school) { setLoading(false); return; }
      setSchoolId(school.id);

      // Fetch sections
      const { data: sectionData } = await supabase
        .from('school_sections')
        .select('*')
        .eq('school_id', school.id)
        .order('grade_level', { ascending: true })
        .order('section_name', { ascending: true });

      // Fetch school students
      const { data: rels } = await supabase
        .from('school_student_relationships')
        .select('student_id')
        .eq('school_id', school.id)
        .eq('is_active', true);

      let studentList: SchoolStudent[] = [];
      if (rels && rels.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', rels.map(r => r.student_id));
        studentList = (profiles || []).map(p => ({
          student_id: p.id,
          display_name: p.display_name || 'Unknown'
        }));
      }
      setStudents(studentList);

      // Fetch section-student assignments
      if (sectionData && sectionData.length > 0) {
        const { data: assignments } = await supabase
          .from('section_students')
          .select('id, section_id, student_id')
          .in('section_id', sectionData.map(s => s.id));

        const enriched = sectionData.map(sec => ({
          ...sec,
          students: (assignments || [])
            .filter(a => a.section_id === sec.id)
            .map(a => ({
              id: a.id,
              student_id: a.student_id,
              display_name: studentList.find(s => s.student_id === a.student_id)?.display_name || 'Unknown'
            }))
        }));
        setSections(enriched);
      } else {
        setSections([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createSection = async () => {
    if (!schoolId || !newGrade) return;
    const label = newSectionName.trim() ? newSectionName.trim().toUpperCase() : '';
    const { error } = await supabase.from('school_sections').insert({
      school_id: schoolId,
      grade_level: newGrade,
      section_name: label
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Section Created', description: label ? `${newGrade} - ${label}` : newGrade });
      setNewSectionName('');
      fetchData();
    }
  };

  const deleteSection = async (id: string) => {
    const { error } = await supabase.from('school_sections').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Section Deleted' });
      fetchData();
    }
  };

  const assignStudent = async (sectionId: string, studentId: string) => {
    const { error } = await supabase.from('section_students').insert({
      section_id: sectionId,
      student_id: studentId
    });
    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Already assigned', variant: 'default' });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: 'Student Assigned' });
      fetchData();
    }
  };

  const removeStudent = async (assignmentId: string) => {
    const { error } = await supabase.from('section_students').delete().eq('id', assignmentId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      fetchData();
    }
  };

  const grades = [...new Set(sections.map(s => s.grade_level))];
  const filteredGrades = selectedGrade ? grades.filter(g => g === selectedGrade) : grades;
  const allGradesInUse = grades;

  // Students not in the current section
  const getUnassignedStudents = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return students;
    const assignedIds = section.students.map(s => s.student_id);
    return students.filter(s => !assignedIds.includes(s.student_id));
  };

  if (loading) {
    return <div className="animate-pulse text-muted-foreground">Loading sections...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Create Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Create Grade Section
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={newGrade} onValueChange={setNewGrade}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_LEVELS.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Section name (optional, e.g. A, B, C)"
              value={newSectionName}
              onChange={e => setNewSectionName(e.target.value)}
              className="w-full sm:w-48"
            />
            <Button onClick={createSection} disabled={!newGrade}>
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={selectedGrade} onValueChange={setSelectedGrade}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All grades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {allGradesInUse.map(g => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedGrade && selectedGrade !== 'all' && (
          <Button variant="ghost" size="sm" onClick={() => setSelectedGrade('')}>
            Clear filter
          </Button>
        )}
      </div>

      {/* Sections by Grade */}
      {(selectedGrade && selectedGrade !== 'all' ? [selectedGrade] : allGradesInUse).map(grade => (
        <Card key={grade}>
          <CardHeader
            className="cursor-pointer"
            onClick={() => setExpandedGrade(expandedGrade === grade ? null : grade)}
          >
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5 text-primary" />
              {grade}
              <Badge variant="secondary" className="ml-2">
                {sections.filter(s => s.grade_level === grade).length} sections
              </Badge>
              <ChevronRight className={`h-4 w-4 ml-auto transition-transform ${expandedGrade === grade ? 'rotate-90' : ''}`} />
            </CardTitle>
          </CardHeader>
          {expandedGrade === grade && (
            <CardContent className="space-y-4">
              {sections.filter(s => s.grade_level === grade).map(section => (
                <Card key={section.id} className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{grade}{section.section_name ? ` ${section.section_name}` : ''}</span>
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {section.students.length}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Dialog open={assignDialogOpen && assigningSectionId === section.id}
                          onOpenChange={(open) => {
                            setAssignDialogOpen(open);
                            if (open) setAssigningSectionId(section.id);
                          }}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Plus className="h-3 w-3 mr-1" /> Add Student
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Student to {grade} {section.section_name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {getUnassignedStudents(section.id).length === 0 ? (
                                <p className="text-sm text-muted-foreground">No unassigned students available.</p>
                              ) : (
                                getUnassignedStudents(section.id).map(student => (
                                  <div key={student.student_id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                    <span className="text-sm">{student.display_name}</span>
                                    <Button size="sm" variant="secondary"
                                      onClick={() => {
                                        assignStudent(section.id, student.student_id);
                                        setAssignDialogOpen(false);
                                      }}>
                                      Add
                                    </Button>
                                  </div>
                                ))
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="destructive" onClick={() => deleteSection(section.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {section.students.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {section.students.map(s => (
                          <Badge key={s.id} variant="secondary" className="flex items-center gap-1">
                            {s.display_name}
                            <button onClick={() => removeStudent(s.id)} className="ml-1 hover:text-destructive">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No students assigned yet.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          )}
        </Card>
      ))}

      {allGradesInUse.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No sections created yet</p>
            <p className="text-sm">Create grade sections above to organize your students.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
