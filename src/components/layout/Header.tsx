import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, School, Trophy, Menu, X, Newspaper, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { BookDemoModal } from '@/components/demo/BookDemoModal';

export const Header = () => {
  const navigate = useNavigate();
  const { user, signOut, isSchoolAdmin, isTeacher } = useAuth();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/features', label: t('nav.features') },
    { to: '/pricing', label: t('nav.pricing') },
    { to: '/faq', label: 'FAQ' },
  ];

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navLinks.map(link => (
        <Link
          key={link.to}
          to={link.to}
          onClick={() => mobile && setMobileOpen(false)}
          className={`text-foreground/70 hover:text-foreground font-medium transition-colors ${mobile ? 'block py-2 text-lg' : ''}`}
        >
          {link.label}
        </Link>
      ))}
      {user && (
        <>
          {isSchoolAdmin && (
            <Link
              to="/school-admin"
              onClick={() => mobile && setMobileOpen(false)}
              className={`inline-flex items-center gap-1.5 text-foreground/70 hover:text-foreground font-medium transition-colors ${mobile ? 'py-2 text-lg' : ''}`}
            >
              <School className="w-4 h-4" />
              {t('nav.schoolAdmin') || 'School Admin'}
            </Link>
          )}
          {isTeacher && !isSchoolAdmin && (
            <Link
              to="/school-admin"
              onClick={() => mobile && setMobileOpen(false)}
              className={`inline-flex items-center gap-1.5 text-foreground/70 hover:text-foreground font-medium transition-colors ${mobile ? 'py-2 text-lg' : ''}`}
            >
              <School className="w-4 h-4" />
              Teacher Dashboard
            </Link>
          )}
          <Link
            to="/news"
            onClick={() => mobile && setMobileOpen(false)}
            className={`inline-flex items-center gap-1.5 text-foreground/70 hover:text-foreground font-medium transition-colors ${mobile ? 'py-2 text-lg' : ''}`}
          >
            <Newspaper className="w-4 h-4" />
            News
          </Link>
          <Link
            to="/leaderboard"
            onClick={() => mobile && setMobileOpen(false)}
            className={`inline-flex items-center gap-1.5 text-foreground/70 hover:text-foreground font-medium transition-colors ${mobile ? 'py-2 text-lg' : ''}`}
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="w-full px-4 md:px-6 py-4 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-xl font-semibold text-foreground hover:text-foreground/80">
          <GraduationCap className="w-6 h-6" />
          Teachly
        </Link>
        
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-6">
          <NavItems />
          <LanguageSelector />
          {!user && (
            <Button onClick={() => setDemoOpen(true)} variant="outline" size="sm" className="rounded-full border-primary/40 text-primary hover:bg-primary/10">
              <Calendar className="w-4 h-4 mr-1.5" />Book a demo
            </Button>
          )}
          {user ? (
            <Button onClick={handleSignOut} variant="outline" size="sm" className="rounded-full">
              {t('nav.signOut')}
            </Button>
          ) : (
            <Button onClick={() => navigate('/auth')} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
              {t('nav.getStarted')}
            </Button>
          )}
        </nav>

        {/* Mobile nav */}
        <div className="md:hidden flex items-center gap-2">
          <LanguageSelector />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] pt-12">
              <nav className="flex flex-col space-y-1">
                <NavItems mobile />
                <div className="pt-4 border-t border-border mt-4 space-y-2">
                  {!user && (
                    <Button onClick={() => { setDemoOpen(true); setMobileOpen(false); }} variant="outline" className="w-full rounded-full border-primary/40 text-primary">
                      <Calendar className="w-4 h-4 mr-1.5" />Book a demo
                    </Button>
                  )}
                  {user ? (
                    <Button onClick={() => { handleSignOut(); setMobileOpen(false); }} variant="outline" className="w-full rounded-full">
                      {t('nav.signOut')}
                    </Button>
                  ) : (
                    <Button onClick={() => { navigate('/auth'); setMobileOpen(false); }} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                      {t('nav.getStarted')}
                    </Button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <BookDemoModal open={demoOpen} onOpenChange={setDemoOpen} />
    </header>
  );
};
