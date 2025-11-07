
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="w-full px-4 md:px-6 py-12 border-t border-border/30 relative">
      {/* Gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="text-2xl font-bold gradient-text">Teachly</div>
          
          <div className="flex flex-wrap justify-center gap-8">
            <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">{t('footer.howItWorks')}</Link>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">{t('footer.terms')}</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">{t('footer.privacy')}</a>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">{t('footer.pricing')}</Link>
          </div>
          
          <p className="text-muted-foreground text-sm">{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
};
