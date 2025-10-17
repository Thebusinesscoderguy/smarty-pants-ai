import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileUploadZone } from './FileUploadZone';
import { Loader2, Plus, Save, Trash2, FileQuestion, Brain, BookOpen, CheckCircle2 } from 'lucide-react';
import { useQuizGenerator, type Quiz } from '@/hooks/useQuizGenerator';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface EnhancedQuizGeneratorProps {
  conversationHistory?: any[];
}

export const EnhancedQuizGenerator = ({ conversationHistory }: EnhancedQuizGeneratorProps) => {
  const [inputMethod, setInputMethod] = useState<'manual' | 'file' | 'ai'>('manual');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [gradeLevel, setGradeLevel] = useState<string>('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'study_material' | 'graded_quiz'>('study_material');
  const [quizDifficulty, setQuizDifficulty] = useState<'easier' | 'same' | 'harder'>('same');
  const [generationOption, setGenerationOption] = useState<'same_questions' | 'mistakes_only' | 'questions_like_mistakes' | 'mistakes_similar' | 'similar_quiz' | ''>('');
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
  
  const { t } = useLanguage();
  const { isGenerating, generateQuiz, saveQuiz, retakeLatestQuiz, quizFromLatestMistakes, extractQuizFromFile } = useQuizGenerator();

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
  };

  const handleGenerateQuiz = async () => {
    let quiz: Quiz | null = null;

    switch (inputMethod) {
      case 'manual':
        quiz = await generateQuiz(topic, difficulty, questionCount, conversationHistory, gradeLevel);
        break;
      
      case 'file':
        if (uploadType === 'graded_quiz' && generationOption) {
          // Apply selected generation option on submit
          if ((generationOption === 'same_questions' || generationOption === 'similar_quiz') && !uploadedFile) {
            toast({ title: 'Error', description: 'Please upload your graded quiz first.', variant: 'destructive' });
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
                toast({ title: 'Error', description: 'Please upload a file first.', variant: 'destructive' });
                return;
              }
              quiz = await extractQuizFromFile(uploadedFile, { difficulty, questionCount, gradeLevel });
              break;
          }
        } else {
          if (!uploadedFile) {
            toast({ title: 'Error', description: 'Please upload a file first.', variant: 'destructive' });
            return;
          }
          quiz = await extractQuizFromFile(uploadedFile, {
            difficulty,
            questionCount,
            gradeLevel,
          });
        }
        break;
      
      case 'ai':
        if (!customInstructions.trim()) {
          toast({ title: 'Error', description: 'Please provide AI instructions.', variant: 'destructive' });
          return;
        }
        quiz = await generateQuiz(customInstructions, difficulty, questionCount, conversationHistory, gradeLevel);
        break;
      
      default:
        toast({ title: 'Error', description: 'Invalid input method selected.', variant: 'destructive' });
        return;
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

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'hard': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const canGenerate = () => {
    let base = false;
    switch (inputMethod) {
      case 'manual':
        base = topic.trim().length > 0;
        break;
      case 'file':
        base = uploadedFile !== null;
        break;
      case 'ai':
        base = customInstructions.trim().length > 0;
        break;
      default:
        base = false;
    }
    return base && gradeLevel.trim().length > 0;
  };

  return (
    <div className="space-y-6">
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
                    <SelectContent>
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
                <Label>Upload Material Type</Label>
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
                    Study Material
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

              {uploadedFile && !generatedQuiz && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fileTopic">Topic (Optional)</Label>
                      <Input
                        id="fileTopic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Override detected topic..."
                        disabled={isGenerating}
                      />
                    </div>
                    
                    {uploadType === 'study_material' && (
                      <div className="space-y-2">
                        <Label htmlFor="fileDifficulty">Difficulty Level (Upload Type: {uploadType})</Label>
                        <Select value={difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {uploadType === 'graded_quiz' && (
                    <div className="space-y-3 p-3 border rounded-lg bg-muted/20">
                      <div className="text-sm font-medium">Quiz Generation Options (Upload Type: {uploadType})</div>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Quiz Difficulty Relative to Original</Label>
                          <Select value={quizDifficulty} onValueChange={(value: 'easier' | 'same' | 'harder') => setQuizDifficulty(value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent className="bg-background z-50">
                              <SelectItem value="easier">Easier</SelectItem>
                              <SelectItem value="same">Same as Test</SelectItem>
                              <SelectItem value="harder">Harder</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Quiz Generation Options</Label>
                          <Select 
                            value={generationOption}
                            onValueChange={(value) => setGenerationOption(value as 'same_questions' | 'mistakes_only' | 'questions_like_mistakes' | 'mistakes_similar' | 'similar_quiz')}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select quiz generation option" />
                            </SelectTrigger>
                            <SelectContent className="bg-background z-50">
                              <SelectItem value="same_questions">Same Quiz Questions</SelectItem>
                              <SelectItem value="mistakes_only">Test From Mistakes</SelectItem>
                              <SelectItem value="questions_like_mistakes">Questions Like Mistakes</SelectItem>
                              <SelectItem value="mistakes_similar">Mistakes + Similar</SelectItem>
                              <SelectItem value="similar_quiz">Similar Quiz</SelectItem>
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
                <Label htmlFor="instructions">Custom AI Instructions</Label>
                <Textarea
                  id="instructions"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Describe exactly what kind of quiz you want. For example: 'Create a quiz about the American Civil War focusing on battles and key figures, with scenario-based questions that test critical thinking rather than memorization.'"
                  rows={4}
                  disabled={isGenerating}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aiTopic">Topic (Optional)</Label>
                  <Input
                    id="aiTopic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Main subject area..."
                    disabled={isGenerating}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="aiDifficulty">Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="gradeLevel">{t('quizGenerator.gradeLevel')}</Label>
            <Select value={gradeLevel} onValueChange={setGradeLevel}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder={t('quizGenerator.selectGrade')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Grade 1">Grade 1</SelectItem>
                <SelectItem value="Grade 2">Grade 2</SelectItem>
                <SelectItem value="Grade 3">Grade 3</SelectItem>
                <SelectItem value="Grade 4">Grade 4</SelectItem>
                <SelectItem value="Grade 5">Grade 5</SelectItem>
                <SelectItem value="Grade 6">Grade 6</SelectItem>
                <SelectItem value="Grade 7">Grade 7</SelectItem>
                <SelectItem value="Grade 8">Grade 8</SelectItem>
                <SelectItem value="Grade 9">Grade 9</SelectItem>
                <SelectItem value="Grade 10">Grade 10</SelectItem>
                <SelectItem value="Grade 11">Grade 11</SelectItem>
                <SelectItem value="Grade 12">Grade 12</SelectItem>
                <SelectItem value="College">College</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="questionCount">{t('quizGenerator.numberOfQuestions')}</Label>
            <Input
              id="questionCount"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={String(questionCount)}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, '');
                const num = Math.max(1, Math.min(50, parseInt(v || '0', 10)));
                setQuestionCount(num);
              }}
              className="w-32"
            />
          </div>

          {conversationHistory && conversationHistory.length > 0 && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-600">
                 This quiz will incorporate context from your recent conversation
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
            <div className="space-y-4">
              {generatedQuiz.questions.map((question, index) => (
                <div key={index} className="p-4 border rounded-lg bg-card">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">Question {index + 1}</h4>
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
                              ? 'bg-green-500/10 text-green-600 border border-green-500/20 font-medium' 
                              : 'bg-muted/50'
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}. {option}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {!question.options && (
                    <div className="p-2 bg-green-500/10 text-green-600 border border-green-500/20 rounded text-sm font-medium mb-3">
                      Answer: {question.correct_answer}
                    </div>
                  )}
                  
                  {question.explanation && (
                    <div className="text-sm text-muted-foreground bg-blue-500/10 border border-blue-500/20 p-2 rounded">
                      <strong>Explanation:</strong> {question.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {inputMethod === 'file' && (
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
