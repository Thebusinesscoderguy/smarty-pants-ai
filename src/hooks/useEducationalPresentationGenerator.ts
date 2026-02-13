import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

export interface PresentationSettings {
  topic: string;
  gradeLevel: string;
  slideCount: number;
  style: 'educational' | 'fun' | 'visual' | 'concise';
  includeQuiz: boolean;
  includeExamples: boolean;
}

export interface AlaiPresentationResult {
  success: boolean;
  generationId: string;
  title: string;
  presentationUrl: string | null;
  pptUrl: string | null;
  pdfUrl: string | null;
  slideCount: number;
  topic: string;
}

export const useEducationalPresentationGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPresentation, setGeneratedPresentation] = useState<AlaiPresentationResult | null>(null);
  const { language } = useLanguage();

  const generatePresentation = async (settings: PresentationSettings): Promise<AlaiPresentationResult | null> => {
    setIsGenerating(true);
    setGeneratedPresentation(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-presentation', {
        body: { ...settings, language }
      });

      if (error) {
        const status = (error as any)?.status;
        if (status === 429) throw new Error(language === 'ar' ? 'تم تجاوز الحد. حاول مرة أخرى.' : 'Rate limit exceeded. Please try again.');
        if (status === 402) throw new Error(language === 'ar' ? 'مطلوب الدفع. الرجاء إضافة رصيد.' : 'Payment required. Please add credits.');
        throw error;
      }

      if (data?.error) throw new Error(data.error);

      setGeneratedPresentation(data);
      toast({
        title: language === 'ar' ? 'تم الإنشاء!' : 'Generated!',
        description: language === 'ar' ? 'العرض التقديمي جاهز للتحميل' : 'Presentation ready to download',
      });
      return data;
    } catch (error: any) {
      console.error('Error generating presentation:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'فشل في إنشاء العرض' : 'Failed to generate presentation'),
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    generatedPresentation,
    generatePresentation,
    setGeneratedPresentation
  };
};
