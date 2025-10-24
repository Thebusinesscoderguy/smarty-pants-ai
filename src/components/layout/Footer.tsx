
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="w-full px-4 md:px-6 py-6 border-t border-white/[0.08] bg-[#0A0118]/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <p className="text-white/60 text-sm font-light">{t('footer.copyright')}</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <Link to="/how-it-works" className="text-white/60 hover:text-purple-400 text-sm transition-colors font-light">{t('footer.howItWorks')}</Link>
          <a href="#" className="text-white/60 hover:text-purple-400 text-sm transition-colors font-light">{t('footer.terms')}</a>
          <a href="#" className="text-white/60 hover:text-purple-400 text-sm transition-colors font-light">{t('footer.privacy')}</a>
          <Link to="/pricing" className="text-white/60 hover:text-purple-400 text-sm transition-colors font-light">{t('footer.pricing')}</Link>
        </div>
      </div>
    </footer>
  );
};
