import React, { useState, useEffect, useRef } from 'react';
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
import { Loader2, BookOpen, Target, Calendar, TrendingUp, CheckCircle2, AlertCircle, Upload, Brain, FileDown, Presentation } from 'lucide-react';
import { FileUploadZone } from './FileUploadZone';
import { useStudyPlanGenerator } from '@/hooks/useStudyPlanGenerator';
import { useQuizGenerator } from '@/hooks/useQuizGenerator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PDFStudyPlanButton } from '@/components/study-plan/PDFStudyPlanButton';
import { PresentationButton } from '@/components/study-plan/PresentationButton';
import { useGuestUsage } from '@/hooks/useGuestUsage';

interface StudyPlan {
  id: string;
  title: string;
  description: string;
  weakAreas: string[];
  dailyLessons: DailyLesson[];
  estimatedDuration: number;
  difficultyLevel: 'easy' | 'medium' | 'hard';
}

interface DailyLesson {
  day: number;
  topic: string;
  description: string;
  activities: string[];
  estimatedTime: number;
  exampleQuestions?: Array<{
    question: string;
    solution: string;
  }>;
}

type FileType = 'pdf' | 'image' | 'docx' | 'text';

function getFileType(fileName: string): FileType {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (['doc', 'docx'].includes(ext)) return 'docx';
  return 'text';
}

