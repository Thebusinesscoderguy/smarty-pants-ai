import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, Wand2, Upload, Send, FileText, Users, Clock, Trash2, Eye, Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
interface SchoolSection {
  id: string;
  grade_level: string;
  section_name: string;
}

interface Assessment {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  time_limit_minutes: number | null;
  total_points: number | null;
  ai_generated: boolean | null;
  created_at: string | null;
  question_count: number;
  assignments: AssessmentAssignment[];
}

interface AssessmentAssignment {
  id: string;
  classification_tag: string | null;
  target_id: string | null;
  assignment_type: string;
  due_date: string | null;
  is_active: boolean | null;
}

interface QuizQuestion {
  question: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correct_answer: string;
  points: number;
}

export const AssessmentManagement = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [schoolSections, setSchoolSections] = useState<SchoolSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [createMode, setCreateMode] = useState<'ai' | 'manual'>('ai');

  // AI generation form
  const [aiForm, setAiForm] = useState({
    topic: '',
    subject: '',
    gradeLevel: '',
    numQuestions: 10,
    difficulty: 'medium',
    title: '',
    timeLimitMinutes: 30,
  });

  // Manual creation form
  const [manualForm, setManualForm] = useState({
    title: '',
    description: '',
    subject: '',
    timeLimitMinutes: 30,
    questions: [] as QuizQuestion[],
  });

  const [newQuestion, setNewQuestion] = useState<QuizQuestion>({
    question: '',
    question_type: 'multiple_choice',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1,
  });

  // Assignment form
  const [assignForm, setAssignForm] = useState({
    sections: [] as string[],
    dueDate: '',
  });

  useEffect(() => {
    fetchAssessments();
    fetchSections();
  }, [user]);

  const fetchSections = async () => {
    if (!user) return;
    const { data: school } = await supabase
      .from('school_accounts')
      .select('id')
      .eq('admin_user_id', user.id)
      .single();
    if (!school) return;
    const { data } = await supabase
      .from('school_sections')
      .select('id, grade_level, section_name')
      .eq('school_id', school.id)
      .order('grade_level')
      .order('section_name');
    setSchoolSections(data || []);
  };

  const fetchAssessments = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const { data: tests, error } = await supabase
        .from('tests')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const assessmentList: Assessment[] = [];

      for (const test of tests || []) {
        // Get question count
        const { count } = await supabase
          .from('test_questions')
          .select('*', { count: 'exact', head: true })
          .eq('test_id', test.id);

        // Get assignments
        const { data: assignments } = await supabase
          .from('content_assignments')
          .select('*')
          .eq('content_id', test.id)
          .eq('content_type', 'test');

        assessmentList.push({
          ...test,
          question_count: count || 0,
          assignments: (assignments || []).map(a => ({
            id: a.id,
            classification_tag: a.classification_tag,
            target_id: a.target_id,
            assignment_type: a.assignment_type,
            due_date: a.due_date,
            is_active: a.is_active,
          })),
        });
      }

      setAssessments(assessmentList);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIQuiz = async () => {
    if (!user || !aiForm.topic.trim()) return;
    try {
      setIsGenerating(true);

      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: {
          topic: aiForm.topic,
          subject: aiForm.subject,
          gradeLevel: aiForm.gradeLevel,
          numQuestions: aiForm.numQuestions,
          difficulty: aiForm.difficulty,
        },
      });

      if (error) throw error;

      const questions = data?.questions || data?.quiz?.questions || [];
      if (!questions.length) throw new Error('No questions generated');

      const title = aiForm.title || `${aiForm.subject} - ${aiForm.topic}`;

      // Create the test
      const { data: test, error: testError } = await supabase
        .from('tests')
        .insert({
          title,
          description: `AI-generated quiz on ${aiForm.topic}`,
          subject: aiForm.subject,
          creator_id: user.id,
          ai_generated: true,
          ai_graded: true,
          total_points: questions.length,
          time_limit_minutes: aiForm.timeLimitMinutes,
        })
        .select()
        .single();

      if (testError) throw testError;

      // Insert questions
      const questionsToInsert = questions.map((q: any, i: number) => ({
        test_id: test.id,
        question: q.question,
        question_type: q.type || 'multiple_choice',
        options: q.options || q.choices || [],
        correct_answer: q.correct_answer || q.answer || '',
        points: 1,
        order_index: i,
      }));

      const { error: qError } = await supabase
        .from('test_questions')
        .insert(questionsToInsert);

      if (qError) throw qError;

      toast({ title: 'Assessment Created', description: `"${title}" with ${questions.length} questions generated by AI` });
      setCreateDialogOpen(false);
      setAiForm({ topic: '', subject: '', gradeLevel: '', numQuestions: 10, difficulty: 'medium', title: '', timeLimitMinutes: 30 });
      fetchAssessments();
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast({ title: 'Generation Failed', description: error.message || 'Failed to generate quiz', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const createManualAssessment = async () => {
    if (!user || !manualForm.title.trim() || manualForm.questions.length === 0) return;
    try {
      const { data: test, error: testError } = await supabase
        .from('tests')
        .insert({
          title: manualForm.title,
          description: manualForm.description,
          subject: manualForm.subject,
          creator_id: user.id,
          ai_generated: false,
          ai_graded: true,
          total_points: manualForm.questions.reduce((sum, q) => sum + q.points, 0),
          time_limit_minutes: manualForm.timeLimitMinutes,
        })
        .select()
        .single();

      if (testError) throw testError;

      const questionsToInsert = manualForm.questions.map((q, i) => ({
        test_id: test.id,
        question: q.question,
        question_type: q.question_type,
        options: q.options.filter(o => o.trim()),
        correct_answer: q.correct_answer,
        points: q.points,
        order_index: i,
      }));

      const { error: qError } = await supabase.from('test_questions').insert(questionsToInsert);
      if (qError) throw qError;

      toast({ title: 'Assessment Created', description: `"${manualForm.title}" with ${manualForm.questions.length} questions` });
      setCreateDialogOpen(false);
      setManualForm({ title: '', description: '', subject: '', timeLimitMinutes: 30, questions: [] });
      fetchAssessments();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to create assessment', variant: 'destructive' });
    }
  };

  const addQuestion = () => {
    if (!newQuestion.question.trim() || !newQuestion.correct_answer.trim()) return;
    setManualForm(prev => ({
      ...prev,
      questions: [...prev.questions, { ...newQuestion }],
    }));
    setNewQuestion({
      question: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1,
    });
  };

  const removeQuestion = (index: number) => {
    setManualForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const getSectionLabel = (section: SchoolSection) => {
    return section.section_name
      ? `${section.grade_level} ${section.section_name}`
      : section.grade_level;
  };

  const assignToSections = async () => {
    if (!user || !selectedAssessment || assignForm.sections.length === 0) return;
    try {
      const inserts = assignForm.sections.map(sectionId => {
        const section = schoolSections.find(s => s.id === sectionId);
        const tag = section ? getSectionLabel(section) : sectionId;
        return {
          content_id: selectedAssessment.id,
          content_type: 'test',
          assignment_type: 'classification',
          classification_tag: tag,
          assigned_by: user.id,
          due_date: assignForm.dueDate || null,
          is_active: true,
        };
      });

      const { error } = await supabase.from('content_assignments').insert(inserts);
      if (error) throw error;

      toast({ title: 'Assigned', description: `Assessment assigned to ${assignForm.sections.length} section(s)` });
      setAssignDialogOpen(false);
      setAssignForm({ sections: [], dueDate: '' });
      fetchAssessments();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to assign assessment', variant: 'destructive' });
    }
  };

  const deleteAssessment = async (id: string) => {
    try {
      await supabase.from('test_questions').delete().eq('test_id', id);
      await supabase.from('content_assignments').delete().eq('content_id', id).eq('content_type', 'test');
      const { error } = await supabase.from('tests').delete().eq('id', id);
      if (error) throw error;
      setAssessments(prev => prev.filter(a => a.id !== id));
      toast({ title: 'Deleted', description: 'Assessment removed' });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to delete assessment', variant: 'destructive' });
    }
  };

  const toggleSection = (tag: string) => {
    setAssignForm(prev => ({
      ...prev,
      sections: prev.sections.includes(tag)
        ? prev.sections.filter(s => s !== tag)
        : [...prev.sections, tag],
    }));
  };

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">Loading assessments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Assessments</h2>
          <p className="text-muted-foreground">Create, manage, and assign quizzes to student sections</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Assessment
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create Assessment</DialogTitle>
            </DialogHeader>

            <Tabs value={createMode} onValueChange={(v: any) => setCreateMode(v)}>
              <TabsList className="grid w-full grid-cols-2 bg-muted">
                <TabsTrigger value="ai">
                  <Wand2 className="h-4 w-4 mr-2" />
                  AI Generated
                </TabsTrigger>
                <TabsTrigger value="manual">
                  <Upload className="h-4 w-4 mr-2" />
                  Manual Create
                </TabsTrigger>
              </TabsList>

              {/* AI Generation */}
              <TabsContent value="ai" className="space-y-4 mt-4">
                <div>
                  <Label>Assessment Title (optional)</Label>
                  <Input
                    value={aiForm.title}
                    onChange={e => setAiForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g., Grade 9A Math Midterm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Subject *</Label>
                    <Input
                      value={aiForm.subject}
                      onChange={e => setAiForm(p => ({ ...p, subject: e.target.value }))}
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div>
                    <Label>Grade Level</Label>
                    <Input
                      value={aiForm.gradeLevel}
                      onChange={e => setAiForm(p => ({ ...p, gradeLevel: e.target.value }))}
                      placeholder="e.g., Grade 9"
                    />
                  </div>
                </div>
                <div>
                  <Label>Topic / Instructions *</Label>
                  <Textarea
                    value={aiForm.topic}
                    onChange={e => setAiForm(p => ({ ...p, topic: e.target.value }))}
                    placeholder="Describe the topic, chapters, or specific areas to cover..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Number of Questions</Label>
                    <Select
                      value={String(aiForm.numQuestions)}
                      onValueChange={v => setAiForm(p => ({ ...p, numQuestions: Number(v) }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[5, 10, 15, 20, 25, 30].map(n => (
                          <SelectItem key={n} value={String(n)}>{n} questions</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Difficulty</Label>
                    <Select
                      value={aiForm.difficulty}
                      onValueChange={v => setAiForm(p => ({ ...p, difficulty: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Time Limit (minutes)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={aiForm.timeLimitMinutes}
                      onChange={e => setAiForm(p => ({ ...p, timeLimitMinutes: Number(e.target.value) }))}
                      placeholder="e.g., 45"
                    />
                  </div>
                </div>
                <Button
                  onClick={generateAIQuiz}
                  disabled={isGenerating || !aiForm.topic.trim() || !aiForm.subject.trim()}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* Manual Creation */}
              <TabsContent value="manual" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Title *</Label>
                    <Input
                      value={manualForm.title}
                      onChange={e => setManualForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="Assessment title"
                    />
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <Input
                      value={manualForm.subject}
                      onChange={e => setManualForm(p => ({ ...p, subject: e.target.value }))}
                      placeholder="e.g., Science"
                    />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={manualForm.description}
                    onChange={e => setManualForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Time Limit (minutes)</Label>
                  <Input
                    type="number"
                    value={manualForm.timeLimitMinutes}
                    onChange={e => setManualForm(p => ({ ...p, timeLimitMinutes: Number(e.target.value) }))}
                  />
                </div>

                {/* Question Builder */}
                <Card className="bg-muted/50 border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-foreground">Add Question</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Question *</Label>
                      <Textarea
                        value={newQuestion.question}
                        onChange={e => setNewQuestion(p => ({ ...p, question: e.target.value }))}
                        placeholder="Enter question..."
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={newQuestion.question_type}
                          onValueChange={(v: any) => setNewQuestion(p => ({ ...p, question_type: v }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                            <SelectItem value="true_false">True/False</SelectItem>
                            <SelectItem value="short_answer">Short Answer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Points</Label>
                        <Input
                          type="number"
                          value={newQuestion.points}
                          onChange={e => setNewQuestion(p => ({ ...p, points: Number(e.target.value) }))}
                          min={1}
                        />
                      </div>
                    </div>
                    {newQuestion.question_type === 'multiple_choice' && (
                      <div className="space-y-2">
                        <Label>Options</Label>
                        {newQuestion.options.map((opt, i) => (
                          <Input
                            key={i}
                            value={opt}
                            onChange={e => {
                              const opts = [...newQuestion.options];
                              opts[i] = e.target.value;
                              setNewQuestion(p => ({ ...p, options: opts }));
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + i)}`}
                          />
                        ))}
                      </div>
                    )}
                    <div>
                      <Label>Correct Answer *</Label>
                      <Input
                        value={newQuestion.correct_answer}
                        onChange={e => setNewQuestion(p => ({ ...p, correct_answer: e.target.value }))}
                        placeholder={newQuestion.question_type === 'true_false' ? 'true or false' : 'Correct answer'}
                      />
                    </div>
                    <Button variant="outline" onClick={addQuestion} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </CardContent>
                </Card>

                {/* Added questions list */}
                {manualForm.questions.length > 0 && (
                  <div className="space-y-2">
                    <Label>{manualForm.questions.length} Question(s) Added</Label>
                    {manualForm.questions.map((q, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50 border border-border">
                        <span className="text-sm text-foreground truncate flex-1">
                          {i + 1}. {q.question}
                        </span>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge variant="secondary" className="text-xs">{q.points}pt</Badge>
                          <Button variant="ghost" size="sm" onClick={() => removeQuestion(i)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={createManualAssessment}
                  disabled={!manualForm.title.trim() || manualForm.questions.length === 0}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Create Assessment ({manualForm.questions.length} questions)
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Assessments</p>
              <p className="text-2xl font-bold text-foreground">{assessments.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wand2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">AI Generated</p>
              <p className="text-2xl font-bold text-foreground">
                {assessments.filter(a => a.ai_generated).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned</p>
              <p className="text-2xl font-bold text-foreground">
                {assessments.filter(a => a.assignments.length > 0).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assessments Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assessment</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Questions</TableHead>
                <TableHead className="text-center">Time</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No assessments created yet. Click "Create Assessment" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                assessments.map(assessment => (
                  <TableRow key={assessment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{assessment.title}</span>
                        {assessment.ai_generated && (
                          <Badge variant="secondary" className="text-xs">
                            <Wand2 className="h-3 w-3 mr-1" />
                            AI
                          </Badge>
                        )}
                      </div>
                      {assessment.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[250px]">
                          {assessment.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {assessment.subject || '—'}
                    </TableCell>
                    <TableCell className="text-center text-foreground">
                      {assessment.question_count}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {assessment.time_limit_minutes ? `${assessment.time_limit_minutes}m` : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {assessment.assignments.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Not assigned</span>
                        ) : (
                          assessment.assignments.map(a => (
                            <Badge key={a.id} variant="outline" className="text-xs">
                              {a.classification_tag || 'Individual'}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAssessment(assessment);
                            setAssignForm({ sections: [], dueDate: '' });
                            setAssignDialogOpen(true);
                          }}
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteAssessment(assessment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Assign "{selectedAssessment?.title}"
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Select which sections should receive this assessment
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Sections</Label>
              {schoolSections.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-1">
                  No sections found. Create grade sections first in the Sections tab.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                  {schoolSections.map(section => (
                    <Badge
                      key={section.id}
                      variant={assignForm.sections.includes(section.id) ? 'default' : 'outline'}
                      className="cursor-pointer select-none"
                      onClick={() => toggleSection(section.id)}
                    >
                      {getSectionLabel(section)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>Due Date (optional)</Label>
              <Input
                type="date"
                value={assignForm.dueDate}
                onChange={e => setAssignForm(p => ({ ...p, dueDate: e.target.value }))}
              />
            </div>
            <Button
              onClick={assignToSections}
              disabled={assignForm.sections.length === 0}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              Assign to {assignForm.sections.length} Section(s)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
