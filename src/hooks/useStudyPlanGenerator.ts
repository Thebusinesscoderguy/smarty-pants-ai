import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

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
  practiceQuestions: number;
}

export const useStudyPlanGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateStudyPlan = async (
    inputData: string,
    inputType: 'file' | 'chat' | 'topic',
    opts?: { gradeLevel?: string; region?: string; days?: number; maxDailyMinutes?: number }
  ): Promise<StudyPlan | null> => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-study-plan', {
        body: {
          inputData,
          inputType,
          gradeLevel: opts?.gradeLevel,
          region: opts?.region,
          days: opts?.days,
          maxDailyMinutes: opts?.maxDailyMinutes
        }
      });

      if (error) throw error;

      return data as StudyPlan;
    } catch (error: any) {
      console.error('Error generating study plan:', error);
      const status = error?.context?.response?.status || error?.status;
      const msg = String(error?.message || '');
      let description = 'Failed to generate study plan.';
      if (status === 429 || /rate limit/i.test(msg)) {
        description = 'OpenAI rate limit reached. Please wait and try again shortly.';
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
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    generateStudyPlan
  };
};