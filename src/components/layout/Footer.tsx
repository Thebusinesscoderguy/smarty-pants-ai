
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="w-full px-6 py-12 border-t border-border bg-muted/30">
      <div className="container mx-auto">
        <div className="flex flex-col items-center space-y-6">
          <div className="h-px w-full max-w-md bg-gradient-to-r from-transparent via-border to-transparent" />
          <p className="text-muted-foreground text-sm text-center">{t('footer.copyright')}</p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/terms" className="text-muted-foreground hover:text-foreground text-sm transition-colors">{t('footer.terms')}</Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground text-sm transition-colors">{t('footer.privacy')}</Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground text-sm transition-colors">{t('footer.pricing')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
