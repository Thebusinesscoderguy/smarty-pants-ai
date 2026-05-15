import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, School, Trophy, Menu, Newspaper, Inbox as InboxIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';

export const Header = () => {
  const navigate = useNavigate();
  const { user, signOut, isSchoolAdmin, isTeacher } = useAuth();
  const { t, language } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSchoolStudent, setIsSchoolStudent] = useState(false);
  const isRTL = language === 'ar';

  useEffect(() => {
    let cancelled = false;
    if (!user || isSchoolAdmin || isTeacher) {
      setIsSchoolStudent(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('school_student_relationships')
        .select('school_id')
        .eq('student_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      if (!cancelled) setIsSchoolStudent(!!data);
    })();
    return () => { cancelled = true; };
  }, [user, isSchoolAdmin, isTeacher]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast.success(t('auth.signOutSuccess'));
    } catch (error) {
      toast.error(t('auth.signOutError'));
    }
  };

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/features', label: language === 'ar' ? 'للمدارس' : 'For Schools' },
    { to: '/pricing', label: t('nav.pricing') },
    { to: '/faq', label: t('nav.faq') },
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
              {t('nav.schoolAdmin')}
            </Link>
          )}
          {isTeacher && !isSchoolAdmin && (
            <Link
              to="/school-admin"
              onClick={() => mobile && setMobileOpen(false)}
              className={`inline-flex items-center gap-1.5 text-foreground/70 hover:text-foreground font-medium transition-colors ${mobile ? 'py-2 text-lg' : ''}`}
            >
              <School className="w-4 h-4" />
              {t('nav.teacherDashboard')}
            </Link>
          )}
          {(isSchoolAdmin || isTeacher || isSchoolStudent) && (
            <Link
              to="/news"
              onClick={() => mobile && setMobileOpen(false)}
              className={`inline-flex items-center gap-1.5 text-foreground/70 hover:text-foreground font-medium transition-colors ${mobile ? 'py-2 text-lg' : ''}`}
            >
              <Newspaper className="w-4 h-4" />
              {t('nav.news')}
            </Link>
          )}
          <Link
            to="/leaderboard"
            onClick={() => mobile && setMobileOpen(false)}
            className={`inline-flex items-center gap-1.5 text-foreground/70 hover:text-foreground font-medium transition-colors ${mobile ? 'py-2 text-lg' : ''}`}
          >
            <Trophy className="w-4 h-4" />
            {t('nav.leaderboard')}
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
        <nav className={`hidden md:flex items-center ${isRTL ? 'space-x-reverse space-x-6' : 'space-x-6'}`}>
          <NavItems />
          <LanguageSelector />
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
            <SheetContent side={isRTL ? 'left' : 'right'} className="w-[280px] pt-12">
              <nav className="flex flex-col space-y-1">
                <NavItems mobile />
                <div className="pt-4 border-t border-border mt-4 space-y-2">
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
    </header>
  );
};
