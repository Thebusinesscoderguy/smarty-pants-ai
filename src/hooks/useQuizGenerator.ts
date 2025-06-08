
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
      // Save quiz using direct SQL since TypeScript types aren't updated yet
      const { data: quizData, error: quizError } = await supabase
        .rpc('create_quiz', {
          p_user_id: user.id,
          p_title: quiz.title,
          p_description: quiz.description,
          p_difficulty: quiz.difficulty,
          p_total_questions: quiz.questions.length,
          p_subject_id: quiz.subject_id
        });

      if (quizError) {
        console.error('Quiz creation error:', quizError);
        throw new Error('Failed to create quiz');
      }

      toast({
        title: "Success",
        description: "Quiz saved successfully!",
      });

      await fetchQuizzes(); // Refresh the list
      return quizData;
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
      // For now, we'll use a simple approach since the types aren't updated
      // This will work once the database schema is properly reflected in types
      const { data, error } = await supabase
        .rpc('get_user_quizzes', { p_user_id: user.id });

      if (error) {
        console.error('Error fetching quizzes:', error);
        return;
      }

      // Transform the data to match our Quiz interface
      const formattedQuizzes = (data || []).map((quiz: any) => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty as 'easy' | 'medium' | 'hard',
        questions: [] // We'll load questions separately when needed
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
        .rpc('delete_quiz', { p_quiz_id: quizId });

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
