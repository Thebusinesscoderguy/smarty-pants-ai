import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getDemoTestData } from '@/utils/demoData';

export interface Test {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  time_limit_minutes: number;
  is_mandatory: boolean;
  ai_graded: boolean;
  ai_generated: boolean;
  total_points: number;
  created_at: string;
  creator_id: string;
}

export interface TestQuestion {
  id?: string;
  test_id: string;
  question: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correct_answer: string;
  points: number;
  order_index: number;
}

export const useTestManagement = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Use demo data when not authenticated or in demo mode
  const useDemoData = !user || window.location.href.includes('demo');

  const fetchTests = async () => {
    if (useDemoData) {
      setTests(getDemoTestData());
      return;
    }
    
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error: any) {
      console.error('Error fetching tests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tests: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTest = async (testData: Omit<Test, 'id' | 'created_at' | 'creator_id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('tests')
        .insert({
          ...testData,
          creator_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test created successfully!",
      });

      await fetchTests();
      return data;
    } catch (error: any) {
      console.error('Error creating test:', error);
      toast({
        title: "Error",
        description: "Failed to create test: " + error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const generateAITest = async (topic: string, difficulty: 'easy' | 'medium' | 'hard', questionCount: number) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: {
          topic,
          difficulty,
          questionCount,
          generateTest: true
        }
      });

      if (error) throw error;

      const testData = {
        title: data.title,
        description: data.description,
        subject: topic,
        time_limit_minutes: 30,
        is_mandatory: false,
        ai_graded: true,
        ai_generated: true,
        total_points: data.questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0)
      };

      const test = await createTest(testData);
      if (test) {
        // Create questions
        const questionsToInsert = data.questions.map((q: any, index: number) => ({
          test_id: test.id,
          question: q.question,
          question_type: q.type,
          options: q.options ? JSON.stringify(q.options) : null,
          correct_answer: q.correct_answer,
          points: q.points || 1,
          order_index: index
        }));

        await supabase.from('test_questions').insert(questionsToInsert);
      }

      return test;
    } catch (error: any) {
      console.error('Error generating AI test:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI test: " + error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteTest = async (testId: string) => {
    try {
      // Delete questions first
      await supabase.from('test_questions').delete().eq('test_id', testId);
      
      // Delete test
      const { error } = await supabase.from('tests').delete().eq('id', testId);
      
      if (error) throw error;

      toast({
        title: "Success",
        description: "Test deleted successfully!",
      });

      await fetchTests();
    } catch (error: any) {
      console.error('Error deleting test:', error);
      toast({
        title: "Error",
        description: "Failed to delete test: " + error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchTests();
  }, [user, useDemoData]);

  return {
    tests,
    loading,
    createTest,
    generateAITest,
    deleteTest,
    fetchTests
  };
};