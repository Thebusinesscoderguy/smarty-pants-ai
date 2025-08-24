import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface QuestionAnalytics {
  question_id: string;
  question_text: string;
  question_type: string;
  correct_answer: string;
  attempts: number;
  correct_attempts: number;
  accuracy_rate: number;
  average_response_time: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
  topic: string;
  subject: string;
  mistake_patterns: string[];
  improvement_trend: number[];
  similar_questions: string[];
}

export interface QuizPerformanceAnalytics {
  quiz_id: string;
  quiz_title: string;
  total_attempts: number;
  best_score: number;
  average_score: number;
  completion_time_trend: number[];
  question_analytics: QuestionAnalytics[];
  improvement_areas: string[];
  mastered_topics: string[];
  recommended_retake: boolean;
  mistake_categories: { [category: string]: number };
}

export interface SubjectImprovementTracking {
  subject: string;
  score_progression: { date: string; score: number; quiz_title: string }[];
  topics_mastered: string[];
  topics_struggling: string[];
  time_efficiency_trend: number[];
  recommendation_quizzes: string[];
  overall_improvement: number;
}

export interface ModuleProgressAnalytics {
  module_id: string;
  module_name: string;
  quiz_completion_rate: number;
  average_module_score: number;
  time_spent_per_quiz: number;
  question_mastery_map: { [questionId: string]: number };
  learning_velocity: number;
  prerequisite_gaps: string[];
}

