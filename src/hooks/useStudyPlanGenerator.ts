import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { language } = useLanguage();

  const generateStudyPlan = async (
    inputData: string,
    inputType: 'file' | 'chat' | 'topic',
    opts?: { 
      gradeLevel?: string; 
      region?: string; 
      days?: number; 
      maxDailyMinutes?: number;
      fileUrl?: string;
      fileType?: 'pdf' | 'image' | 'docx' | 'text';
    }
  ): Promise<StudyPlan | null> => {
    setIsGenerating(true);
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    
    try {
      console.log('[useStudyPlanGenerator] Starting generation with:', { inputType, inputDataLength: inputData?.length, language });
      const invokePromise = supabase.functions.invoke('generate-study-plan', {
        body: {
          inputData,
          inputType,
          gradeLevel: opts?.gradeLevel,
          region: opts?.region,
          days: opts?.days,
          maxDailyMinutes: opts?.maxDailyMinutes,
          fileUrl: opts?.fileUrl,
          fileType: opts?.fileType,
          language
        }
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Request timed out')), 120000);
      });
      
      const result = await Promise.race([invokePromise, timeoutPromise]) as { data: any; error: any };
      clearTimeout(timeoutId);

      const { data, error } = result;
      console.log('[useStudyPlanGenerator] Response:', { hasData: !!data, hasError: !!error, errorMsg: error?.message, dataType: typeof data });

      if (error) {
        const status = (error as any)?.context?.response?.status ?? (error as any)?.status;
        const message = (error as any)?.message || 'Failed to generate study plan';
        console.error('[useStudyPlanGenerator] Function invoke error:', { status, message, error });
        throw { ...error, status, message };
      }

      if (!data) {
        console.error('[useStudyPlanGenerator] No data returned');
        throw new Error('No study plan returned');
      }

      if (data.error) {
        console.error('[useStudyPlanGenerator] Data contains error:', data.error);
        throw new Error(data.error);
      }

      console.log('[useStudyPlanGenerator] Success, plan title:', data?.title);
      return data as StudyPlan;
    } catch (error: any) {
      console.error('Error generating study plan:', error);
      const status = error?.context?.response?.status || error?.status;
      const msg = String(error?.message || '');
      const errorCode = error?.errorCode;
      
      let description = 'Failed to generate study plan.';
      
      if (errorCode === 'PDF_NO_TEXT') {
        description = 'This PDF appears to be scanned or image-based. Please upload a text-based PDF or take a photo of the content.';
      } else if (errorCode === 'FILE_TOO_LARGE') {
        description = 'File is too large to process. Please try a smaller file (under 50MB).';
      } else if (errorCode === 'UNSUPPORTED_FILE') {
        description = 'This file type is not supported. Please upload a PDF, image, DOCX, or text file.';
      } else if (errorCode === 'STORAGE_ERROR') {
        description = 'Failed to access the uploaded file. Please try uploading again.';
      } else if (error?.name === 'AbortError' || /aborted|AbortError|timed out|timeout/i.test(msg)) {
        description = 'Request timed out. Large files may take longer - please try again.';
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
      if (timeoutId) clearTimeout(timeoutId);
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    generateStudyPlan
  };
};
