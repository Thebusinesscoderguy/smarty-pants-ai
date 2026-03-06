import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, Zap, TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle, RotateCcw, Trophy, Save } from 'lucide-react';
import { useAdaptiveQuiz, type DifficultyLevel, type AdaptiveQuizConfig, type AdaptiveQuestion } from '@/hooks/useAdaptiveQuiz';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const GRADE_LEVEL_KEYS = [
  'grade1', 'grade2', 'grade3', 'grade4', 'grade5', 'grade6',
  'grade7', 'grade8', 'grade9', 'grade10', 'grade11', 'grade12',
  'collegeFreshman', 'collegeSophomore', 'collegeJunior', 'collegeSenior', 'graduate'
];

const DIFFICULTY_KEYS: { value: DifficultyLevel; color: string }[] = [
  { value: 'very_easy', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  { value: 'easy', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  { value: 'medium', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  { value: 'hard', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  { value: 'very_hard', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
];

export const AdaptiveQuizEngine = () => {
  const { t } = useLanguage();
  
  // Setup form state
  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [startingDifficulty, setStartingDifficulty] = useState<DifficultyLevel>('medium');
  const [questionCountInput, setQuestionCountInput] = useState('10');
  
  // Answer state
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; earnedPoints: number } | null>(null);
  const [feedbackQuestion, setFeedbackQuestion] = useState<AdaptiveQuestion | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const {
    isActive,
    isLoading,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    currentDifficulty,
    performanceHistory,
    answeredQuestions,
    score,
    maxScore,
    startQuiz,
    submitAnswer,
    resetQuiz,
    saveQuizToLibrary,
    advanceToNext,
  } = useAdaptiveQuiz();

  const getQuestionCount = () => Math.max(1, Math.min(50, parseInt(questionCountInput || '10', 10)));

  const handleStartQuiz = () => {
    if (!topic.trim() || !gradeLevel) return;

    const config: AdaptiveQuizConfig = {
      topic: topic.trim(),
      gradeLevel,
      startingDifficulty,
      totalQuestions: getQuestionCount(),
    };

    startQuiz(config);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion) return;

    // Snapshot the question being answered so feedback can't accidentally bind to the next question
    // (the hook may prefetch/advance internally).
    setFeedbackQuestion(currentQuestion);
    const result = await submitAnswer(selectedAnswer);
    if (result) {
      setLastResult(result);
      setShowFeedback(true);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer('');
    setShowFeedback(false);
    setLastResult(null);
    setFeedbackQuestion(null);
    advanceToNext();
  };

  const handleSaveQuiz = async () => {
    setIsSaving(true);
    const success = await saveQuizToLibrary();
    setIsSaving(false);
    if (success) {
      setHasSaved(true);
    }
  };

  const handleReset = () => {
    setHasSaved(false);
    resetQuiz();
  };

  const getDifficultyInfo = (diff: DifficultyLevel) => {
    return DIFFICULTY_KEYS.find(d => d.value === diff) || DIFFICULTY_KEYS[2];
  };

  const getDifficultyTrend = () => {
    if (performanceHistory.length < 2) return null;
    
    const prevDiff = performanceHistory[performanceHistory.length - 2]?.difficulty;
    if (prevDiff === currentDifficulty) return 'same';
    
    const prevIndex = DIFFICULTY_KEYS.findIndex(d => d.value === prevDiff);
    const currIndex = DIFFICULTY_KEYS.findIndex(d => d.value === currentDifficulty);
    
    return currIndex > prevIndex ? 'up' : 'down';
  };

  const progress = totalQuestions > 0 ? Math.round((currentQuestionIndex / totalQuestions) * 100) : 0;
  const isComplete = !isActive && answeredQuestions.length > 0;

  // Setup Screen
  if (!isActive && !isComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            {t('adaptiveQuiz.title')}
          </CardTitle>
          <CardDescription>
            {t('adaptiveQuiz.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="adaptive-topic">{t('adaptiveQuiz.topic')} *</Label>
            <Input
              id="adaptive-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t('adaptiveQuiz.topicPlaceholder')}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('adaptiveQuiz.gradeLevel')} *</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={t('adaptiveQuiz.selectLevel')} />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LEVEL_KEYS.map(key => (
                    <SelectItem key={key} value={key}>{t(`adaptiveQuiz.grades.${key}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('adaptiveQuiz.startingDifficulty')}</Label>
              <Select 
                value={startingDifficulty} 
                onValueChange={(v) => setStartingDifficulty(v as DifficultyLevel)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_KEYS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{t(`adaptiveQuiz.difficulty.${opt.value}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adaptive-count">{t('adaptiveQuiz.numberOfQuestions')}</Label>
            <Input
              id="adaptive-count"
              type="text"
              inputMode="numeric"
              value={questionCountInput}
              onChange={(e) => setQuestionCountInput(e.target.value.replace(/[^0-9]/g, ''))}
              onBlur={() => {
                const num = parseInt(questionCountInput || '0', 10);
                if (num > 50) setQuestionCountInput('50');
                else if (num < 1 && questionCountInput !== '') setQuestionCountInput('1');
              }}
              placeholder="10"
              className="w-32"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">{t('adaptiveQuiz.maxQuestions')}</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              {t('adaptiveQuiz.howItWorks')}
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• {t('adaptiveQuiz.rule1')}</li>
              <li>• {t('adaptiveQuiz.rule2')}</li>
              <li>• {t('adaptiveQuiz.rule3')}</li>
              <li>• {t('adaptiveQuiz.rule4')}</li>
            </ul>
          </div>

          <Button 
            onClick={handleStartQuiz} 
            disabled={!topic.trim() || !gradeLevel || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('adaptiveQuiz.preparing')}
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                {t('adaptiveQuiz.startQuiz')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Results Screen
  if (isComplete) {
    const accuracy = answeredQuestions.length > 0
      ? Math.round((answeredQuestions.filter(q => q.correct).length / answeredQuestions.length) * 100)
      : 0;

    const avgDifficulty = performanceHistory.length > 0
      ? DIFFICULTY_KEYS.findIndex(d => d.value === performanceHistory[performanceHistory.length - 1].difficulty)
      : 2;

    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>{t('adaptiveQuiz.quizComplete')}</CardTitle>
          <CardDescription>{t('adaptiveQuiz.hereIsPerformance')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">{score}</div>
              <div className="text-xs text-muted-foreground">{t('adaptiveQuiz.pointsEarned')}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold">{maxScore}</div>
              <div className="text-xs text-muted-foreground">{t('adaptiveQuiz.maxPossible')}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{accuracy}%</div>
              <div className="text-xs text-muted-foreground">{t('adaptiveQuiz.accuracy')}</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold">{t(`adaptiveQuiz.difficulty.${DIFFICULTY_KEYS[avgDifficulty]?.value || 'medium'}`)}</div>
              <div className="text-xs text-muted-foreground">{t('adaptiveQuiz.finalLevel')}</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">{t('adaptiveQuiz.questionBreakdown')}</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {answeredQuestions.map((aq, i) => (
                <div 
                  key={i}
                  className={cn(
                    "p-3 rounded-lg border flex items-start gap-3",
                    aq.correct ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
                  )}
                >
                  {aq.correct ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{aq.question.question}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={getDifficultyInfo(aq.question.difficulty).color}>
                        {t(`adaptiveQuiz.difficulty.${aq.question.difficulty}`)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {aq.correct ? `+${aq.question.points} pts` : '0 pts'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleSaveQuiz} 
              variant="outline"
              className="flex-1" 
              size="lg"
              disabled={isSaving || hasSaved}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('adaptiveQuiz.saving')}
                </>
              ) : hasSaved ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t('adaptiveQuiz.savedToLibrary')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t('adaptiveQuiz.saveToLibrary')}
                </>
              )}
            </Button>
            <Button onClick={handleReset} className="flex-1" size="lg">
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('adaptiveQuiz.startNewQuiz')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Question Screen
  const difficultyInfo = getDifficultyInfo(currentDifficulty);
  const trend = getDifficultyTrend();

  const questionForRender = (showFeedback ? feedbackQuestion : currentQuestion) ?? currentQuestion;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={difficultyInfo.color}>
              {t(`adaptiveQuiz.difficulty.${currentDifficulty}`)}
            </Badge>
            {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
            {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
            {trend === 'same' && <Minus className="h-4 w-4 text-muted-foreground" />}
          </div>
          <div className="text-sm text-muted-foreground">
            Score: <span className="font-medium text-foreground">{score}</span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="text-xs text-muted-foreground mt-1">
          {currentQuestionIndex + 1} / {totalQuestions}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="py-4">
            <GenerationProgress
              isGenerating={isLoading}
              estimatedSeconds={15}
              label={t('adaptiveQuiz.generatingQuestion')}
            />
          </div>
        ) : questionForRender ? (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-medium leading-relaxed">
                {questionForRender.question}
              </h3>

              {questionForRender.type === 'short_answer' ? (
                <div className="space-y-2">
                  <Label htmlFor="short-answer-input">{t('quizTaker.typeAnswer')}</Label>
                  <Input
                    id="short-answer-input"
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    placeholder={t('quizTaker.typeAnswer')}
                    disabled={showFeedback}
                  />
                </div>
              ) : (
                <RadioGroup 
                  value={selectedAnswer} 
                  onValueChange={setSelectedAnswer}
                  disabled={showFeedback}
                  className="space-y-2"
                >
                  {questionForRender.options?.map((opt, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                        showFeedback && opt === questionForRender.correct_answer && "bg-green-500/10 border-green-500/30",
                        showFeedback && selectedAnswer === opt && opt !== questionForRender.correct_answer && "bg-red-500/10 border-red-500/30",
                        !showFeedback && selectedAnswer === opt && "bg-primary/5 border-primary/30",
                        !showFeedback && "hover:bg-muted/50 cursor-pointer"
                      )}
                    >
                      <RadioGroupItem id={`opt-${i}`} value={opt} />
                      <Label htmlFor={`opt-${i}`} className="flex-1 cursor-pointer">{opt}</Label>
                      {showFeedback && opt === questionForRender.correct_answer && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      {showFeedback && selectedAnswer === opt && opt !== questionForRender.correct_answer && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>

            {showFeedback && lastResult && (
              <div className={cn(
                "p-4 rounded-lg border",
                lastResult.isCorrect ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {lastResult.isCorrect ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-600">{t('adaptiveQuiz.correct')} +{lastResult.earnedPoints} pts</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-600">{t('adaptiveQuiz.incorrect')}</span>
                    </>
                  )}
                </div>
                {questionForRender.explanation && (
                  <p className="text-sm text-muted-foreground">{questionForRender.explanation}</p>
                )}
                {!lastResult.isCorrect && (
                  <p className="text-sm mt-2">
                    <span className="text-muted-foreground">{t('adaptiveQuiz.correctAnswer')} </span>
                    <span className="font-medium">{questionForRender.correct_answer}</span>
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end">
              {!showFeedback ? (
                <Button 
                  onClick={handleSubmitAnswer} 
                  disabled={!selectedAnswer}
                  size="lg"
                >
                  {t('adaptiveQuiz.submitAnswer')}
                </Button>
              ) : (
                <Button onClick={handleNextQuestion} size="lg">
                  {currentQuestionIndex + 1 >= totalQuestions ? t('adaptiveQuiz.viewResults') : t('adaptiveQuiz.nextQuestion')}
                </Button>
              )}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default AdaptiveQuizEngine;
