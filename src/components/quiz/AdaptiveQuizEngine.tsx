import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, Zap, TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle, RotateCcw, Trophy } from 'lucide-react';
import { useAdaptiveQuiz, type DifficultyLevel, type AdaptiveQuizConfig } from '@/hooks/useAdaptiveQuiz';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const GRADE_LEVELS = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
  'College Freshman', 'College Sophomore', 'College Junior', 'College Senior', 'Graduate'
];

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string; color: string }[] = [
  { value: 'very_easy', label: 'Very Easy', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  { value: 'easy', label: 'Easy', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  { value: 'hard', label: 'Hard', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  { value: 'very_hard', label: 'Very Hard', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
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
  };

  const getDifficultyInfo = (diff: DifficultyLevel) => {
    return DIFFICULTY_OPTIONS.find(d => d.value === diff) || DIFFICULTY_OPTIONS[2];
  };

  const getDifficultyTrend = () => {
    if (performanceHistory.length < 2) return null;
    
    const prevDiff = performanceHistory[performanceHistory.length - 2]?.difficulty;
    if (prevDiff === currentDifficulty) return 'same';
    
    const prevIndex = DIFFICULTY_OPTIONS.findIndex(d => d.value === prevDiff);
    const currIndex = DIFFICULTY_OPTIONS.findIndex(d => d.value === currentDifficulty);
    
    return currIndex > prevIndex ? 'up' : 'down';
  };

  const progress = totalQuestions > 0 ? Math.round((currentQuestionIndex / totalQuestions) * 100) : 0;
  const isComplete = !isActive && answeredQuestions.length > 0;

  // Setup Screen
  if (!isActive && !isComplete) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Adaptive Quiz Engine
          </CardTitle>
          <CardDescription>
            Questions adapt to your performance in real-time. Answer correctly and quickly to unlock harder challenges!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="adaptive-topic">Topic *</Label>
            <Input
              id="adaptive-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Photosynthesis, World War II, Calculus..."
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Grade/Level *</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your level" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Starting Difficulty</Label>
              <Select 
                value={startingDifficulty} 
                onValueChange={(v) => setStartingDifficulty(v as DifficultyLevel)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adaptive-count">Number of Questions</Label>
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
            <p className="text-xs text-muted-foreground">Max 50 questions</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              How Adaptive Mode Works
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Answer correctly & quickly → Difficulty increases</li>
              <li>• Struggle with questions → Difficulty decreases</li>
              <li>• Harder questions = More points!</li>
              <li>• The quiz learns your skill level in real-time</li>
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
                Preparing Quiz...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Start Adaptive Quiz
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
      ? DIFFICULTY_OPTIONS.findIndex(d => d.value === performanceHistory[performanceHistory.length - 1].difficulty)
      : 2;

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Quiz Complete!</CardTitle>
          <CardDescription>Here's how you performed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">{score}</div>
              <div className="text-xs text-muted-foreground">Points Earned</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold">{maxScore}</div>
              <div className="text-xs text-muted-foreground">Max Possible</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{accuracy}%</div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold">{DIFFICULTY_OPTIONS[avgDifficulty]?.label || 'Medium'}</div>
              <div className="text-xs text-muted-foreground">Final Level</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Question Breakdown</h4>
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
                        {getDifficultyInfo(aq.question.difficulty).label}
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

          <Button onClick={resetQuiz} className="w-full" size="lg">
            <RotateCcw className="mr-2 h-4 w-4" />
            Start New Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Question Screen
  const difficultyInfo = getDifficultyInfo(currentDifficulty);
  const trend = getDifficultyTrend();

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={difficultyInfo.color}>
              {difficultyInfo.label}
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
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Generating next question...</p>
          </div>
        ) : currentQuestion ? (
          <>
            <div className="space-y-4">
              <h3 className="text-lg font-medium leading-relaxed">
                {currentQuestion.question}
              </h3>

              {currentQuestion.type === 'short_answer' ? (
                <div className="space-y-2">
                  <Label htmlFor="short-answer-input">Your Answer</Label>
                  <Input
                    id="short-answer-input"
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    placeholder="Type your answer..."
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
                  {currentQuestion.options?.map((opt, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                        showFeedback && opt === currentQuestion.correct_answer && "bg-green-500/10 border-green-500/30",
                        showFeedback && selectedAnswer === opt && opt !== currentQuestion.correct_answer && "bg-red-500/10 border-red-500/30",
                        !showFeedback && selectedAnswer === opt && "bg-primary/5 border-primary/30",
                        !showFeedback && "hover:bg-muted/50 cursor-pointer"
                      )}
                    >
                      <RadioGroupItem id={`opt-${i}`} value={opt} />
                      <Label htmlFor={`opt-${i}`} className="flex-1 cursor-pointer">{opt}</Label>
                      {showFeedback && opt === currentQuestion.correct_answer && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      {showFeedback && selectedAnswer === opt && opt !== currentQuestion.correct_answer && (
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
                      <span className="font-medium text-green-600">Correct! +{lastResult.earnedPoints} points</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-600">Incorrect</span>
                    </>
                  )}
                </div>
                {currentQuestion.explanation && (
                  <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                )}
                {!lastResult.isCorrect && (
                  <p className="text-sm mt-2">
                    <span className="text-muted-foreground">Correct answer: </span>
                    <span className="font-medium">{currentQuestion.correct_answer}</span>
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
                  Submit Answer
                </Button>
              ) : (
                <Button onClick={handleNextQuestion} size="lg">
                  {currentQuestionIndex + 1 >= totalQuestions ? 'View Results' : 'Next Question'}
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
