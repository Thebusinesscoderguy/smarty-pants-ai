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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, BookOpen, Target, Calendar, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { FileUploadZone } from './FileUploadZone';
import { useStudyPlanGenerator } from '@/hooks/useStudyPlanGenerator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

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
  exampleQuestions?: Array<{
    question: string;
    solution: string;
  }>;
}

export const StudyPlanGenerator = () => {
  const { t } = useLanguage();
  const [inputMethod, setInputMethod] = useState<'file' | 'chat' | 'topic'>('file');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'study_material' | 'graded_quiz'>('study_material');
  const [chatInput, setChatInput] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState<string>('');
  const [region, setRegion] = useState<string>('');
  const [planDays, setPlanDays] = useState<number>(7);
  const [aiChooseDays, setAiChooseDays] = useState<boolean>(false);
  const [maxDailyMinutes, setMaxDailyMinutes] = useState<number>(45);
  const [aiChooseDailyMinutes, setAiChooseDailyMinutes] = useState<boolean>(false);
  const [generatedPlan, setGeneratedPlan] = useState<StudyPlan | null>(null);
  const [mistakeBasedMode, setMistakeBasedMode] = useState(false);

  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();
  const { isGenerating, generateStudyPlan } = useStudyPlanGenerator();

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
    } else {
      toast({ title: t('studyPlan.couldNotGenerate'), description: t('studyPlan.tryAgain'), variant: 'destructive' });
    }
  };

  const handleSavePlan = async () => {
    if (!generatedPlan) return;
    try {
      setSaving(true);
      const { data: userData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        toast({ title: t('studyPlan.authError'), description: t('studyPlan.signInAgain'), variant: 'destructive' });
        return;
      }
      
      const userId = userData?.user?.id;
      if (!userId) {
        toast({ title: t('studyPlan.signInRequired'), description: t('studyPlan.signInToSave'), variant: 'destructive' });
        return;
      }

      console.log('Attempting to save study plan for user:', userId);
      
      const { data, error } = await supabase.from('study_plans').insert([
        {
          user_id: userId,
          title: generatedPlan.title,
          description: generatedPlan.description,
          weak_areas: generatedPlan.weakAreas,
          daily_lessons: generatedPlan.dailyLessons as any,
          estimated_duration: generatedPlan.estimatedDuration,
          difficulty_level: generatedPlan.difficultyLevel,
          grade_level: gradeLevel || null,
          region: region || null,
          status: 'saved'
        }
      ]).select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Study plan saved successfully:', data);
      toast({ 
        title: t('studyPlan.success'), 
        description: t('studyPlan.planSaved'),
      });
    } catch (e: any) {
      console.error('Save error details:', e);
      toast({ 
        title: t('studyPlan.failedToSave'), 
        description: e?.message || t('studyPlan.checkConnection'), 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStartPlan = async () => {
    navigate('/demo');
  };

  const handleBeginLearning = async (day: number) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      navigate('/demo');
      return;
    }
    navigate(`/modules?day=${day}`);
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
            Upload study material or graded quiz/test, or describe your weak areas to get a personalized study plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as 'file' | 'chat' | 'topic')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="file">Upload Material</TabsTrigger>
              <TabsTrigger value="chat">Describe Issues</TabsTrigger>
              <TabsTrigger value="topic">Select Topic</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Upload Material Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={uploadType === 'study_material' ? "default" : "outline"}
                      onClick={() => setUploadType('study_material')}
                      disabled={isGenerating}
                      className="justify-start"
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Study Material
                    </Button>
                    <Button
                      variant={uploadType === 'graded_quiz' ? "default" : "outline"}
                      onClick={() => setUploadType('graded_quiz')}
                      disabled={isGenerating}
                      className="justify-start"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Graded Quiz
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    {uploadType === 'study_material' ? 'Upload Study Material' : 'Upload Graded Quiz/Test'}
                  </Label>
                  <FileUploadZone
                    onFileUpload={handleFileUpload}
                    onFileRemove={handleFileRemove}
                    uploadedFile={uploadedFile}
                    acceptedFileTypes={['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png']}
                    disabled={isGenerating}
                  />
                </div>
              </div>
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
                type="number"
                min="1"
                max="180"
                value={Number.isNaN(maxDailyMinutes) ? '' : maxDailyMinutes}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setMaxDailyMinutes(NaN);
                  } else {
                    const n = parseInt(val, 10);
                    if (!Number.isNaN(n)) setMaxDailyMinutes(n);
                  }
                }}
onBlur={() => {
  if (Number.isNaN(maxDailyMinutes)) {
    // If left empty, reset to default 45
    setMaxDailyMinutes(45);
  } else {
    const clamped = Math.min(180, Math.max(1, maxDailyMinutes));
    setMaxDailyMinutes(clamped);
  }
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
                  {!mistakeBasedMode && (
                    <Badge className={getDifficultyColor(generatedPlan.difficultyLevel)}>
                      {generatedPlan.difficultyLevel}
                    </Badge>
                  )}
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
                          {lesson.exampleQuestions && lesson.exampleQuestions.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {lesson.exampleQuestions.length} example{lesson.exampleQuestions.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleBeginLearning(lesson.day)}
                          className="w-full"
                        >
                          Begin Learning
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
