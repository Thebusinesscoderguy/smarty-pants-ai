
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

  const toQuiz = (data: any, difficulty: Quiz['difficulty']): Quiz => ({
    title: data.title,
    description: data.description,
    difficulty,
    questions: (data.questions || []).map((q: any, index: number) => ({
      question: q.question,
      type: q.type,
      options: Array.isArray(q.options) ? q.options : undefined,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      points: q.points ?? 1,
      order_index: index,
    })),
  });

  const generateQuiz = async (
    topic: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    questionCount: number = 5,
    conversationHistory?: any[],
    gradeLevel?: string
  ): Promise<Quiz | null> => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { topic, difficulty, questionCount, conversationHistory, gradeLevel },
      });
      if (error) throw error;
      return toQuiz(data, difficulty);
    } catch (error: any) {
      console.error('Error generating quiz:', error);
      const status = error?.context?.response?.status || error?.status;
      const msg = String(error?.message || '');
      let description = 'Failed to generate quiz.';
      if (status === 429 || /rate limit/i.test(msg)) description = 'OpenAI rate limit reached. Please wait and try again.';
      else if (typeof status === 'number') description = `Server error (${status}). Please try again.`;
      else if (msg) description = msg;
      toast({ title: 'Error', description, variant: 'destructive' });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const extractQuizFromFile = async (
    file: File,
    opts?: { difficulty?: Quiz['difficulty']; questionCount?: number; gradeLevel?: string }
  ): Promise<Quiz | null> => {
    setIsGenerating(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const { data, error } = await supabase.functions.invoke('extract-quiz', {
        body: {
          fileBase64: base64,
          contentType: file.type,
          difficulty: opts?.difficulty ?? 'medium',
          questionCount: opts?.questionCount ?? 10,
          gradeLevel: opts?.gradeLevel,
        },
      });
      if (error) throw error;
      return toQuiz(data, opts?.difficulty ?? 'medium');
    } catch (error: any) {
      console.error('Error extracting quiz:', error);
      toast({ title: 'Error', description: 'Failed to extract quiz. Ensure the file is clear and readable.', variant: 'destructive' });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const saveQuiz = async (quiz: Quiz): Promise<string | null> => {
    if (!user) return null;
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          user_id: user.id,
          title: quiz.title,
          description: quiz.description,
          difficulty: quiz.difficulty,
          total_questions: quiz.questions.length,
          subject_id: quiz.subject_id,
        })
        .select()
        .single();
      if (quizError) throw new Error('Failed to create quiz');

      const questionsToInsert = quiz.questions.map((question, index) => ({
        quiz_id: quizData.id,
        question: question.question,
        question_type: question.type,
        options: question.options ? JSON.stringify(question.options) : null,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        points: question.points || 1,
        order_index: index,
      }));
      const { error: questionsError } = await supabase.from('quiz_questions').insert(questionsToInsert);
      if (questionsError) {
        await supabase.from('quizzes').delete().eq('id', quizData.id);
        throw new Error('Failed to create quiz questions');
      }

      toast({ title: 'Success', description: 'Quiz saved successfully!' });
      await fetchQuizzes();
      return quizData.id;
    } catch (error: any) {
      console.error('Error saving quiz:', error);
      toast({ title: 'Error', description: 'Failed to save quiz: ' + error.message, variant: 'destructive' });
      return null;
    }
  };

  const fetchQuizzes = async () => {
    if (!user) return;
    try {
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quizzes')
        .select(`*, quiz_questions (*)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (quizzesError) throw quizzesError;
      const formattedQuizzes: Quiz[] = (quizzesData || []).map((quizData: any) => ({
        id: quizData.id,
        title: quizData.title,
        description: quizData.description,
        difficulty: quizData.difficulty as 'easy' | 'medium' | 'hard',
        subject_id: quizData.subject_id,
        questions: (quizData.quiz_questions || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((q: any) => ({
            id: q.id,
            question: q.question,
            type: q.question_type,
            options: q.options ? JSON.parse(q.options) : undefined,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            points: q.points,
            order_index: q.order_index,
          })),
      }));
      setQuizzes(formattedQuizzes);
    } catch (error: any) {
      console.error('Error fetching quizzes:', error);
      toast({ title: 'Error', description: 'Failed to fetch quizzes: ' + error.message, variant: 'destructive' });
    }
  };

  // Helper: fetch latest attempt for current user
  const getLatestAttempt = async (): Promise<{ quiz_id: string; attempt: any } | null> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      toast({ title: 'Not signed in', description: 'Log in to access your past attempts.' });
      return null;
    }
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) {
      toast({ title: 'No attempts found', description: 'Take a quiz to create your first attempt.' });
      return null;
    }
    return { quiz_id: data.quiz_id, attempt: data } as any;
  };

  const retakeLatestQuiz = async (): Promise<Quiz | null> => {
    setIsGenerating(true);
    try {
      const latest = await getLatestAttempt();
      if (!latest) return null;
      const { data: quizData, error } = await supabase
        .from('quizzes')
        .select('*, quiz_questions(*)')
        .eq('id', latest.quiz_id)
        .maybeSingle();
      if (error || !quizData) throw new Error('Could not load latest quiz');
      const quiz: Quiz = {
        id: quizData.id,
        title: quizData.title,
        description: quizData.description,
        difficulty: (quizData.difficulty || 'medium') as any,
        questions: (quizData.quiz_questions || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((q: any) => ({
            id: q.id,
            question: q.question,
            type: q.question_type,
            options: q.options ? JSON.parse(q.options) : undefined,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            points: q.points ?? 1,
            order_index: q.order_index,
          })),
      };
      return quiz;
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to load latest quiz', variant: 'destructive' });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const quizFromLatestMistakes = async (
    opts?: { targetCount?: number; difficulty?: Quiz['difficulty'] }
  ): Promise<Quiz | null> => {
    setIsGenerating(true);
    try {
      const latest = await getLatestAttempt();
      if (!latest) return null;
      const { quiz_id, attempt } = latest;
      const { data: quizData, error } = await supabase
        .from('quizzes')
        .select('*, quiz_questions(*)')
        .eq('id', quiz_id)
        .maybeSingle();
      if (error || !quizData) throw new Error('Could not load quiz');

      const allQs = (quizData.quiz_questions || []) as any[];
      const wrong = (attempt.answers || []).filter((a: any) => a && a.is_correct === false);

      const wrongQs: QuizQuestion[] = wrong.map((ans: any) => {
        const byId = ans.id ? allQs.find((q) => q.id === ans.id) : null;
        const base = byId || allQs[ans.index] || {};
        return {
          id: base.id,
          question: base.question || ans.question,
          type: base.question_type || 'multiple_choice',
          options: base.options ? JSON.parse(base.options) : undefined,
          correct_answer: base.correct_answer || String(ans.correct ?? ''),
          explanation: base.explanation || ans.explanation || undefined,
          points: base.points ?? 1,
        } as QuizQuestion;
      });

      const quiz: Quiz = {
        title: `${quizData.title} – Mistakes Review`,
        description: 'Practice only the questions you missed last time.',
        difficulty: (opts?.difficulty ?? quizData.difficulty ?? 'medium') as any,
        questions: wrongQs.map((q, i) => ({ ...q, order_index: i })),
      };

      // If targetCount specified and we need to pad, generate more from same topic/title
      const target = opts?.targetCount ?? wrongQs.length;
      if (target > quiz.questions.length) {
        const extra = await generateQuiz(quizData.title, quiz.difficulty, target - quiz.questions.length);
        if (extra?.questions?.length) {
          quiz.questions = [
            ...quiz.questions,
            ...extra.questions.map((q, i) => ({ ...q, order_index: quiz.questions.length + i })),
          ];
        }
      }

      return quiz;
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to build mistakes quiz', variant: 'destructive' });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteQuiz = async (quizId: string) => {
    try {
      const { error: questionsError } = await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);
      if (questionsError) throw questionsError;
      const { error: quizError } = await supabase.from('quizzes').delete().eq('id', quizId);
      if (quizError) throw quizError;
      toast({ title: 'Success', description: 'Quiz deleted successfully!' });
      await fetchQuizzes();
    } catch (error: any) {
      console.error('Error deleting quiz:', error);
      toast({ title: 'Error', description: 'Failed to delete quiz: ' + error.message, variant: 'destructive' });
    }
  };

  return {
    isGenerating,
    quizzes,
    generateQuiz,
    extractQuizFromFile,
    saveQuiz,
    fetchQuizzes,
    deleteQuiz,
    retakeLatestQuiz,
    quizFromLatestMistakes,
  };
};
