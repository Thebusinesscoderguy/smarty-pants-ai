
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
      // For now, we'll show a success message but not actually save to database
      // This will work once the database types are properly synced
      console.log('Quiz to save:', quiz);
      
      toast({
        title: "Quiz Generated",
        description: "Quiz has been generated successfully! Database saving will be available once types are synced.",
      });

      return 'temp-id';
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
      // For now, return empty array until database types are synced
      setQuizzes([]);
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
      // For now, just show success message
      toast({
        title: "Success",
        description: "Quiz delete functionality will be available once types are synced.",
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
