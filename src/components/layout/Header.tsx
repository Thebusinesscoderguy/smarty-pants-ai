
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <header className="relative z-20 px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-2xl font-bold text-white">TeachlyAI</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-white/80 hover:text-white transition-colors">
              {t('nav.features')}
            </a>
            <a href="#pricing" className="text-white/80 hover:text-white transition-colors">
              {t('nav.pricing')}
            </a>
            <a href="#about" className="text-white/80 hover:text-white transition-colors">
              {t('nav.about')}
            </a>
            <a href="#contact" className="text-white/80 hover:text-white transition-colors">
              {t('nav.contact')}
            </a>
            <LanguageSelector />
            <Button 
              variant="outline" 
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              Sign In
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            <LanguageSelector />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:bg-white/10"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-6 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <div className="flex flex-col space-y-4">
              <a href="#features" className="text-white/80 hover:text-white transition-colors py-2">
                {t('nav.features')}
              </a>
              <a href="#pricing" className="text-white/80 hover:text-white transition-colors py-2">
                {t('nav.pricing')}
              </a>
              <a href="#about" className="text-white/80 hover:text-white transition-colors py-2">
                {t('nav.about')}
              </a>
              <a href="#contact" className="text-white/80 hover:text-white transition-colors py-2">
                {t('nav.contact')}
              </a>
              <Button 
                variant="outline" 
                className="border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm mt-4"
              >
                Sign In
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
