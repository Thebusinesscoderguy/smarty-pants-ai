import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, BookOpen, Target, Calendar, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { FileUploadZone } from './FileUploadZone';
import { useStudyPlanGenerator } from '@/hooks/useStudyPlanGenerator';
import { useQuizGenerator } from '@/hooks/useQuizGenerator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface StudyPlan {
  id: string;
  title: string;
  description: string;
  weakAreas: string[];
  dailyLessons: DailyLesson[];
  estimatedDuration: number; // days
  difficultyLevel: 'easy' | 'medium' | 'hard';
}

interface DailyLesson {
  day: number;
  topic: string;
  description: string;
  activities: string[];
  estimatedTime: number; // minutes
  practiceQuestions: number;
}

export const StudyPlanGenerator = () => {
  const [inputMethod, setInputMethod] = useState<'file' | 'chat' | 'topic'>('file');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState<string>('');
  const [region, setRegion] = useState<string>('');
  const [planDays, setPlanDays] = useState<number>(7);
  const [aiChooseDays, setAiChooseDays] = useState<boolean>(false);
  const [maxDailyMinutes, setMaxDailyMinutes] = useState<number>(45);
  const [aiChooseDailyMinutes, setAiChooseDailyMinutes] = useState<boolean>(false);
  const [generatedPlan, setGeneratedPlan] = useState<StudyPlan | null>(null);

  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
const { isGenerating, generateStudyPlan } = useStudyPlanGenerator();
const { isGenerating: isBuildingQuiz, generateQuiz, retakeLatestQuiz, quizFromLatestMistakes, saveQuiz } = useQuizGenerator();
const [creatingPractice, setCreatingPractice] = useState(false);

const handleCreateRetake = async () => {
  setCreatingPractice(true);
  try {
    const quiz = await retakeLatestQuiz();
    if (!quiz) return;
    const savedId = await saveQuiz({ ...quiz, title: `${quiz.title} (Retake)` });
    if (savedId) toast({ title: 'Saved', description: 'Retake quiz saved to your Library.' });
  } catch (e: any) {
    toast({ title: 'Failed', description: e?.message || 'Please try again.', variant: 'destructive' });
  } finally {
    setCreatingPractice(false);
  }
};

const handleCreateMistakes = async () => {
  setCreatingPractice(true);
  try {
    const quiz = await quizFromLatestMistakes();
    if (!quiz) return;
    const savedId = await saveQuiz(quiz);
    if (savedId) toast({ title: 'Saved', description: 'Mistakes-only quiz saved to your Library.' });
  } catch (e: any) {
    toast({ title: 'Failed', description: e?.message || 'Please try again.', variant: 'destructive' });
  } finally {
    setCreatingPractice(false);
  }
};

const handleCreateMistakesSimilar = async () => {
  setCreatingPractice(true);
  try {
    const quiz = await quizFromLatestMistakes({ targetCount: 10 });
    if (!quiz) return;
    const savedId = await saveQuiz({ ...quiz, title: `${quiz.title} + Similar` });
    if (savedId) toast({ title: 'Saved', description: 'Mistakes + similar questions quiz saved to your Library.' });
  } catch (e: any) {
    toast({ title: 'Failed', description: e?.message || 'Please try again.', variant: 'destructive' });
  } finally {
    setCreatingPractice(false);
  }
};

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
  };

  const handleGeneratePlan = async () => {
    let inputData = '';
    let inputType = inputMethod;

    switch (inputMethod) {
      case 'file':
        if (!uploadedFile) return;
        inputData = uploadedFile.name; // In real implementation, would process file content
        break;
      case 'chat':
        if (!chatInput.trim()) return;
        inputData = chatInput;
        break;
      case 'topic':
        if (!selectedTopic.trim()) return;
        inputData = selectedTopic;
        break;
    }

    const plan = await generateStudyPlan(inputData, inputType, { gradeLevel, region, days: aiChooseDays ? undefined : planDays, maxDailyMinutes: aiChooseDailyMinutes ? undefined : maxDailyMinutes });
    if (plan) {
      setGeneratedPlan(plan);
    }
  };

  const handleSavePlan = async () => {
    if (!generatedPlan) return;
    try {
      setSaving(true);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        toast({ title: 'Sign in required', description: 'Please sign in to save your study plan.' });
        return;
      }
      const { error } = await supabase.from('study_plans').insert([
        {
          user_id: userId as any,
          title: generatedPlan.title,
          description: generatedPlan.description,
          weak_areas: generatedPlan.weakAreas,
          daily_lessons: generatedPlan.dailyLessons as any,
          estimated_duration: generatedPlan.estimatedDuration,
          difficulty_level: generatedPlan.difficultyLevel,
          grade_level: gradeLevel || null,
          region: region || null,
          status: 'saved'
        } as any
      ]);
      if (error) throw error;
      toast({ title: 'Saved', description: 'Your study plan has been saved.' });
    } catch (e: any) {
      toast({ title: 'Failed to save', description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleStartPlan = async () => {
    if (!generatedPlan) return;
    try {
      setStarting(true);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        toast({ title: 'Sign in required', description: 'Please sign in to start your study plan.' });
        return;
      }
      const { data, error } = await supabase
        .from('study_plans')
        .insert([
          {
            user_id: userId as any,
            title: generatedPlan.title,
            description: generatedPlan.description,
            weak_areas: generatedPlan.weakAreas,
            daily_lessons: generatedPlan.dailyLessons as any,
            estimated_duration: generatedPlan.estimatedDuration,
            difficulty_level: generatedPlan.difficultyLevel,
            grade_level: gradeLevel || null,
            region: region || null,
            status: 'active',
            started_at: new Date().toISOString()
          } as any
        ])
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (data?.id) {
        try { localStorage.setItem('active_study_plan_id', data.id); } catch {}
      }
      toast({ title: 'Plan started', description: 'You can now follow your daily lessons.' });
    } catch (e: any) {
      toast({ title: 'Failed to start', description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setStarting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'hard': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const popularTopics = [
    'Algebra 1', 'Algebra 2', 'Geometry', 'Precalculus', 'Calculus AB', 'Calculus BC',
    'Physics', 'Chemistry', 'Biology', 'US History', 'World History', 'Civics/Government',
    'English Grammar', 'Literature', 'Spanish I', 'Spanish II', 'Computer Science', 'SAT Math', 'SAT Reading'
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Study Plan Generator
          </CardTitle>
          <CardDescription>
            Upload a graded quiz/test or describe your weak areas to get a personalized study plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as 'file' | 'chat' | 'topic')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="file">Upload Quiz</TabsTrigger>
              <TabsTrigger value="chat">Describe Issues</TabsTrigger>
              <TabsTrigger value="topic">Select Topic</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              <div className="space-y-2">
                <Label>Upload Graded Quiz/Test</Label>
                <FileUploadZone
                  onFileUpload={handleFileUpload}
                  onFileRemove={handleFileRemove}
                  uploadedFile={uploadedFile}
                  acceptedFileTypes={['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png']}
                  disabled={isGenerating}
                />
              </div>

              {uploadedFile && (
                <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
                  <div className="text-sm font-medium">Practice options from your last quiz</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Button onClick={handleCreateRetake} disabled={creatingPractice || isBuildingQuiz}>
                      {creatingPractice ? 'Working…' : 'Save Retake Quiz to Library'}
                    </Button>
                    <Button variant="outline" onClick={handleCreateMistakes} disabled={creatingPractice || isBuildingQuiz}>
                      {creatingPractice ? 'Working…' : 'Save Mistakes-only Quiz'}
                    </Button>
                    <Button variant="outline" onClick={handleCreateMistakesSimilar} disabled={creatingPractice || isBuildingQuiz}>
                      {creatingPractice ? 'Working…' : 'Save Mistakes + Similar Quiz'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">These will be saved in your Quiz Library and can be taken like any normal quiz.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="chat" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chatInput">Describe what you struggled with</Label>
                <Textarea
                  id="chatInput"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Describe the topics you found difficult, specific questions you got wrong, or areas where you need more practice..."
                  rows={4}
                  disabled={isGenerating}
                />
              </div>
            </TabsContent>

            <TabsContent value="topic" className="space-y-4">
              <div className="space-y-2">
                <Label>Select Subject Area</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {popularTopics.map((topic) => (
                    <Button
                      key={topic}
                      variant={selectedTopic === topic ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTopic(selectedTopic === topic ? '' : topic)}
                      disabled={isGenerating}
                    >
                      {topic}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Grade level, region, plan constraints */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gradeLevel">Grade Level</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade level" />
                </SelectTrigger>
                <SelectContent>
                  {['Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12','College'].map(gl => (
                    <SelectItem key={gl} value={gl}>{gl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Curriculum/Country</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select curriculum/country" />
                </SelectTrigger>
                <SelectContent>
                  {['International','United States','United Kingdom','International Baccalaureate','Cambridge International','Australia','France'].map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="planDays">Plan length (days)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">AI decide</span>
                  <Switch checked={aiChooseDays} onCheckedChange={setAiChooseDays} />
                </div>
              </div>
              <Input
                id="planDays"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={String(planDays)}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, '');
                  setPlanDays(Math.max(1, Math.min(30, parseInt(v || '0', 10))));
                }}
                disabled={aiChooseDays}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="maxDailyMinutes">Max study time per day (minutes)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">AI decide</span>
                  <Switch checked={aiChooseDailyMinutes} onCheckedChange={setAiChooseDailyMinutes} />
                </div>
              </div>
              <Input
                id="maxDailyMinutes"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={String(maxDailyMinutes)}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, '');
                  setMaxDailyMinutes(Math.max(10, Math.min(180, parseInt(v || '0', 10))));
                }}
                disabled={aiChooseDailyMinutes}
              />
            </div>
          </div>

          <Button 
            onClick={handleGeneratePlan}
            disabled={
              isGenerating ||
              !gradeLevel.trim() ||
              !region.trim() ||
              (inputMethod === 'file' && !uploadedFile) ||
              (inputMethod === 'chat' && !chatInput.trim()) ||
              (inputMethod === 'topic' && !selectedTopic.trim())
            }
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Study Plan...
              </>
            ) : (
              <>
                <BookOpen className="mr-2 h-4 w-4" />
                Generate Study Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedPlan && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{generatedPlan.title}</CardTitle>
                <CardDescription>{generatedPlan.description}</CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <Badge className={getDifficultyColor(generatedPlan.difficultyLevel)}>
                    {generatedPlan.difficultyLevel}
                  </Badge>
                  <Badge variant="outline">
                    {generatedPlan.estimatedDuration} days
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 md:flex-none" onClick={handleStartPlan} disabled={starting}>
                    {starting ? 'Starting…' : 'Start Study Plan'}
                  </Button>
                  <Button variant="outline" className="flex-1 md:flex-none" onClick={handleSavePlan} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Plan'}
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Weak Areas Analysis */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <h4 className="font-medium">Areas for Improvement</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {generatedPlan.weakAreas.map((area, index) => (
                  <Badge key={index} variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Daily Lessons */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <h4 className="font-medium">Daily Study Plan</h4>
              </div>
              <div className="space-y-3">
                {generatedPlan.dailyLessons.map((lesson, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Day {lesson.day}</Badge>
                            <h5 className="font-medium">{lesson.topic}</h5>
                          </div>
                          <p className="text-sm text-muted-foreground">{lesson.description}</p>
                          <div className="space-y-1">
                            {lesson.activities.map((activity, actIndex) => (
                              <div key={actIndex} className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                {activity}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {lesson.estimatedTime} min
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {lesson.practiceQuestions} questions
                          </Badge>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              const subjectContext = `${generatedPlan.title} - ${lesson.topic}`;
                              const quiz = await generateQuiz(
                                subjectContext,
                                'medium',
                                lesson.practiceQuestions,
                                undefined,
                                gradeLevel
                              );
                              if (!quiz) return;
                              const savedId = await saveQuiz({ ...quiz, title: `${generatedPlan.title} - ${lesson.topic} (Day ${lesson.day} Practice)` });
                              if (savedId) {
                                toast({ title: 'Quiz ready', description: 'Saved to your Library. You can take it now.' });
                              }
                            } catch (e: any) {
                              toast({ title: 'Failed to create quiz', description: e?.message || 'Please try again.', variant: 'destructive' });
                            }
                          }}
                          className="w-full md:w-auto"
                          variant="outline"
                        >
                          Create Lesson Quiz and Save to Library
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Progress Tracking */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <h4 className="font-medium">Progress Overview</h4>
              </div>
              <Card className="bg-muted/20">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>0/{generatedPlan.dailyLessons.length} days</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

          </CardContent>
        </Card>
      )}
    </div>
  );
};
