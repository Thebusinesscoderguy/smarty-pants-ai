import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { usePDFStudyPlanGenerator } from '@/hooks/usePDFStudyPlanGenerator';
import { useLanguage } from '@/contexts/LanguageContext';

interface PDFStudyPlanButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const PDFStudyPlanButton = ({ 
  variant = 'outline', 
  size = 'default',
  className = ''
}: PDFStudyPlanButtonProps) => {
  const { isGenerating, generatePDF } = usePDFStudyPlanGenerator();
  const { language } = useLanguage();

  const isArabic = language === 'ar';
  const buttonText = isArabic ? 'تحميل خطة الدراسة PDF' : 'Download Study Plan PDF';
  const loadingText = isArabic ? 'جاري الإنشاء...' : 'Generating...';

  return (
    <Button
      variant={variant}
      size={size}
      onClick={generatePDF}
      disabled={isGenerating}
      className={className}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {loadingText}
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4 mr-2" />
          {buttonText}
        </>
      )}
    </Button>
  );
};
