import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

export type DifficultyLevel = 'very_easy' | 'easy' | 'medium' | 'hard' | 'very_hard';

export interface AdaptiveQuestion {
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correct_answer: string;
  explanation: string;
  difficulty: DifficultyLevel;
  points: number;
}

export interface PerformanceEntry {
  questionIndex: number;
  correct: boolean;
  timeMs: number;
  difficulty: DifficultyLevel;
}

export interface AdaptiveQuizConfig {
  topic: string;
  gradeLevel: string;
  startingDifficulty: DifficultyLevel;
  totalQuestions: number;
}

export interface AdaptiveQuizState {
  isActive: boolean;
  isLoading: boolean;
  currentQuestion: AdaptiveQuestion | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentDifficulty: DifficultyLevel;
  performanceHistory: PerformanceEntry[];
  answeredQuestions: Array<{
    question: AdaptiveQuestion;
    userAnswer: string;
    correct: boolean;
    timeMs: number;
  }>;
  score: number;
  maxScore: number;
}

const DIFFICULTY_ORDER: DifficultyLevel[] = ['very_easy', 'easy', 'medium', 'hard', 'very_hard'];

const calculateNextDifficulty = (
  currentDifficulty: DifficultyLevel,
  performanceHistory: PerformanceEntry[]
): DifficultyLevel => {
  if (performanceHistory.length < 2) return currentDifficulty;

  // Look at the last 3 responses for adaptation
  const recentPerformance = performanceHistory.slice(-3);
  const correctCount = recentPerformance.filter(p => p.correct).length;
  const avgTimeMs = recentPerformance.reduce((acc, p) => acc + p.timeMs, 0) / recentPerformance.length;

  const currentIndex = DIFFICULTY_ORDER.indexOf(currentDifficulty);
  
  // If got all recent ones correct and fast (< 15s avg), increase difficulty
  if (correctCount === recentPerformance.length && avgTimeMs < 15000) {
    return DIFFICULTY_ORDER[Math.min(currentIndex + 1, DIFFICULTY_ORDER.length - 1)];
  }
  
  // If got 2+ correct, consider slight increase
  if (correctCount >= 2 && avgTimeMs < 30000) {
    return DIFFICULTY_ORDER[Math.min(currentIndex + 1, DIFFICULTY_ORDER.length - 1)];
  }
  
  // If got less than half correct, decrease difficulty
  if (correctCount < recentPerformance.length / 2) {
    return DIFFICULTY_ORDER[Math.max(currentIndex - 1, 0)];
  }
  
  // If took too long (> 60s avg) even if correct, might need easier questions
  if (avgTimeMs > 60000 && correctCount < recentPerformance.length) {
    return DIFFICULTY_ORDER[Math.max(currentIndex - 1, 0)];
  }

  return currentDifficulty;
};

