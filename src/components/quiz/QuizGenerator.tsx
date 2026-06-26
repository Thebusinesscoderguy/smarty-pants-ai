
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Save, Trash2, FileQuestion, BookOpen, CheckCircle2 } from 'lucide-react';
import { useQuizGenerator, type Quiz } from '@/hooks/useQuizGenerator';
import { FileUploadZone } from './FileUploadZone';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const QG_DIFF_KEY: Record<string, string> = { easy: 'qg2.easy', medium: 'qg2.medium', hard: 'qg2.hard' };

interface QuizGeneratorProps {
  conversationHistory?: any[];
}

export const QuizGenerator = ({ conversationHistory }: QuizGeneratorProps) => {
  const { t } = useLanguage();
  const [inputMethod, setInputMethod] = useState<'topic' | 'file'>('topic');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'study_material' | 'graded_quiz'>('study_material');
  const [quizDifficulty, setQuizDifficulty] = useState<'easier' | 'same' | 'harder'>('same');
  const [gradeLevel, setGradeLevel] = useState<string>('');
  const [creatingPractice, setCreatingPractice] = useState(false);
  const [quizMode, setQuizMode] = useState<'take' | 'view'>('take');
  
  const { isGenerating, generateQuiz, saveQuiz, extractQuizFromFile, retakeLatestQuiz, quizFromLatestMistakes } = useQuizGenerator();

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
  };

  const handleCreateRetake = async () => {
    setCreatingPractice(true);
    try {
      if (!uploadedFile) return;
      
      const quiz = await extractQuizFromFile(uploadedFile, {
        difficulty: quizDifficulty === 'easier' ? 'easy' : quizDifficulty === 'harder' ? 'hard' : 'medium',
        questionCount: 5,
        gradeLevel,
        mode: 'extract',
        difficultyVariant: quizDifficulty,
      });
      if (!quiz) return;
      const savedId = await saveQuiz({ ...quiz, title: `${uploadedFile.name.split('.')[0]} ${t('qg2.suffixSame')}` });
      if (savedId) toast({ title: t('qg2.saved'), description: t('qg2.retakeSaved') });
    } catch (e: any) {
      toast({ title: t('qg2.failed'), description: e?.message || t('qg2.tryAgain'), variant: 'destructive' });
    } finally {
      setCreatingPractice(false);
    }
  };

  const handleCreateMistakes = async () => {
    setCreatingPractice(true);
    try {
      const quiz = await quizFromLatestMistakes();
      if (!quiz) return;
      const savedId = await saveQuiz({ ...quiz, title: `${quiz.title} ${t('qg2.suffixMistakes')}` });
      if (savedId) toast({ title: t('qg2.saved'), description: t('qg2.mistakesSaved') });
    } catch (e: any) {
      toast({ title: t('qg2.failed'), description: e?.message || t('qg2.tryAgain'), variant: 'destructive' });
    } finally {
      setCreatingPractice(false);
    }
  };

  const handleCreateMistakesSimilar = async () => {
    setCreatingPractice(true);
    try {
      const quiz = await quizFromLatestMistakes({ targetCount: 10 });
      if (!quiz) return;
      const savedId = await saveQuiz({ ...quiz, title: `${quiz.title} ${t('qg2.suffixSimilar')}` });
      if (savedId) toast({ title: t('qg2.saved'), description: t('qg2.mistakesSimilarSaved') });
    } catch (e: any) {
      toast({ title: t('qg2.failed'), description: e?.message || t('qg2.tryAgain'), variant: 'destructive' });
    } finally {
      setCreatingPractice(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (inputMethod === 'topic' && !topic.trim()) return;
    if (inputMethod === 'file' && !uploadedFile) return;

    let quiz;
    if (inputMethod === 'file') {
      quiz = await extractQuizFromFile(uploadedFile, {
        difficulty,
        questionCount,
        gradeLevel,
        mode: 'extract',
        difficultyVariant: 'same',
      });
    } else {
      quiz = await generateQuiz(topic, difficulty, questionCount, conversationHistory);
    }
    
    if (quiz) {
      setGeneratedQuiz(quiz);
    }
  };

  const handleSaveQuiz = async () => {
    if (!generatedQuiz) return;
    
    const quizId = await saveQuiz(generatedQuiz);
    if (quizId) {
      setGeneratedQuiz(null);
      setTopic('');
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5" />
            {t('qg2.generateQuiz')}
          </CardTitle>
          <CardDescription>
            {t('qg2.generateDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as 'topic' | 'file')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="topic">{t('qg2.enterTopic')}</TabsTrigger>
              <TabsTrigger value="file">{t('qg2.uploadMaterial')}</TabsTrigger>
            </TabsList>

            <TabsContent value="topic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">{t('qg2.quizTopic')}</Label>
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={t('qg2.topicPlaceholder')}
                    disabled={isGenerating}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="difficulty">{t('qg2.difficultyLevel')}</Label>
                  <Select value={difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('qg2.selectDifficulty')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">{t('qg2.easy')}</SelectItem>
                      <SelectItem value="medium">{t('qg2.medium')}</SelectItem>
                      <SelectItem value="hard">{t('qg2.hard')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="questionCount">{t('qg2.numQuestions')}</Label>
                  <Select value={questionCount.toString()} onValueChange={(value) => setQuestionCount(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quizMode">{t('qg2.quizMode')}</Label>
                  <Select value={quizMode} onValueChange={(value: 'take' | 'view') => setQuizMode(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('qg2.selectMode')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="take">{t('qg2.takeQuiz')}</SelectItem>
                      <SelectItem value="view">{t('qg2.viewAnswers')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {conversationHistory && conversationHistory.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    {t('qg2.convNote')}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="file" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>{t('qg2.uploadMaterialType')}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={uploadType === 'study_material' ? "default" : "outline"}
                      onClick={() => setUploadType('study_material')}
                      disabled={isGenerating}
                      className="justify-start"
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      {t('qg2.studyMaterial')}
                    </Button>
                    <Button
                      variant={uploadType === 'graded_quiz' ? "default" : "outline"}
                      onClick={() => setUploadType('graded_quiz')}
                      disabled={isGenerating}
                      className="justify-start"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {t('qg2.gradedQuiz')}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    {uploadType === 'study_material' ? t('qg2.uploadStudyMaterial') : t('qg2.uploadGradedQuiz')}
                  </Label>
                  <FileUploadZone
                    onFileUpload={handleFileUpload}
                    onFileRemove={handleFileRemove}
                    uploadedFile={uploadedFile}
                    acceptedFileTypes={['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png']}
                    disabled={isGenerating}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gradeLevel">{t('qg2.gradeLevel')}</Label>
                    <Select value={gradeLevel} onValueChange={setGradeLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('qg2.selectGradeLevel')} />
                      </SelectTrigger>
                      <SelectContent>
                        {[6,7,8,9,10,11,12].map(n => (
                          <SelectItem key={n} value={`Grade ${n}`}>{t('qg2.gradeWord')} {n}</SelectItem>
                        ))}
                        <SelectItem value="College">{t('qg2.college')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">{t('qg2.difficultyLevel')}</Label>
                    <Select value={difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('qg2.selectDifficulty')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">{t('qg2.easy')}</SelectItem>
                        <SelectItem value="medium">{t('qg2.medium')}</SelectItem>
                        <SelectItem value="hard">{t('qg2.hard')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="questionCount">{t('qg2.numQuestions')}</Label>
                    <Select value={questionCount.toString()} onValueChange={(value) => setQuestionCount(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quizMode">{t('qg2.quizMode')}</Label>
                    <Select value={quizMode} onValueChange={(value: 'take' | 'view') => setQuizMode(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('qg2.selectMode')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="take">{t('qg2.takeQuiz')}</SelectItem>
                        <SelectItem value="view">{t('qg2.viewAnswers')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {uploadedFile && uploadType === 'graded_quiz' && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>{t('qg2.relativeDifficulty')}</Label>
                      <Select value={quizDifficulty} onValueChange={(value: 'easier' | 'same' | 'harder') => setQuizDifficulty(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('qg2.selectDifficulty')} />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="easier">{t('qg2.easier')}</SelectItem>
                          <SelectItem value="same">{t('qg2.sameAsTest')}</SelectItem>
                          <SelectItem value="harder">{t('qg2.harder')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>{t('qg2.genOptions')}</Label>
                      <Select
                        onValueChange={async (value) => {
                          setCreatingPractice(true);
                          try {
                            if (!uploadedFile) return;
                            
                            let quiz;
                            let title;
                            
                            switch(value) {
                              case 'same_questions':
                                quiz = await extractQuizFromFile(uploadedFile, {
                                  difficulty: quizDifficulty === 'easier' ? 'easy' : quizDifficulty === 'harder' ? 'hard' : 'medium',
                                  questionCount: 5,
                                  gradeLevel,
                                  mode: 'extract',
                                  difficultyVariant: quizDifficulty,
                                });
                                title = `${uploadedFile.name.split('.')[0]} ${t('qg2.suffixSame')}`;
                                break;
                              case 'mistakes_only':
                                quiz = await quizFromLatestMistakes();
                                title = `${quiz?.title} ${t('qg2.suffixMistakes')}`;
                                break;
                              case 'questions_like_mistakes':
                                quiz = await quizFromLatestMistakes({ targetCount: 10 });
                                title = `${quiz?.title} ${t('qg2.suffixQLM')}`;
                                break;
                              case 'mistakes_similar':
                                quiz = await quizFromLatestMistakes({ targetCount: 10 });
                                title = `${quiz?.title} ${t('qg2.suffixSimilar')}`;
                                break;
                              case 'similar_quiz':
                                quiz = await extractQuizFromFile(uploadedFile, {
                                  difficulty: quizDifficulty === 'easier' ? 'easy' : quizDifficulty === 'harder' ? 'hard' : 'medium',
                                  questionCount: 10,
                                  gradeLevel,
                                  mode: 'similar',
                                  difficultyVariant: quizDifficulty,
                                });
                                title = `${uploadedFile.name.split('.')[0]} ${t('qg2.suffixSimilarQuiz')}`;
                                break;
                            }
                            
                            if (!quiz) return;
                            const savedId = await saveQuiz({ ...quiz, title });
                            if (savedId) toast({ title: t('qg2.saved'), description: t('qg2.quizSaved') });
                          } catch (e: any) {
                            toast({ title: t('qg2.failed'), description: e?.message || t('qg2.tryAgain'), variant: 'destructive' });
                          } finally {
                            setCreatingPractice(false);
                          }
                        }}
                        disabled={creatingPractice || isGenerating}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('qg2.selectGenOption')} />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="same_questions">{t('qg2.sameQuestions')}</SelectItem>
                          <SelectItem value="mistakes_only">{t('qg2.testFromMistakes')}</SelectItem>
                          <SelectItem value="questions_like_mistakes">{t('qg2.questionsLikeMistakes')}</SelectItem>
                          <SelectItem value="mistakes_similar">{t('qg2.mistakesPlusSimilar')}</SelectItem>
                          <SelectItem value="similar_quiz">{t('qg2.similarQuiz')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">{t('qg2.genNote')}</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <Button 
            onClick={handleGenerateQuiz} 
            disabled={
              isGenerating ||
              (inputMethod === 'topic' && !topic.trim()) ||
              (inputMethod === 'file' && !uploadedFile)
            }
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('qg2.generatingQuiz')}
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {t('qg2.generateQuiz')}
              </>
            )}
          </Button>
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
                  {QG_DIFF_KEY[generatedQuiz.difficulty] ? t(QG_DIFF_KEY[generatedQuiz.difficulty]) : generatedQuiz.difficulty}
                </Badge>
                <Badge variant="outline">
                  {generatedQuiz.questions.length} {t('qg2.questionsSuffix')}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {generatedQuiz.questions.map((question, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{t('qg2.questionPrefix')} {index + 1}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {question.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="mb-3">{question.question}</p>
                  
                  {question.options && (
                    <div className="space-y-1 mb-3">
                      {question.options.map((option, optIndex) => (
                        <div 
                          key={optIndex}
                          className={`p-2 rounded text-sm ${
                            option === question.correct_answer 
                              ? 'bg-green-100 text-green-800 font-medium' 
                              : 'bg-gray-50'
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}. {option}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {!question.options && (
                    <div className="p-2 bg-green-100 text-green-800 rounded text-sm font-medium mb-3">
                      {t('qg2.answer')} {question.correct_answer}
                    </div>
                  )}
                  
                  {question.explanation && (
                    <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                      <strong>{t('qg2.explanation')}</strong> {question.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveQuiz} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                {t('qg2.saveQuiz')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setGeneratedQuiz(null)}
                className="flex-1"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('qg2.discard')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