export const StudyPlanGenerator = ({ autoGenerate }: { autoGenerate?: { inputMethod: 'file' | 'chat' | 'topic'; input: string; gradeLevel?: string; region?: string; days?: number; maxDailyMinutes?: number } }) => {
  const { t, language } = useLanguage();
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
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [creatingQuizDay, setCreatingQuizDay] = useState<number | null>(null);
  const navigate = useNavigate();
  const { isGenerating, generateStudyPlan } = useStudyPlanGenerator();
  const { generateQuiz, isGenerating: isGeneratingQuiz } = useQuizGenerator();
  const { canGenerate: canGuestGenerate, recordUsage } = useGuestUsage();
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const [attemptedDay, setAttemptedDay] = useState<number | null>(null);
  const autoRanRef = useRef(false);

  useEffect(() => {
    if (autoGenerate && !autoRanRef.current) {
      autoRanRef.current = true;
      setInputMethod('chat');
      setChatInput(autoGenerate.input);
      setSelectedTopic('');
      setAiChooseDays(true);
      setAiChooseDailyMinutes(true);
      generateStudyPlan(autoGenerate.input, autoGenerate.inputMethod, {
        gradeLevel: undefined,
        region: undefined,
        days: undefined,
        maxDailyMinutes: undefined,
      }).then((plan) => {
        if (plan) setGeneratedPlan(plan as any);
      }).catch(() => {});
    }
  }, [autoGenerate]);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
    setUploadProgress(0);
  };

  const uploadFileToStorage = async (file: File): Promise<{ signedUrl: string; fileType: FileType } | null> => {
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      // Get user ID or generate anonymous ID for folder structure
      const { data: userData } = await supabase.auth.getUser();
      const folderId = userData?.user?.id || crypto.randomUUID();
      
      // Create unique file path
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${folderId}/${timestamp}-${sanitizedFileName}`;
      
      setUploadProgress(30);
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('study_materials')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      setUploadProgress(70);
      
      // Create signed URL (valid for 1 hour)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('study_materials')
        .createSignedUrl(filePath, 3600);
      
      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error('Signed URL error:', signedUrlError);
        throw new Error('Failed to create access URL for file');
      }
      
      setUploadProgress(100);
      
      const fileType = getFileType(file.name);
      console.log(`File uploaded successfully: ${filePath}, type: ${fileType}, size: ${file.size} bytes`);
      
      return {
        signedUrl: signedUrlData.signedUrl,
        fileType
      };
    } catch (error: any) {
      console.error('File upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload file. Please try again.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!canGuestGenerate('study_plan')) {
      setAttemptedDay(null);
      setShowSignInDialog(true);
      return;
    }
    let inputData = '';
    let inputType = inputMethod;
    let fileUrl: string | undefined;
    let fileType: FileType | undefined;

    switch (inputMethod) {
      case 'file':
        if (!uploadedFile) return;
        
        // Upload file to Supabase Storage first
        const uploadResult = await uploadFileToStorage(uploadedFile);
        if (!uploadResult) return;
        
        fileUrl = uploadResult.signedUrl;
        fileType = uploadResult.fileType;
        inputData = uploadedFile.name;
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

    const plan = await generateStudyPlan(inputData, inputType, { 
      gradeLevel, 
      region, 
      days: aiChooseDays ? undefined : planDays, 
      maxDailyMinutes: aiChooseDailyMinutes ? undefined : maxDailyMinutes,
      fileUrl,
      fileType
    });
    
    if (plan) {
      recordUsage('study_plan');
      setGeneratedPlan(plan);
      setUploadProgress(0);
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
    try {
      setStarting(true);
      await handleBeginLearning(1);
    } finally {
      setStarting(false);
    }
  };

  const handleBeginLearning = async (day: number) => {
    const { data: userData } = await supabase.auth.getUser();
    const isGuest = !userData?.user;
    if (isGuest) {
      if (day === 1 && generatedPlan) {
        try {
          localStorage.setItem('guest_study_plan', JSON.stringify(generatedPlan));
          localStorage.setItem('active_study_plan_id', 'guest');
        } catch {}
        navigate(`/modules?day=1`);
        return;
      }
      setAttemptedDay(day);
      setShowSignInDialog(true);
      return;
    }
    if (generatedPlan) {
      try {
        localStorage.setItem('guest_study_plan', JSON.stringify(generatedPlan));
        localStorage.setItem('active_study_plan_id', 'guest');
      } catch {}
    }
    navigate(`/modules?day=${day}`);
  };

  const handleTakeQuiz = async (lesson: DailyLesson) => {
    setCreatingQuizDay(lesson.day);
    try {
      const quizPrompt = `Create a quiz for: ${lesson.topic}

Description: ${lesson.description}

Activities covered: ${lesson.activities?.join(', ') || 'General topic coverage'}

Please generate 5 questions that test understanding of this topic.`;

      const quiz = await generateQuiz(quizPrompt, 'medium', 5);

      if (quiz) {
        toast({
          title: 'Quiz created!',
          description: `Generated quiz for Day ${lesson.day}: ${lesson.topic}`,
        });
        navigate('/quiz-generator');
      }
    } catch (e: any) {
      console.error('Error creating quiz:', e);
      toast({
        title: 'Failed to create quiz',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreatingQuizDay(null);
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
    { key: 'subject.algebra1', label: 'Algebra 1' },
    { key: 'subject.algebra2', label: 'Algebra 2' },
    { key: 'subject.geometry', label: 'Geometry' },
    { key: 'subject.precalculus', label: 'Precalculus' },
    { key: 'subject.calculusAB', label: 'Calculus AB' },
    { key: 'subject.calculusBC', label: 'Calculus BC' },
    { key: 'subject.physics', label: 'Physics' },
    { key: 'subject.chemistry', label: 'Chemistry' },
    { key: 'subject.biology', label: 'Biology' },
    { key: 'subject.usHistory', label: 'US History' },
    { key: 'subject.worldHistory', label: 'World History' },
    { key: 'subject.civics', label: 'Civics/Government' },
    { key: 'subject.englishGrammar', label: 'English Grammar' },
    { key: 'subject.literature', label: 'Literature' },
    { key: 'subject.spanishI', label: 'Spanish I' },
    { key: 'subject.spanishII', label: 'Spanish II' },
    { key: 'subject.computerScience', label: 'Computer Science' },
    { key: 'subject.satMath', label: 'SAT Math' },
    { key: 'subject.satReading', label: 'SAT Reading' },
  ];

  const isProcessing = isGenerating || isUploading;

  return (
    <div className="space-y-6">
      <Dialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{attemptedDay ? t('studyPlan.unlockMoreDays') : (language === 'ar' ? 'سجل دخولك للمتابعة' : 'Sign in to continue')}</DialogTitle>
            <DialogDescription>
              {attemptedDay 
                ? `${t('studyPlan.signInToStart')} ${attemptedDay}. ${t('studyPlan.guestDay1')}`
                : (language === 'ar' 
                  ? 'لقد استخدمت خطة الدراسة المجانية. سجل دخولك لإنشاء المزيد.'
                  : 'You\'ve used your free study plan. Sign in to generate more.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSignInDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => navigate('/auth')}>
              {t('studyPlan.signIn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t('studyPlan.generator')}
          </CardTitle>
          <CardDescription>
            {t('studyPlan.generatorDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as 'file' | 'chat' | 'topic')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="file">{t('studyPlan.uploadMaterial')}</TabsTrigger>
              <TabsTrigger value="chat">{t('studyPlan.describeIssues')}</TabsTrigger>
              <TabsTrigger value="topic">{t('studyPlan.selectTopic')}</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>{t('studyPlan.uploadMaterialType')}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={uploadType === 'study_material' ? "default" : "outline"}
                      onClick={() => setUploadType('study_material')}
                      disabled={isProcessing}
                      className="justify-start"
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      {t('studyPlan.studyMaterial')}
                    </Button>
                    <Button
                      variant={uploadType === 'graded_quiz' ? "default" : "outline"}
                      onClick={() => setUploadType('graded_quiz')}
                      disabled={isProcessing}
                      className="justify-start"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {t('studyPlan.gradedQuiz')}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    {uploadType === 'study_material' ? t('studyPlan.uploadStudyMaterial') : t('studyPlan.uploadGradedQuiz')}
                  </Label>
                  <FileUploadZone
                    onFileUpload={handleFileUpload}
                    onFileRemove={handleFileRemove}
                    uploadedFile={uploadedFile}
                    acceptedFileTypes={['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png']}
                    maxFileSize={100 * 1024 * 1024}
                    disabled={isProcessing}
                  />
                  
                  {/* Upload progress indicator */}
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Upload className="h-4 w-4 animate-pulse" />
                        <span>{t('studyPlan.uploadingFile')}</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chat" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chatInput">{t('studyPlan.describeStruggle')}</Label>
                <Textarea
                  id="chatInput"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={t('studyPlan.describePlaceholder')}
                  rows={4}
                  disabled={isProcessing}
                />
              </div>
            </TabsContent>

            <TabsContent value="topic" className="space-y-4">
              <div className="space-y-2">
                <Label>{t('studyPlan.selectSubjectArea')}</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {popularTopics.map((topic) => (
                    <Button
                      key={topic.label}
                      variant={selectedTopic === topic.label ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTopic(selectedTopic === topic.label ? '' : topic.label)}
                      disabled={isProcessing}
                    >
                      {t(topic.key)}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Grade level, region, plan constraints */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gradeLevel">{t('studyPlan.gradeLevel')}</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger>
                  <SelectValue placeholder={t('studyPlan.selectGradeLevel')} />
                </SelectTrigger>
                <SelectContent>
                  {['Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12','College'].map(gl => (
                    <SelectItem key={gl} value={gl}>{gl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">{t('studyPlan.curriculum')}</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue placeholder={t('studyPlan.selectCurriculum')} />
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
                <Label htmlFor="planDays">{t('studyPlan.planLength')}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t('studyPlan.aiDecide')}</span>
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
                <Label htmlFor="maxDailyMinutes">{t('studyPlan.maxStudyTime')}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t('studyPlan.aiDecide')}</span>
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
                    setMaxDailyMinutes(45);
                  }
                }}
                disabled={aiChooseDailyMinutes}
              />
            </div>
          </div>

          <Button 
            onClick={handleGeneratePlan}
            disabled={isProcessing || (inputMethod === 'file' && !uploadedFile) || (inputMethod === 'chat' && !chatInput.trim()) || (inputMethod === 'topic' && !selectedTopic.trim())}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-pulse" />
                {t('studyPlan.uploadingFile')}
              </>
            ) : isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('studyPlan.generating')}
              </>
            ) : (
              t('studyPlan.generate')
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedPlan && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {generatedPlan.title}
                </CardTitle>
                <CardDescription className="mt-2">
                  {generatedPlan.description}
                </CardDescription>
              </div>
              <Badge className={getDifficultyColor(generatedPlan.difficultyLevel)}>
                {generatedPlan.difficultyLevel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Start, Save, and Export buttons */}
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleStartPlan} 
                disabled={starting}
                className="flex-1 min-w-[140px] bg-orange-500 hover:bg-orange-600 text-white"
              >
                {starting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  'Start Study Plan'
                )}
              </Button>
              <Button 
                onClick={handleSavePlan}
                disabled={saving}
                className="flex-1 min-w-[140px] bg-orange-500 hover:bg-orange-600 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Plan'
                )}
              </Button>
            </div>
            
            {/* Export Options */}
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <PDFStudyPlanButton variant="outline" size="sm" />
              <PresentationButton variant="outline" size="sm" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 mx-auto mb-2" />
                <p className="text-2xl font-bold">{generatedPlan.estimatedDuration}</p>
                <p className="text-sm text-muted-foreground">Days</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Target className="h-5 w-5 mx-auto mb-2" />
                <p className="text-2xl font-bold">{generatedPlan.weakAreas?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Focus Areas</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <BookOpen className="h-5 w-5 mx-auto mb-2" />
                <p className="text-2xl font-bold">{generatedPlan.dailyLessons?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Lessons</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <TrendingUp className="h-5 w-5 mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {generatedPlan.dailyLessons?.reduce((sum, l) => sum + (l.estimatedTime || 0), 0) || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Minutes</p>
              </div>
            </div>

            {generatedPlan.weakAreas && generatedPlan.weakAreas.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Areas to Focus On
                </h4>
                <div className="flex flex-wrap gap-2">
                  {generatedPlan.weakAreas.map((area, idx) => (
                    <Badge key={idx} variant="secondary">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-medium mb-3">Daily Lessons</h4>
              <div className="space-y-3">
                {generatedPlan.dailyLessons?.map((lesson, idx) => (
                  <Card key={idx} className="border-l-4 border-orange-400">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-medium">Day {lesson.day}</Badge>
                        <h5 className="font-semibold">{lesson.topic}</h5>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {lesson.description}
                      </p>
                      {lesson.activities && lesson.activities.length > 0 && (
                        <div className="space-y-1 mb-4">
                          {lesson.activities.map((activity, aIdx) => (
                            <div key={aIdx} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                              <span>{activity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleBeginLearning(lesson.day)}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                        >
                          Begin Learning
                        </Button>
                        <Button 
                          onClick={() => handleTakeQuiz(lesson)}
                          disabled={creatingQuizDay === lesson.day || isGeneratingQuiz}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                        >
                          <Brain className="mr-2 h-4 w-4" />
                          {creatingQuizDay === lesson.day ? 'Creating...' : 'Take Quiz'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

          </CardContent>
        </Card>
      )}
    </div>
  );
};
