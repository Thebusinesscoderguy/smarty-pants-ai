import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileUploadZone } from './FileUploadZone';
import { GenerationProgress } from '@/components/ui/generation-progress';
import { Loader2, Plus, Save, Trash2, FileQuestion, Brain, BookOpen, CheckCircle2 } from 'lucide-react';
import { useQuizGenerator, type Quiz } from '@/hooks/useQuizGenerator';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGuestUsage } from '@/hooks/useGuestUsage';
import { useNavigate } from 'react-router-dom';

interface EnhancedQuizGeneratorProps {
  conversationHistory?: any[];
  auto?: { mode: 'manual' | 'ai' | 'file'; topic?: string; instructions?: string; difficulty?: 'easy' | 'medium' | 'hard'; questionCount?: number; gradeLevel?: string };
}

export const EnhancedQuizGenerator = ({ conversationHistory, auto }: EnhancedQuizGeneratorProps) => {
  const [inputMethod, setInputMethod] = useState<'manual' | 'file' | 'ai'>('manual');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCountInput, setQuestionCountInput] = useState('5');
  const getQuestionCount = () => Math.max(1, Math.min(50, parseInt(questionCountInput || '5', 10)));
  const [gradeLevel, setGradeLevel] = useState<string>('');
  // curriculum removed
  const [customInstructions, setCustomInstructions] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'study_material' | 'graded_quiz'>('study_material');
  const [quizDifficulty, setQuizDifficulty] = useState<'easier' | 'same' | 'harder'>('same');
  const [generationOption, setGenerationOption] = useState<'same_questions' | 'mistakes_only' | 'questions_like_mistakes' | 'mistakes_similar' | 'similar_quiz' | ''>('');
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
  const [showSignInDialog, setShowSignInDialog] = useState(false);
const autoRanRef = useRef(false);
  
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { isGenerating, generateQuiz, saveQuiz, retakeLatestQuiz, quizFromLatestMistakes, extractQuizFromFile } = useQuizGenerator();
  const { canGenerate: canGuestGenerate, recordUsage, isGuest } = useGuestUsage();

