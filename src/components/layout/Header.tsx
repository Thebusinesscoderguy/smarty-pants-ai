import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';

export const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  return (
    <header className="w-full px-6 py-4 bg-primary backdrop-blur-sm border-b border-primary">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-xl font-semibold text-primary-foreground hover:text-primary-foreground/80">
          <GraduationCap className="w-6 h-6" />
          Teachly
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-primary-foreground/90 hover:text-primary-foreground font-medium transition-colors">{t('nav.home')}</Link>
          <Link to="/features" className="text-primary-foreground/90 hover:text-primary-foreground font-medium transition-colors">{t('nav.features')}</Link>
          <Link to="/how-it-works" className="text-primary-foreground/90 hover:text-primary-foreground font-medium transition-colors">{t('nav.howItWorks')}</Link>
          <Link to="/pricing" className="text-primary-foreground/90 hover:text-primary-foreground font-medium transition-colors">{t('nav.pricing')}</Link>
          <Link to="/faq" className="text-primary-foreground/90 hover:text-primary-foreground font-medium transition-colors">FAQ</Link>
          
          {user ? (
            <>
              <LanguageSelector />
              <Button
                onClick={handleSignOut}
                variant="outline" 
                size="sm"
                className="rounded-full border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                {t('nav.signOut')}
              </Button>
            </>
          ) : (
            <>
              <LanguageSelector />
              <Button 
                onClick={() => navigate('/auth')}
                size="sm"
                className="bg-primary-foreground hover:bg-primary-foreground/90 text-primary rounded-full"
              >
                {t('nav.getStarted')}
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
