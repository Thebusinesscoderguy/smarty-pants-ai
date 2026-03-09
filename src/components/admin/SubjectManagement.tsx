import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface SchoolSubject {
  id: string;
  name: string;
  created_at: string;
}

export const SubjectManagement = () => {
  const [subjects, setSubjects] = useState<SchoolSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchSubjects();
  }, [user]);

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
      setIsLoading(true);
      const schoolId = await getSchoolId();
      const { data, error } = await supabase
        .from('school_subjects')
        .select('*')
        .eq('school_id', schoolId)
        .order('name');
      if (error) throw error;
      setSubjects(data || []);
    } catch (error: any) {
      if (error.message !== 'No school found') {
        console.error('Error fetching subjects:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addSubject = async () => {
    if (!newSubjectName.trim()) return;
    try {
      setIsAdding(true);
      const schoolId = await getSchoolId();
      const { error } = await supabase
        .from('school_subjects')
        .insert({ school_id: schoolId, name: newSubjectName.trim() });
      if (error) throw error;
      toast({ title: 'Subject added', description: `${newSubjectName.trim()} has been added.` });
      setNewSubjectName('');
      fetchSubjects();
    } catch (error: any) {
      console.error('Error adding subject:', error);
      toast({ title: 'Error', description: 'Failed to add subject', variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  const deleteSubject = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will also remove all related daily grades.`)) return;
    try {
      const { error } = await supabase.from('school_subjects').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Subject deleted', description: `${name} has been removed.` });
      fetchSubjects();
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({ title: 'Error', description: 'Failed to delete subject', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">Loading subjects...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Subjects</h2>
        <p className="text-muted-foreground">Create and manage your school's subjects. These subjects are used in the Grade Book.</p>
      </div>

      {/* Add Subject */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Input
              placeholder="Subject name (e.g. Mathematics, Science, English)"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubject()}
              className="flex-1"
            />
            <Button onClick={addSubject} disabled={isAdding || !newSubjectName.trim()}>
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Subject
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subject List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {subjects.map((subject) => (
          <Card key={subject.id} className="bg-card border-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">{subject.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteSubject(subject.id, subject.name)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {subjects.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No subjects created yet. Add your first subject above.</p>
          </CardContent>
        </Card>
      )}

      {subjects.length > 0 && (
        <p className="text-sm text-muted-foreground">
          <Badge variant="secondary">{subjects.length}</Badge> subject{subjects.length !== 1 ? 's' : ''} created. These will appear as tabs in the Grade Book.
        </p>
      )}
    </div>
  );
};
