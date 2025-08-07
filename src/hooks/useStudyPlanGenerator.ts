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
    inputType: 'file' | 'chat' | 'topic'
  ): Promise<StudyPlan | null> => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-study-plan', {
        body: {
          inputData,
          inputType
        }
      });

      if (error) throw error;

      return data as StudyPlan;
    } catch (error: any) {
      console.error('Error generating study plan:', error);
      toast({
        title: "Error",
        description: "Failed to generate study plan: " + error.message,
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