useEffect(() => {
  if (auto && !autoRanRef.current) {
    autoRanRef.current = true;
    if (auto.mode === 'manual') {
      setInputMethod('manual');
      if (auto.topic) setTopic(auto.topic);
      if (auto.difficulty) setDifficulty(auto.difficulty);
      if (auto.questionCount) setQuestionCountInput(String(auto.questionCount));
      // Trigger generation directly without requiring grade level
      generateQuiz(auto.topic || '', auto.difficulty || 'medium', auto.questionCount || 5, conversationHistory, undefined)
        .then((q) => q && setGeneratedQuiz(q))
        .catch(() => {});
    } else if (auto.mode === 'ai') {
      setInputMethod('ai');
      if (auto.instructions) setCustomInstructions(auto.instructions);
      generateQuiz(auto.instructions || '', auto.difficulty || 'medium', auto.questionCount || 5, conversationHistory, undefined)
        .then((q) => q && setGeneratedQuiz(q))
        .catch(() => {});
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [auto]);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
  };

  const handleGenerateQuiz = async () => {
    if (!canGuestGenerate('quiz')) {
      setShowSignInDialog(true);
      return;
    }
    let quiz: Quiz | null = null;

      switch (inputMethod) {
        case 'manual':
          quiz = await generateQuiz(topic, difficulty, getQuestionCount(), conversationHistory, gradeLevel);
          break;
        
        case 'file':
          if (uploadType === 'graded_quiz' && generationOption) {
            // Apply selected generation option on submit
            if ((generationOption === 'same_questions' || generationOption === 'similar_quiz') && !uploadedFile) {
              toast({ title: t('quizGenerator.error'), description: t('quizGenerator.errorDesc'), variant: 'destructive' });
              return;
            }

            switch (generationOption) {
              case 'same_questions':
                quiz = await extractQuizFromFile(uploadedFile as File, {
                  difficulty: quizDifficulty === 'easier' ? 'easy' : quizDifficulty === 'harder' ? 'hard' : 'medium',
                  questionCount: 5,
                  gradeLevel,
                });
                break;
              case 'mistakes_only':
                quiz = await quizFromLatestMistakes();
                break;
              case 'questions_like_mistakes':
                quiz = await quizFromLatestMistakes({ targetCount: 10 });
                break;
              case 'mistakes_similar':
                quiz = await quizFromLatestMistakes({ targetCount: 10 });
                break;
              case 'similar_quiz':
                quiz = await extractQuizFromFile(uploadedFile as File, {
                  difficulty: quizDifficulty === 'easier' ? 'easy' : quizDifficulty === 'harder' ? 'hard' : 'medium',
                  questionCount: 10,
                  gradeLevel,
                });
                break;
              default:
                // Fallback to default extraction if none selected
                if (!uploadedFile) {
                  toast({ title: t('quizGenerator.error'), description: t('quizGenerator.errorDesc'), variant: 'destructive' });
                  return;
                }
                quiz = await extractQuizFromFile(uploadedFile, { difficulty, questionCount: getQuestionCount(), gradeLevel });
                break;
            }
          } else {
            if (!uploadedFile) {
              toast({ title: t('quizGenerator.error'), description: t('quizGenerator.errorDesc'), variant: 'destructive' });
              return;
            }
            quiz = await extractQuizFromFile(uploadedFile, {
              difficulty,
              questionCount: getQuestionCount(),
              gradeLevel,
            });
          }
          break;
        
        case 'ai':
          if (!customInstructions.trim()) {
            toast({ title: t('quizGenerator.error'), description: t('quizGenerator.errorInstructions'), variant: 'destructive' });
            return;
          }
          quiz = await generateQuiz(customInstructions, difficulty, getQuestionCount(), conversationHistory, gradeLevel);
          break;
        
        default:
          toast({ title: t('quizGenerator.error'), description: t('quizGenerator.invalidMethod'), variant: 'destructive' });
          return;
      }

    if (quiz) {
      recordUsage('quiz');
      setGeneratedQuiz(quiz);
    }
  };

  const handleSaveQuiz = async () => {
    if (!generatedQuiz) return;
    const quizId = await saveQuiz(generatedQuiz);
    if (quizId) {
      setGeneratedQuiz(null);
      setTopic('');
      setCustomInstructions('');
      setUploadedFile(null);
    }
  };

  const [creatingPractice, setCreatingPractice] = useState(false);

  const handleCreateRetake = async () => {
    setCreatingPractice(true);
    try {
      const quiz = await retakeLatestQuiz();
      if (!quiz) return;
      const savedId = await saveQuiz({ ...quiz, title: `${quiz.title} (Retake)` });
      if (savedId) toast({ title: t('quizGenerator.saved'), description: t('quizGenerator.retakeSaved') });
    } catch (e: any) {
      toast({ title: t('quizGenerator.failed'), description: e?.message || t('studyPlan.tryAgain'), variant: 'destructive' });
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
      if (savedId) toast({ title: t('quizGenerator.saved'), description: 'Mistakes-only quiz saved to your Library.' });
    } catch (e: any) {
      toast({ title: t('quizGenerator.failed'), description: e?.message || t('studyPlan.tryAgain'), variant: 'destructive' });
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
      if (savedId) toast({ title: t('quizGenerator.saved'), description: 'Mistakes + similar questions quiz saved to your Library.' });
    } catch (e: any) {
      toast({ title: t('quizGenerator.failed'), description: e?.message || t('studyPlan.tryAgain'), variant: 'destructive' });
    } finally {
      setCreatingPractice(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'hard': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const canGenerate = () => {
    switch (inputMethod) {
      case 'manual':
        return topic.trim().length > 0;
      case 'file':
        return uploadedFile !== null;
      case 'ai':
        return customInstructions.trim().length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      <Dialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('quizGenerator.signInRequired') || 'Sign in to continue'}</DialogTitle>
            <DialogDescription>
              {language === 'ar' 
                ? 'لقد استخدمت الاختبار المجاني. سجل دخولك لإنشاء المزيد من الاختبارات.'
                : 'You\'ve used your free quiz. Sign in to generate more quizzes.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSignInDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => navigate('/auth')}>
              {t('studyPlan.signIn') || 'Sign In'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5" />
            {t('quizGenerator.title')}
          </CardTitle>
          <CardDescription>
            {t('quizGenerator.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as 'manual' | 'file' | 'ai')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="manual">{t('quizGenerator.topicBased')}</TabsTrigger>
              <TabsTrigger value="file">{t('quizGenerator.uploadMaterial')}</TabsTrigger>
              <TabsTrigger value="ai">{t('quizGenerator.aiInstructions')}</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">{t('quizGenerator.quizTopic')}</Label>
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={t('quizGenerator.topicPlaceholder')}
                    disabled={isGenerating}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="difficulty">{t('quizGenerator.difficultyLevel')}</Label>
                  <Select value={difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="easy">{t('quizGenerator.easy')}</SelectItem>
                      <SelectItem value="medium">{t('quizGenerator.medium')}</SelectItem>
                      <SelectItem value="hard">{t('quizGenerator.hard')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="file" className="space-y-4">
              <div className="space-y-3">
                <Label>{t('quizGenerator.uploadMaterialType')}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={uploadType === 'study_material' ? "default" : "outline"}
                    onClick={() => {
                      console.log('Setting uploadType to study_material');
                      setUploadType('study_material');
                    }}
                    disabled={isGenerating}
                    className="justify-start"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    {t('quizGenerator.studyMaterial')}
                  </Button>
                  <Button
                    variant={uploadType === 'graded_quiz' ? "default" : "outline"}
                    onClick={() => {
                      console.log('Setting uploadType to graded_quiz');
                      setUploadType('graded_quiz');
                    }}
                    disabled={isGenerating}
                    className="justify-start"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {t('quizGenerator.gradedQuiz')}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  {uploadType === 'study_material' ? t('quizGenerator.uploadStudyMaterial') : t('quizGenerator.uploadGradedQuiz')}
                </Label>
                <FileUploadZone
                  onFileUpload={handleFileUpload}
                  onFileRemove={handleFileRemove}
                  uploadedFile={uploadedFile}
                  acceptedFileTypes={['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png']}
                  disabled={isGenerating}
                />
              </div>

              {uploadedFile && !generatedQuiz && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fileTopic">{t('quizGenerator.topicOptional')}</Label>
                      <Input
                        id="fileTopic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder={t('quizGenerator.overrideDetectedTopic')}
                        disabled={isGenerating}
                      />
                    </div>
                    
                    {uploadType === 'study_material' && (
                      <div className="space-y-2">
                        <Label htmlFor="fileDifficulty">{t('quizGenerator.difficultyLevel')}</Label>
                        <Select value={difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('quizGenerator.difficultyLevel')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">{t('quizGenerator.easy')}</SelectItem>
                            <SelectItem value="medium">{t('quizGenerator.medium')}</SelectItem>
                            <SelectItem value="hard">{t('quizGenerator.hard')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {uploadType === 'graded_quiz' && (
                    <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
                      <div className="text-sm font-medium">{t('quizGenerator.advancedGeneration')}</div>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>{t('quizGenerator.quizDifficultyRelative')}</Label>
                          <Select value={quizDifficulty} onValueChange={(value: 'easier' | 'same' | 'harder') => setQuizDifficulty(value)}>
                            <SelectTrigger>
                              <SelectValue placeholder={t('quizGenerator.difficultyLevel')} />
                            </SelectTrigger>
                            <SelectContent className="bg-background z-50">
                              <SelectItem value="easier">{t('quizGenerator.easier')}</SelectItem>
                              <SelectItem value="same">{t('quizGenerator.same')}</SelectItem>
                              <SelectItem value="harder">{t('quizGenerator.harder')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>{t('quizGenerator.advancedGeneration')}</Label>
                          <Select 
                            value={generationOption}
                            onValueChange={(value) => setGenerationOption(value as 'same_questions' | 'mistakes_only' | 'questions_like_mistakes' | 'mistakes_similar' | 'similar_quiz')}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('quizGenerator.advancedGeneration')} />
                            </SelectTrigger>
                            <SelectContent className="bg-background z-50">
                              <SelectItem value="same_questions">{t('quizGenerator.sameQuizQuestions')}</SelectItem>
                              <SelectItem value="mistakes_only">{t('quizGenerator.testFromMistakes')}</SelectItem>
                              <SelectItem value="questions_like_mistakes">{t('quizGenerator.questionsLikeMistakes')}</SelectItem>
                              <SelectItem value="mistakes_similar">{t('quizGenerator.mistakesSimilar')}</SelectItem>
                              <SelectItem value="similar_quiz">{t('quizGenerator.similarQuiz')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instructions">{t('quizGenerator.customInstructions')}</Label>
                <Textarea
                  id="instructions"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder={t('quizGenerator.customInstructionsPlaceholder')}
                  rows={4}
                  disabled={isGenerating}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aiTopic">{t('quizGenerator.topicOptional')}</Label>
                  <Input
                    id="aiTopic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={t('quizGenerator.topicPlaceholder')}
                    disabled={isGenerating}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="aiDifficulty">{t('quizGenerator.difficultyLevel')}</Label>
                  <Select value={difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('quizGenerator.difficultyLevel')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">{t('quizGenerator.easy')}</SelectItem>
                      <SelectItem value="medium">{t('quizGenerator.medium')}</SelectItem>
                      <SelectItem value="hard">{t('quizGenerator.hard')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Shared settings for all input methods */}
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-2">
                <Label>{t('quizGenerator.gradeLevel')}</Label>
                <Select value={gradeLevel} onValueChange={setGradeLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('quizGenerator.selectGrade')} />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'College'].map(gl => (
                      <SelectItem key={gl} value={gl}>{gl}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('quizGenerator.numberOfQuestions')} (max 50)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={questionCountInput}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, '');
                    setQuestionCountInput(v);
                  }}
                  onBlur={() => {
                    const num = parseInt(questionCountInput || '0', 10);
                    if (num > 50) setQuestionCountInput('50');
                    else if (num < 1 && questionCountInput !== '') setQuestionCountInput('1');
                  }}
                  placeholder="5"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {conversationHistory && conversationHistory.length > 0 && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-600">
                {t('quizGenerator.conversationContext')}
              </p>
            </div>
          )}

          <Button 
            onClick={handleGenerateQuiz} 
            disabled={!canGenerate() || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                {t('quizGenerator.generateQuiz')}
              </>
            )}
          </Button>

          <GenerationProgress
            isGenerating={isGenerating}
            estimatedSeconds={25}
            label={language === 'ar' ? 'جاري إنشاء الاختبار...' : 'Generating your quiz...'}
          />
        </CardContent>
      </Card>

      {generatedQuiz && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{generatedQuiz.title}</CardTitle>
                <CardDescription>{generatedQuiz.description}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getDifficultyColor(generatedQuiz.difficulty)}>
                  {generatedQuiz.difficulty}
                </Badge>
                <Badge variant="outline">
                  {generatedQuiz.questions.length} questions
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 mx-auto text-primary" />
              <div>
                <h3 className="text-lg font-semibold">{t('quizGenerator.quizReady')}</h3>
                <p className="text-muted-foreground">
                  {generatedQuiz.questions.length} {t('quizGenerator.questionsGenerated')}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('quizGenerator.saveToTake')}
              </p>
            </div>

            {inputMethod === 'file' && uploadType === 'graded_quiz' && (
              <div className="space-y-3 pt-4">
                <div className="text-sm font-medium">Practice options from your last quiz</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Button onClick={handleCreateRetake} disabled={creatingPractice || isGenerating}>
                    {creatingPractice ? 'Working…' : 'Save Retake Quiz to Library'}
                  </Button>
                  <Button variant="outline" onClick={handleCreateMistakes} disabled={creatingPractice || isGenerating}>
                    {creatingPractice ? 'Working…' : 'Save Mistakes-only Quiz'}
                  </Button>
                  <Button variant="outline" onClick={handleCreateMistakesSimilar} disabled={creatingPractice || isGenerating}>
                    {creatingPractice ? 'Working…' : 'Save Mistakes + Similar Quiz'}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveQuiz} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                Save Quiz
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setGeneratedQuiz(null)}
                className="flex-1"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Discard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
