import { useState } from 'react';
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://twfzlbockonxopuindaw.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZnpsYm9ja29ueG9wdWluZGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MDE5NTAsImV4cCI6MjA1ODk3Nzk1MH0.MKUGpLxfF5bhtqOAo0aBs0daOMpMfkIqgwZ2ntIvQi4";

export const useStudyPlanGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { language } = useLanguage();

  const callEdgeFunction = async (body: Record<string, unknown>): Promise<StudyPlan> => {
    const url = `${SUPABASE_URL}/functions/v1/generate-study-plan`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120000); // 2 min timeout

    try {
      console.log('[useStudyPlanGenerator] Calling edge function directly via fetch');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);

      const contentType = response.headers.get('content-type') || '';
      console.log('[useStudyPlanGenerator] Response status:', response.status, 'content-type:', contentType);

      // Gateway returned HTML error page (502/504 timeout)
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[useStudyPlanGenerator] Non-JSON response:', text.substring(0, 200));
        throw new Error('GATEWAY_TIMEOUT');
      }

      const data = await response.json();

      if (!response.ok) {
        console.error('[useStudyPlanGenerator] Error response:', data);
        if (data.errorCode) {
          throw { ...data, status: response.status };
        }
        throw { message: data.error || data.message || `Server error (${response.status})`, status: response.status };
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data || !data.title) {
        throw new Error('Invalid study plan response');
      }

      return data as StudyPlan;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

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
    
    const body = {
      inputData,
      inputType,
      gradeLevel: opts?.gradeLevel,
      region: opts?.region,
      days: opts?.days,
      maxDailyMinutes: opts?.maxDailyMinutes,
      fileUrl: opts?.fileUrl,
      fileType: opts?.fileType,
      language
    };

    try {
      console.log('[useStudyPlanGenerator] Starting generation with:', { inputType, inputDataLength: inputData?.length, language });
      
      // First attempt
      try {
        const plan = await callEdgeFunction(body);
        console.log('[useStudyPlanGenerator] Success on first attempt, plan title:', plan.title);
        return plan;
      } catch (firstError: any) {
        const isRetryable = 
          firstError?.message === 'GATEWAY_TIMEOUT' ||
          firstError?.name === 'AbortError' ||
          /timed out|timeout|aborted|fetch/i.test(String(firstError?.message || ''));
        
        if (!isRetryable) throw firstError;
        
        console.log('[useStudyPlanGenerator] First attempt failed with retryable error, retrying in 3s...');
        await new Promise(r => setTimeout(r, 3000));
        
        // Second attempt
        const plan = await callEdgeFunction(body);
        console.log('[useStudyPlanGenerator] Success on retry, plan title:', plan.title);
        return plan;
      }
    } catch (error: any) {
      console.error('[useStudyPlanGenerator] Error:', error);
      const status = error?.status;
      const msg = String(error?.message || '');
      const errorCode = error?.errorCode;
      
      let description = 'Failed to generate study plan.';
      
      if (msg === 'GATEWAY_TIMEOUT') {
        description = 'The server took too long to respond. Try reducing the number of days or try again.';
      } else if (errorCode === 'PDF_NO_TEXT') {
        description = 'This PDF appears to be scanned or image-based. Please upload a text-based PDF or take a photo of the content.';
      } else if (errorCode === 'FILE_TOO_LARGE') {
        description = 'File is too large to process. Please try a smaller file (under 50MB).';
      } else if (errorCode === 'UNSUPPORTED_FILE') {
        description = 'This file type is not supported. Please upload a PDF, image, DOCX, or text file.';
      } else if (errorCode === 'STORAGE_ERROR') {
        description = 'Failed to access the uploaded file. Please try uploading again.';
      } else if (error?.name === 'AbortError' || /aborted|AbortError|timed out|timeout/i.test(msg)) {
        description = 'Request timed out. Please try again — it may work on the second attempt.';
      } else if (status === 429 || /rate limit/i.test(msg)) {
        description = 'AI rate limit reached. Please wait and try again shortly.';
      } else if (status === 402) {
        description = 'Payment required for AI usage. Please add credits to your Lovable AI workspace.';
      } else if (typeof status === 'number' && status >= 400) {
        description = `Server error (${status}). Please try again.`;
      } else if (msg && msg !== 'GATEWAY_TIMEOUT') {
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
