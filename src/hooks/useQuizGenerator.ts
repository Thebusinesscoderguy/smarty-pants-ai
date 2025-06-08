
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export interface QuizQuestion {
  id?: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correct_answer: string;
  explanation?: string;
  points?: number;
  order_index?: number;
}

export interface Quiz {
  id?: string;
  title: string;
  description?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
  subject_id?: string;
}

export const useQuizGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const { user } = useAuth();

  const generateQuiz = async (
    topic: string, 
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    questionCount: number = 5,
    conversationHistory?: any[]
  ): Promise<Quiz | null> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate quizzes",
        variant: "destructive"
      });
      return null;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: {
          topic,
          difficulty,
          questionCount,
          conversationHistory
        }
      });

      if (error) throw error;

      const quiz: Quiz = {
        title: data.title,
        description: data.description,
        difficulty,
        questions: data.questions.map((q: any, index: number) => ({
          ...q,
          order_index: index
        }))
      };

      return quiz;
    } catch (error: any) {
      console.error('Error generating quiz:', error);
      toast({
        title: "Error",
        description: "Failed to generate quiz: " + error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const saveQuiz = async (quiz: Quiz): Promise<string | null> => {
    if (!user) return null;

    try {
      // Save quiz
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          user_id: user.id,
          title: quiz.title,
          description: quiz.description,
          difficulty: quiz.difficulty,
          total_questions: quiz.questions.length,
          subject_id: quiz.subject_id
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Save questions
      const questionsToInsert = quiz.questions.map(q => ({
        quiz_id: quizData.id,
        question: q.question,
        question_type: q.type,
        options: q.options ? JSON.stringify(q.options) : null,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        points: q.points || 1,
        order_index: q.order_index || 0
      }));

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast({
        title: "Success",
        description: "Quiz saved successfully!",
      });

      await fetchQuizzes(); // Refresh the list
      return quizData.id;
    } catch (error: any) {
      console.error('Error saving quiz:', error);
      toast({
        title: "Error",
        description: "Failed to save quiz: " + error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const fetchQuizzes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          quiz_questions (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedQuizzes = data.map(quiz => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty as 'easy' | 'medium' | 'hard',
        questions: quiz.quiz_questions.map((q: any) => ({
          id: q.id,
          question: q.question,
          type: q.question_type,
          options: q.options ? JSON.parse(q.options) : undefined,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          points: q.points,
          order_index: q.order_index
        }))
      }));

      setQuizzes(formattedQuizzes);
    } catch (error: any) {
      console.error('Error fetching quizzes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch quizzes: " + error.message,
        variant: "destructive"
      });
    }
  };

  const deleteQuiz = async (quizId: string) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quiz deleted successfully!",
      });

      await fetchQuizzes();
    } catch (error: any) {
      console.error('Error deleting quiz:', error);
      toast({
        title: "Error",
        description: "Failed to delete quiz: " + error.message,
        variant: "destructive"
      });
    }
  };

  return {
    isGenerating,
    quizzes,
    generateQuiz,
    saveQuiz,
    fetchQuizzes,
    deleteQuiz
  };
};
