import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface StudyPlan {
  id: string;
  title: string;
  description: string;
  weakAreas: string[];
  dailyLessons: DailyLesson[];
  estimatedDuration: number;
  difficultyLevel: 'easy' | 'medium' | 'hard';
}

interface DailyLesson {
  day: number;
  topic: string;
  description: string;
  activities: string[];
  estimatedTime: number;
  exampleQuestions?: Array<{
    question: string;
    solution: string;
  }>;
}

export const useStudyPlanGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateStudyPlan = async (
    inputData: string,
    inputType: 'file' | 'chat' | 'topic',
    opts?: { gradeLevel?: string; region?: string; days?: number; maxDailyMinutes?: number }
  ): Promise<StudyPlan | null> => {
    setIsGenerating(true);
    let timeoutId: any;
    try {
      const invokePromise = supabase.functions.invoke('generate-study-plan', {
        body: {
          inputData,
          inputType,
          gradeLevel: opts?.gradeLevel,
          region: opts?.region,
          days: opts?.days,
          maxDailyMinutes: opts?.maxDailyMinutes
        }
      });
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Request timed out')), 60000);
      });
      const result = await Promise.race([invokePromise, timeoutPromise]) as { data: any; error: any };
      clearTimeout(timeoutId);

      const { data, error } = result;

      if (error) {
        const status = (error as any)?.context?.response?.status ?? (error as any)?.status;
        const message = (error as any)?.message || 'Failed to generate study plan';
        throw { ...error, status, message };
      }

      if (!data) {
        throw new Error('No study plan returned');
      }

      return data as StudyPlan;
    } catch (error: any) {
      console.error('Error generating study plan:', error);
      const status = error?.context?.response?.status || error?.status;
      const msg = String(error?.message || '');
      let description = 'Failed to generate study plan.';
      if (error?.name === 'AbortError' || /aborted|AbortError|timed out|timeout/i.test(msg)) {
        description = 'Request timed out. Please try again in a moment.';
      } else if (status === 429 || /rate limit/i.test(msg)) {
        description = 'AI rate limit reached. Please wait and try again shortly.';
      } else if (status === 402) {
        description = 'Payment required for AI usage. Please add credits to your Lovable AI workspace.';
      } else if (typeof status === 'number') {
        description = `Server error (${status}). Please try again.`;
      } else if (msg) {
        description = msg;
      }
      toast({
        title: "Error",
        description,
        variant: "destructive"
      });
      return null;
    } finally {
      try { clearTimeout(timeoutId); } catch {}
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    generateStudyPlan
  };
};