export const useQuizAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [quizPerformance, setQuizPerformance] = useState<QuizPerformanceAnalytics[]>([]);
  const [subjectImprovements, setSubjectImprovements] = useState<SubjectImprovementTracking[]>([]);
  const [moduleAnalytics, setModuleAnalytics] = useState<ModuleProgressAnalytics[]>([]);
  const [questionLevelData, setQuestionLevelData] = useState<QuestionAnalytics[]>([]);

  useEffect(() => {
    if (user) {
      fetchQuizAnalytics();
    }
  }, [user]);

  const fetchQuizAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch quiz attempts with detailed question-level data
      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quizzes (
            id,
            title,
            subject_id,
            subjects (name)
          )
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      // Process quiz performance analytics
      const quizPerformanceMap = new Map<string, QuizPerformanceAnalytics>();
      
      quizAttempts?.forEach(attempt => {
        const quizId = attempt.quiz_id;
        const quiz = attempt.quizzes;
        
        if (!quizPerformanceMap.has(quizId)) {
          quizPerformanceMap.set(quizId, {
            quiz_id: quizId,
            quiz_title: quiz?.title || 'Unknown Quiz',
            total_attempts: 0,
            best_score: 0,
            average_score: 0,
            completion_time_trend: [],
            question_analytics: [],
            improvement_areas: [],
            mastered_topics: [],
            recommended_retake: false,
            mistake_categories: {}
          });
        }

        const analytics = quizPerformanceMap.get(quizId)!;
        analytics.total_attempts++;
        analytics.best_score = Math.max(analytics.best_score, (attempt.score / attempt.total_possible) * 100);
        analytics.completion_time_trend.push(attempt.time_taken || 0);
        
        // Analyze answers for question-level data
        if (attempt.answers) {
          processQuestionLevelAnalytics(attempt, analytics);
        }
      });

      // Calculate averages and trends
      Array.from(quizPerformanceMap.values()).forEach(analytics => {
        const attempts = quizAttempts?.filter(a => a.quiz_id === analytics.quiz_id) || [];
        if (attempts.length > 0) {
          analytics.average_score = attempts.reduce((sum, a) => sum + (a.score / a.total_possible) * 100, 0) / attempts.length;
          analytics.recommended_retake = analytics.average_score < 75 || hasConsistentMistakes(analytics);
        }
      });

      // Process subject improvement tracking
      const subjectMap = new Map<string, SubjectImprovementTracking>();
      
      quizAttempts?.forEach(attempt => {
        const subjectName = attempt.quizzes?.subjects?.name || 'General';
        
        if (!subjectMap.has(subjectName)) {
          subjectMap.set(subjectName, {
            subject: subjectName,
            score_progression: [],
            topics_mastered: [],
            topics_struggling: [],
            time_efficiency_trend: [],
            recommendation_quizzes: [],
            overall_improvement: 0
          });
        }

        const subjectData = subjectMap.get(subjectName)!;
        subjectData.score_progression.push({
          date: attempt.completed_at,
          score: (attempt.score / attempt.total_possible) * 100,
          quiz_title: attempt.quizzes?.title || 'Quiz'
        });
        subjectData.time_efficiency_trend.push(attempt.time_taken || 0);
      });

      // Calculate improvement trends for subjects
      Array.from(subjectMap.values()).forEach(subject => {
        if (subject.score_progression.length >= 2) {
          const firstScore = subject.score_progression[subject.score_progression.length - 1].score;
          const lastScore = subject.score_progression[0].score;
          subject.overall_improvement = lastScore - firstScore;
        }
      });

      setQuizPerformance(Array.from(quizPerformanceMap.values()));
      setSubjectImprovements(Array.from(subjectMap.values()));
      
    } catch (error) {
      console.error('Error fetching quiz analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load quiz analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processQuestionLevelAnalytics = (attempt: any, analytics: QuizPerformanceAnalytics) => {
    if (!attempt.answers || typeof attempt.answers !== 'object') return;

    Object.entries(attempt.answers).forEach(([questionId, answer]: [string, any]) => {
      let existingQuestion = analytics.question_analytics.find(q => q.question_id === questionId);
      
      if (!existingQuestion) {
        existingQuestion = {
          question_id: questionId,
          question_text: answer.question || 'Unknown Question',
          question_type: answer.type || 'multiple_choice',
          correct_answer: answer.correct_answer || '',
          attempts: 0,
          correct_attempts: 0,
          accuracy_rate: 0,
          average_response_time: 0,
          difficulty_level: 'medium',
          topic: answer.topic || 'General',
          subject: analytics.quiz_title,
          mistake_patterns: [],
          improvement_trend: [],
          similar_questions: []
        };
        analytics.question_analytics.push(existingQuestion);
      }

      existingQuestion.attempts++;
      
      const isCorrect = answer.selected === answer.correct_answer;
      if (isCorrect) {
        existingQuestion.correct_attempts++;
      } else {
        // Track mistake patterns
        const mistakePattern = `Selected "${answer.selected}" instead of "${answer.correct_answer}"`;
        if (!existingQuestion.mistake_patterns.includes(mistakePattern)) {
          existingQuestion.mistake_patterns.push(mistakePattern);
        }
      }

      existingQuestion.accuracy_rate = (existingQuestion.correct_attempts / existingQuestion.attempts) * 100;
      
      // Track response time if available
      if (answer.response_time) {
        existingQuestion.average_response_time = 
          (existingQuestion.average_response_time * (existingQuestion.attempts - 1) + answer.response_time) / existingQuestion.attempts;
      }

      // Update difficulty based on performance
      if (existingQuestion.accuracy_rate >= 80) {
        existingQuestion.difficulty_level = 'easy';
      } else if (existingQuestion.accuracy_rate >= 60) {
        existingQuestion.difficulty_level = 'medium';
      } else {
        existingQuestion.difficulty_level = 'hard';
      }
    });
  };

  const hasConsistentMistakes = (analytics: QuizPerformanceAnalytics): boolean => {
    return analytics.question_analytics.some(q => 
      q.attempts >= 2 && q.accuracy_rate < 50
    );
  };

  const getRecommendedSimilarQuizzes = async (mistakeTopics: string[]) => {
    if (!mistakeTopics.length) return [];

    try {
      const { data: similarQuizzes } = await supabase
        .from('quizzes')
        .select('id, title, description, difficulty')
        .contains('description', mistakeTopics)
        .limit(5);

      return similarQuizzes || [];
    } catch (error) {
      console.error('Error fetching similar quizzes:', error);
      return [];
    }
  };

  const retakeQuizWithMistakeFocus = async (quizId: string) => {
    // Get mistake questions for focused retake
    const quizAnalytics = quizPerformance.find(q => q.quiz_id === quizId);
    if (!quizAnalytics) return null;

    const mistakeQuestions = quizAnalytics.question_analytics.filter(q => q.accuracy_rate < 70);
    
    return {
      quiz_id: quizId,
      focus_questions: mistakeQuestions,
      recommended_study_time: mistakeQuestions.length * 3, // 3 minutes per question
      improvement_tips: generateImprovementTips(mistakeQuestions)
    };
  };

  const generateImprovementTips = (questions: QuestionAnalytics[]): string[] => {
    const tips: string[] = [];
    
    questions.forEach(q => {
      if (q.average_response_time > 300000) { // 5 minutes
        tips.push(`Take more time to carefully read questions about ${q.topic}`);
      }
      if (q.mistake_patterns.length > 0) {
        tips.push(`Review common mistakes in ${q.topic}: ${q.mistake_patterns[0]}`);
      }
    });

    return [...new Set(tips)];
  };

  const refreshAnalytics = () => {
    fetchQuizAnalytics();
  };

  return {
    loading,
    quizPerformance,
    subjectImprovements,
    moduleAnalytics,
    questionLevelData,
    refreshAnalytics,
    getRecommendedSimilarQuizzes,
    retakeQuizWithMistakeFocus
  };
};