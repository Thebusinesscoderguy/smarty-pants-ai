
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  console.log('Header rendering with language:', language);
  console.log('Header: t function type:', typeof t);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  // Pre-compute translations to debug
  const featuresText = t('nav.features');
  const pricingText = t('nav.pricing');
  const aboutText = t('nav.about');
  const contactText = t('nav.contact');

  console.log('Header translations:', {
    features: featuresText,
    pricing: pricingText,
    about: aboutText,
    contact: contactText
  });

  return (
    <header className="relative z-20 px-4 py-6 md:px-6 lg:px-8 bg-transparent">
      <div className="max-w-6xl mx-auto">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-2xl font-bold text-black">TeachlyAI</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('features')}
              className="text-black/70 hover:text-black transition-colors font-medium"
            >
              {featuresText}
            </button>
            <button 
              onClick={() => scrollToSection('pricing')}
              className="text-black/70 hover:text-black transition-colors font-medium"
            >
              {pricingText}
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className="text-black/70 hover:text-black transition-colors font-medium"
            >
              {aboutText}
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="text-black/70 hover:text-black transition-colors font-medium"
            >
              {contactText}
            </button>
            <LanguageSelector />
            {user ? (
                <Button 
                  onClick={handleSignOut}
                  variant="outline" 
                  className="border-black/20 bg-white/50 text-black hover:bg-white"
                >
                  {t('auth.signout')}
                </Button>
            ) : (
              <>
                <Button 
                  onClick={() => navigate('/auth')}
                  variant="ghost" 
                  className="text-black hover:bg-black/5"
                >
                  {t('auth.login')}
                </Button>
                <Button 
                  onClick={() => navigate('/auth?signup=true')}
                  className="bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-full"
                >
                  {t('auth.signup')}
                </Button>
              </>
            )}
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
              <button 
                onClick={() => scrollToSection('features')}
                className="text-white/80 hover:text-white transition-colors py-2 text-left"
              >
                {featuresText}
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-white/80 hover:text-white transition-colors py-2 text-left"
              >
                {pricingText}
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="text-white/80 hover:text-white transition-colors py-2 text-left"
              >
                {aboutText}
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-white/80 hover:text-white transition-colors py-2 text-left"
              >
                {contactText}
              </button>
              <div className="flex flex-col space-y-2 pt-2">
                {user ? (
                  <Button 
                    onClick={handleSignOut}
                    variant="outline" 
                    className="border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                  >
                    {t('auth.signout')}
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={() => navigate('/auth')}
                      variant="outline" 
                      className="border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                    >
                      {t('auth.login')}
                    </Button>
                    <Button 
                      onClick={() => navigate('/auth?signup=true')}
                      className="bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-400 hover:to-fuchsia-500 text-white border-0"
                    >
                      {t('auth.signup')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
