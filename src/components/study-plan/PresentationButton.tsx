import { Button } from '@/components/ui/button';
import { Presentation, Loader2 } from 'lucide-react';
import { usePresentationGenerator } from '@/hooks/usePresentationGenerator';
import { useLanguage } from '@/contexts/LanguageContext';

interface PresentationButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const PresentationButton = ({ 
  variant = 'outline', 
  size = 'default',
  className = ''
}: PresentationButtonProps) => {
  const { isGenerating, generatePresentation } = usePresentationGenerator();
  const { language } = useLanguage();

  const isArabic = language === 'ar';
  const buttonText = isArabic ? 'تحميل العرض التقديمي' : 'Download Presentation';
  const loadingText = isArabic ? 'جاري الإنشاء...' : 'Generating...';

  return (
    <Button
      variant={variant}
      size={size}
      onClick={generatePresentation}
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
          <Presentation className="h-4 w-4 mr-2" />
          {buttonText}
        </>
      )}
    </Button>
  );
};