export const useAdaptiveQuiz = () => {
  const { language } = useLanguage();
  
  const [state, setState] = useState<AdaptiveQuizState>({
    isActive: false,
    isLoading: false,
    currentQuestion: null,
    currentQuestionIndex: 0,
    totalQuestions: 0,
    currentDifficulty: 'medium',
    performanceHistory: [],
    answeredQuestions: [],
    score: 0,
    maxScore: 0,
  });

  const configRef = useRef<AdaptiveQuizConfig | null>(null);
  const previousQuestionsRef = useRef<string[]>([]);
  const questionStartTimeRef = useRef<number>(Date.now());

  const fetchNextQuestion = useCallback(async () => {
    if (!configRef.current) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { data, error } = await supabase.functions.invoke('generate-adaptive-question', {
        body: {
          topic: configRef.current.topic,
          difficulty: state.currentDifficulty,
          gradeLevel: configRef.current.gradeLevel,
          language,
          questionNumber: state.currentQuestionIndex + 1,
          previousQuestions: previousQuestionsRef.current,
          performanceHistory: state.performanceHistory,
        },
      });

      if (error) throw error;

      const question = data as AdaptiveQuestion;
      previousQuestionsRef.current.push(question.question);
      questionStartTimeRef.current = Date.now();

      setState(prev => ({
        ...prev,
        isLoading: false,
        currentQuestion: question,
        maxScore: prev.maxScore + question.points,
      }));
    } catch (error: any) {
      console.error('Error fetching adaptive question:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate question',
        variant: 'destructive',
      });
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.currentDifficulty, state.currentQuestionIndex, state.performanceHistory, language]);

  const startQuiz = useCallback(async (config: AdaptiveQuizConfig) => {
    configRef.current = config;
    previousQuestionsRef.current = [];

    setState({
      isActive: true,
      isLoading: true,
      currentQuestion: null,
      currentQuestionIndex: 0,
      totalQuestions: config.totalQuestions,
      currentDifficulty: config.startingDifficulty,
      performanceHistory: [],
      answeredQuestions: [],
      score: 0,
      maxScore: 0,
    });

    // Fetch first question
    try {
      const { data, error } = await supabase.functions.invoke('generate-adaptive-question', {
        body: {
          topic: config.topic,
          difficulty: config.startingDifficulty,
          gradeLevel: config.gradeLevel,
          language,
          questionNumber: 1,
          previousQuestions: [],
          performanceHistory: [],
        },
      });

      if (error) throw error;

      const question = data as AdaptiveQuestion;
      previousQuestionsRef.current.push(question.question);
      questionStartTimeRef.current = Date.now();

      setState(prev => ({
        ...prev,
        isLoading: false,
        currentQuestion: question,
        maxScore: question.points,
      }));
    } catch (error: any) {
      console.error('Error starting adaptive quiz:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start quiz',
        variant: 'destructive',
      });
      setState(prev => ({ ...prev, isActive: false, isLoading: false }));
    }
  }, [language]);

  const submitAnswer = useCallback(async (userAnswer: string) => {
    if (!state.currentQuestion) return;

    const timeMs = Date.now() - questionStartTimeRef.current;
    
    // Check answer - use semantic comparison for short answers
    let isCorrect = false;
    if (state.currentQuestion.type === 'short_answer') {
      try {
        const { data, error } = await supabase.functions.invoke('check-open-answer', {
          body: {
            userAnswer,
            correctAnswer: state.currentQuestion.correct_answer,
            question: state.currentQuestion.question
          }
        });
        if (!error && data?.success) {
          isCorrect = data.is_correct;
        } else {
          isCorrect = userAnswer.trim().toLowerCase() === state.currentQuestion.correct_answer.trim().toLowerCase();
        }
      } catch (e) {
        console.error('Semantic check failed:', e);
        isCorrect = userAnswer.trim().toLowerCase() === state.currentQuestion.correct_answer.trim().toLowerCase();
      }
    } else {
      isCorrect = userAnswer.trim().toLowerCase() === state.currentQuestion.correct_answer.trim().toLowerCase();
    }
    
    const earnedPoints = isCorrect ? state.currentQuestion.points : 0;

    const performanceEntry: PerformanceEntry = {
      questionIndex: state.currentQuestionIndex,
      correct: isCorrect,
      timeMs,
      difficulty: state.currentDifficulty,
    };

    const answeredQuestion = {
      question: state.currentQuestion,
      userAnswer,
      correct: isCorrect,
      timeMs,
    };

    const isComplete = (state.currentQuestionIndex + 1) >= state.totalQuestions;

    // Only record the answer — do NOT advance index or fetch next question
    setState(prev => ({
      ...prev,
      performanceHistory: [...prev.performanceHistory, performanceEntry],
      answeredQuestions: [...prev.answeredQuestions, answeredQuestion],
      score: prev.score + earnedPoints,
    }));

    return { isCorrect, earnedPoints, isComplete };
  }, [state.currentQuestion, state.currentQuestionIndex, state.currentDifficulty, state.performanceHistory, state.totalQuestions]);

  const advanceToNext = useCallback(async () => {
    const nextQuestionIndex = state.currentQuestionIndex + 1;
    const isComplete = nextQuestionIndex >= state.totalQuestions;

    const nextDifficulty = isComplete
      ? state.currentDifficulty
      : calculateNextDifficulty(state.currentDifficulty, state.performanceHistory);

    if (isComplete) {
      setState(prev => ({
        ...prev,
        currentQuestionIndex: nextQuestionIndex,
        currentDifficulty: nextDifficulty,
        currentQuestion: null,
        isActive: false,
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      currentQuestionIndex: nextQuestionIndex,
      currentDifficulty: nextDifficulty,
      isLoading: true,
    }));

    try {
      const { data, error } = await supabase.functions.invoke('generate-adaptive-question', {
        body: {
          topic: configRef.current!.topic,
          difficulty: nextDifficulty,
          gradeLevel: configRef.current!.gradeLevel,
          language,
          questionNumber: nextQuestionIndex + 1,
          previousQuestions: previousQuestionsRef.current,
          performanceHistory: state.performanceHistory,
        },
      });

      if (error) throw error;

      const question = data as AdaptiveQuestion;
      previousQuestionsRef.current.push(question.question);
      questionStartTimeRef.current = Date.now();

      setState(prev => ({
        ...prev,
        isLoading: false,
        currentQuestion: question,
        maxScore: prev.maxScore + question.points,
      }));
    } catch (error: any) {
      console.error('Error fetching next question:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate next question',
        variant: 'destructive',
      });
      setState(prev => ({ ...prev, isLoading: false, isActive: false }));
    }
  }, [state.currentQuestionIndex, state.currentDifficulty, state.performanceHistory, state.totalQuestions, language]);

  const saveQuizToLibrary = useCallback(async () => {
    if (!configRef.current || state.answeredQuestions.length === 0) {
      toast({
        title: 'Error',
        description: 'No quiz data to save',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) {
        toast({
          title: 'Error',
          description: 'You must be logged in to save quizzes',
          variant: 'destructive',
        });
        return false;
      }

      // Create quiz entry
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: `Adaptive: ${configRef.current.topic}`,
          description: `Adaptive quiz on ${configRef.current.topic} (${configRef.current.gradeLevel})`,
          difficulty: state.performanceHistory.length > 0 
            ? state.performanceHistory[state.performanceHistory.length - 1].difficulty 
            : configRef.current.startingDifficulty,
          total_questions: state.answeredQuestions.length,
          user_id: userData.user.id,
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Create quiz questions
      const questions = state.answeredQuestions.map((aq, index) => ({
        quiz_id: quizData.id,
        question: aq.question.question,
        question_type: aq.question.type === 'multiple_choice' ? 'multiple_choice' : 
                       aq.question.type === 'true_false' ? 'true_false' : 'short_answer',
        options: aq.question.options || null,
        correct_answer: aq.question.correct_answer,
        explanation: aq.question.explanation || null,
        points: aq.question.points,
        order_index: index,
      }));

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questions);

      if (questionsError) throw questionsError;

      // Save the attempt record
      const answers = state.answeredQuestions.map(aq => ({
        question: aq.question.question,
        userAnswer: aq.userAnswer,
        correct: aq.correct,
        timeMs: aq.timeMs,
      }));

      await supabase.from('quiz_attempts').insert({
        quiz_id: quizData.id,
        user_id: userData.user.id,
        score: state.score,
        total_possible: state.maxScore,
        answers,
        time_taken: Math.round(state.answeredQuestions.reduce((acc, aq) => acc + aq.timeMs, 0) / 1000),
      });

      toast({
        title: 'Quiz Saved!',
        description: 'Your adaptive quiz has been saved to the library',
      });

      return true;
    } catch (error: any) {
      console.error('Error saving quiz to library:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save quiz',
        variant: 'destructive',
      });
      return false;
    }
  }, [state.answeredQuestions, state.score, state.maxScore, state.performanceHistory]);

  const resetQuiz = useCallback(() => {
    configRef.current = null;
    previousQuestionsRef.current = [];
    setState({
      isActive: false,
      isLoading: false,
      currentQuestion: null,
      currentQuestionIndex: 0,
      totalQuestions: 0,
      currentDifficulty: 'medium',
      performanceHistory: [],
      answeredQuestions: [],
      score: 0,
      maxScore: 0,
    });
  }, []);

  return {
    ...state,
    startQuiz,
    submitAnswer,
    advanceToNext,
    resetQuiz,
    fetchNextQuestion,
    saveQuizToLibrary,
  };
};
