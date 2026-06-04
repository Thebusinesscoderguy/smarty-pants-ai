import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText, Printer, Save, Trash2, Sparkles, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const TeacherLessonPlanGenerator = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [duration, setDuration] = useState('45');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState('');
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [linkedQuizId, setLinkedQuizId] = useState<string | null>(null);

  useEffect(() => {
    fetchSchoolId();
    fetchSavedPlans();
  }, [user]);

  const fetchSchoolId = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('school_accounts')
      .select('id')
      .eq('admin_user_id', user.id)
      .maybeSingle();
    if (data) {
      setSchoolId(data.id);
    } else {
      const { data: teacher } = await supabase
        .from('school_teachers')
        .select('school_id')
        .eq('email', user.email?.toLowerCase() || '')
        .eq('is_active', true)
        .maybeSingle();
      if (teacher) setSchoolId(teacher.school_id);
    }
  };

  const fetchSavedPlans = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('teacher_lesson_plans')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setSavedPlans(data);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: 'Error', description: 'Please enter a topic', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    setSelectedPlan(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-lesson-plan', {
        body: { topic, subject, gradeLevel, durationMinutes: parseInt(duration), language },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setGeneratedPlan(data.content);
      toast({ title: 'Success', description: 'Lesson plan generated!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to generate', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!user || !generatedPlan) return;
    try {
      const { error } = await supabase.from('teacher_lesson_plans').insert({
        teacher_id: user.id,
        school_id: schoolId,
        topic,
        subject: subject || null,
        grade_level: gradeLevel || null,
        duration_minutes: parseInt(duration),
        content: generatedPlan,
      });
      if (error) throw error;
      toast({ title: 'Saved', description: 'Lesson plan saved successfully!' });
      fetchSavedPlans();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>Lesson Plan - ${topic}</title>
        <style>body{font-family:system-ui;max-width:800px;margin:0 auto;padding:40px;line-height:1.6}
        h2{color:#333;border-bottom:2px solid #e5e7eb;padding-bottom:8px}
        ul{padding-left:20px}li{margin-bottom:4px}</style></head>
        <body>${generatedPlan.replace(/\n/g, '<br>').replace(/## (.*)/g, '<h2>$1</h2>').replace(/- (.*)/g, '<li>$1</li>')}</body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const loadPlan = (plan: any) => {
    setSelectedPlan(plan.id);
    setGeneratedPlan(plan.content);
    setTopic(plan.topic);
    setSubject(plan.subject || '');
    setGradeLevel(plan.grade_level || '');
    setDuration(String(plan.duration_minutes || 45));
    setLinkedQuizId(plan.linked_quiz_id || null);
  };

  const generateMatchingQuiz = async () => {
    if (!selectedPlan || !generatedPlan) {
      toast({ title: 'Save the plan first', description: 'Save your lesson plan before generating a quiz.', variant: 'destructive' });
      return;
    }
    setGeneratingQuiz(true);
    try {
      // Generate quiz based on the lesson plan content
      const quizPrompt = `${topic}${subject ? ' (' + subject + ')' : ''}\n\nBase questions on this lesson plan:\n${generatedPlan.substring(0, 2000)}`;
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { topic: quizPrompt, difficulty: 'medium', questionCount: 8, gradeLevel, language },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Persist quiz
      const { data: quizRow, error: quizErr } = await supabase
        .from('quizzes')
        .insert({
          user_id: user!.id,
          title: data.title || `Quiz: ${topic}`,
          description: data.description || `Auto-generated from lesson plan`,
          difficulty: 'medium',
          total_questions: data.questions?.length || 0,
        })
        .select('id')
        .single();
      if (quizErr) throw quizErr;

      // Persist questions
      if (data.questions?.length) {
        const rows = data.questions.map((q: any, i: number) => ({
          quiz_id: quizRow.id,
          question: q.question,
          question_type: q.type || 'multiple_choice',
          options: q.options || null,
          correct_answer: q.correct_answer,
          explanation: q.explanation || null,
          order_index: i,
          points: 1,
        }));
        await supabase.from('quiz_questions').insert(rows);
      }

      // Link quiz to lesson plan
      await supabase.from('teacher_lesson_plans').update({ linked_quiz_id: quizRow.id }).eq('id', selectedPlan);
      setLinkedQuizId(quizRow.id);
      toast({ title: 'Quiz ready!', description: `${data.questions?.length || 0} questions generated and linked to this lesson plan.` });
      fetchSavedPlans();
    } catch (err: any) {
      toast({ title: 'Could not generate quiz', description: err.message || 'Try again', variant: 'destructive' });
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const deletePlan = async (planId: string) => {
    const { error } = await supabase.from('teacher_lesson_plans').delete().eq('id', planId);
    if (!error) {
      toast({ title: 'Deleted', description: 'Plan removed' });
      fetchSavedPlans();
      if (selectedPlan === planId) {
        setGeneratedPlan('');
        setSelectedPlan(null);
      }
    }
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/## (.*)/g, '<h2 class="text-xl font-bold mt-6 mb-3 text-foreground border-b border-border pb-2">$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.*)/gm, '<li class="ml-4 text-muted-foreground">$1</li>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Generate Lesson Plan
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/lesson-plans')}>
                Library
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Topic *</Label>
              <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Photosynthesis" />
            </div>
            <div>
              <Label>Subject</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., Biology" />
            </div>
            <div>
              <Label>Grade Level</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={`Grade ${i + 1}`}>Grade {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                  <SelectItem value="90">90 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : 'Generate Plan'}
            </Button>

            {/* Saved Plans */}
            {savedPlans.length > 0 && (
              <div className="mt-6">
                <Label className="text-sm font-semibold">Saved Plans</Label>
                <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                  {savedPlans.map(plan => (
                    <div
                      key={plan.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPlan === plan.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => loadPlan(plan)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{plan.topic}</p>
                          <p className="text-xs text-muted-foreground">{plan.subject} · {plan.grade_level}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); deletePlan(plan.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generated Plan Display */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Lesson Plan</CardTitle>
              {generatedPlan && (
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-1" />Print
                  </Button>
                  {selectedPlan && (
                    linkedQuizId ? (
                      <Button variant="outline" size="sm" onClick={() => navigate('/quiz-generator')}>
                        <ExternalLink className="h-4 w-4 mr-1" />View linked quiz
                      </Button>
                    ) : (
                      <Button size="sm" onClick={generateMatchingQuiz} disabled={generatingQuiz} className="bg-primary text-primary-foreground">
                        {generatingQuiz ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4 mr-1" />Generate matching quiz</>}
                      </Button>
                    )
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Generating your lesson plan...</span>
              </div>
            ) : generatedPlan ? (
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(generatedPlan) }}
              />
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Enter a topic and click Generate to create a lesson plan</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
