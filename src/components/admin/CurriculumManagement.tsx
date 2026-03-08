import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, BookOpen, Edit, Trash2, Upload, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Curriculum {
  id: string;
  title: string;
  description: string;
  content: any;
  grade_level: string;
  subject_id: string;
  is_active: boolean;
  created_at: string;
  subjects?: { name: string };
}

interface Subject {
  id: string;
  name: string;
}

export const CurriculumManagement = () => {
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { user } = useAuth();
  
  const [newCurriculum, setNewCurriculum] = useState({
    title: '',
    description: '',
    subject_id: '',
    grade_level: '',
    content: {
      curriculum_file_content: '',
      ai_instructions: 'Follow the uploaded curriculum guidelines when helping students.',
      topics: [],
      learning_objectives: ''
    }
  });

  useEffect(() => {
    fetchCurricula();
    fetchSubjects();
  }, []);

  const fetchCurricula = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('curricula')
        .select('*, subjects (name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCurricula(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load curricula", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase.from('subjects').select('id, name').order('name');
      if (error) throw error;
      setSubjects(data || []);
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      setNewCurriculum(prev => ({
        ...prev,
        content: { ...prev.content, curriculum_file_content: text }
      }));
      setUploadedFile(file);
      toast({ title: "File Uploaded", description: `${file.name} has been processed.` });
    } catch (error) {
      toast({ title: "Upload Error", description: "Failed to process the uploaded file.", variant: "destructive" });
    }
  };

  const createCurriculum = async () => {
    if (!newCurriculum.title.trim() || !newCurriculum.subject_id) return;
    try {
      setIsCreating(true);
      const { data: schoolData, error: schoolError } = await supabase
        .from('school_accounts')
        .select('id')
        .eq('admin_user_id', user?.id)
        .single();
      if (schoolError) throw schoolError;

      const { data, error } = await supabase
        .from('curricula')
        .insert({
          title: newCurriculum.title,
          description: newCurriculum.description,
          subject_id: newCurriculum.subject_id,
          grade_level: newCurriculum.grade_level,
          content: newCurriculum.content,
          school_id: schoolData.id
        })
        .select('*, subjects (name)')
        .single();
      if (error) throw error;

      setCurricula([data, ...curricula]);
      setNewCurriculum({
        title: '', description: '', subject_id: '', grade_level: '',
        content: { curriculum_file_content: '', ai_instructions: 'Follow the uploaded curriculum guidelines when helping students.', topics: [], learning_objectives: '' }
      });
      setUploadedFile(null);
      toast({ title: "Curriculum Created", description: `"${newCurriculum.title}" has been uploaded.` });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to create curriculum", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const updateCurriculum = async () => {
    if (!editingCurriculum) return;
    try {
      const { error } = await supabase
        .from('curricula')
        .update({
          title: editingCurriculum.title,
          description: editingCurriculum.description,
          content: editingCurriculum.content,
          grade_level: editingCurriculum.grade_level,
          is_active: editingCurriculum.is_active
        })
        .eq('id', editingCurriculum.id);
      if (error) throw error;
      setCurricula(curricula.map(c => c.id === editingCurriculum.id ? editingCurriculum : c));
      setEditingCurriculum(null);
      toast({ title: "Curriculum Updated", description: "Curriculum has been updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to update curriculum", variant: "destructive" });
    }
  };

  const deleteCurriculum = async (id: string) => {
    try {
      const { error } = await supabase.from('curricula').delete().eq('id', id);
      if (error) throw error;
      setCurricula(curricula.filter(c => c.id !== id));
      toast({ title: "Curriculum Deleted", description: "Curriculum has been deleted successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to delete curriculum", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">Loading curricula...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">School Curriculum Management</h2>
          <p className="text-muted-foreground">Upload your school's curriculum files to guide the AI tutor</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Upload Curriculum
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">Upload School Curriculum</DialogTitle>
              <p className="text-muted-foreground text-sm">
                Upload your curriculum files (PDF, DOC, TXT) to help the AI tutor follow your school's specific guidelines
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Curriculum Title *</Label>
                  <Input
                    id="title"
                    value={newCurriculum.title}
                    onChange={(e) => setNewCurriculum({ ...newCurriculum, title: e.target.value })}
                    placeholder="e.g., 9th Grade Algebra I"
                  />
                </div>
                <div>
                  <Label htmlFor="grade">Grade Level</Label>
                  <Input
                    id="grade"
                    value={newCurriculum.grade_level}
                    onChange={(e) => setNewCurriculum({ ...newCurriculum, grade_level: e.target.value })}
                    placeholder="9th Grade"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Select value={newCurriculum.subject_id} onValueChange={(value) => setNewCurriculum({ ...newCurriculum, subject_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-2 border-dashed border-border rounded-lg p-6">
                <div className="text-center">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="bg-primary hover:bg-primary/90 px-4 py-2 rounded text-primary-foreground text-sm">
                      Choose Curriculum File
                    </span>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      className="hidden"
                    />
                  </Label>
                  <p className="text-muted-foreground text-sm mt-2">Upload PDF, DOC, or TXT files</p>
                  {uploadedFile && (
                    <div className="mt-3 flex items-center justify-center space-x-2 text-green-600">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{uploadedFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCurriculum.description}
                  onChange={(e) => setNewCurriculum({ ...newCurriculum, description: e.target.value })}
                  placeholder="Brief description of this curriculum..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="ai-instructions">AI Instructions (Optional)</Label>
                <Textarea
                  id="ai-instructions"
                  value={newCurriculum.content.ai_instructions}
                  onChange={(e) => setNewCurriculum({ 
                    ...newCurriculum, 
                    content: { ...newCurriculum.content, ai_instructions: e.target.value }
                  })}
                  placeholder="Additional instructions for how the AI should use this curriculum..."
                  rows={3}
                />
              </div>

              <Button 
                onClick={createCurriculum}
                disabled={isCreating || !newCurriculum.title.trim() || !newCurriculum.subject_id}
                className="w-full"
              >
                {isCreating ? 'Uploading Curriculum...' : 'Upload Curriculum'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {curricula.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No curriculum files uploaded yet.</p>
              <p className="text-muted-foreground/70 text-sm mt-2">
                Upload your school's curriculum files to help the AI tutor provide targeted assistance.
              </p>
            </CardContent>
          </Card>
        ) : (
          curricula.map((curriculum) => (
            <Card key={curriculum.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="font-medium text-foreground">{curriculum.title}</h3>
                      {curriculum.subjects && <Badge variant="outline">{curriculum.subjects.name}</Badge>}
                      {curriculum.grade_level && <Badge variant="secondary">{curriculum.grade_level}</Badge>}
                      <Badge variant={curriculum.is_active ? 'default' : 'secondary'}>
                        {curriculum.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {curriculum.description && (
                      <p className="text-sm text-muted-foreground mb-2">{curriculum.description}</p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      <p>Uploaded: {new Date(curriculum.created_at).toLocaleDateString()}</p>
                      {curriculum.content?.curriculum_file_content && (
                        <p className="text-green-600 mt-1">✓ Curriculum file content loaded</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setEditingCurriculum(curriculum)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">Edit Curriculum</DialogTitle>
                        </DialogHeader>
                        {editingCurriculum && (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="edit-title">Title</Label>
                              <Input
                                id="edit-title"
                                value={editingCurriculum.title}
                                onChange={(e) => setEditingCurriculum({ ...editingCurriculum, title: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-description">Description</Label>
                              <Textarea
                                id="edit-description"
                                value={editingCurriculum.description}
                                onChange={(e) => setEditingCurriculum({ ...editingCurriculum, description: e.target.value })}
                                rows={3}
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-grade">Grade Level</Label>
                              <Input
                                id="edit-grade"
                                value={editingCurriculum.grade_level}
                                onChange={(e) => setEditingCurriculum({ ...editingCurriculum, grade_level: e.target.value })}
                              />
                            </div>
                            <Button onClick={updateCurriculum} className="w-full">
                              Save Changes
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button variant="destructive" size="sm" onClick={() => deleteCurriculum(curriculum.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
