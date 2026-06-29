import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, School, Trophy, Menu, Newspaper, Inbox as InboxIcon, Receipt, Home, FileText, MessageCircle, Shield, ClipboardList, ClipboardCheck, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';

export const Header = () => {
  const navigate = useNavigate();
  const { user, signOut, isSchoolAdmin, isTeacher } = useAuth();
  const { userRole } = useUserRole();
  const { t, language } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSchoolStudent, setIsSchoolStudent] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
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

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    let cancelled = false;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('parent_teacher_messages')
        .select('id', { count: 'exact', head: true })
        .is('read_at', null)
        .neq('sender_id', user.id);
      if (!cancelled) setUnreadCount(count || 0);
    };
    fetchUnread();
    const channel = supabase
      .channel('inbox-unread')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parent_teacher_messages' }, fetchUnread)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [user]);

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
          {userRole === 'parent' && (
            <Link
              to="/family-hub"
              onClick={() => mobile && setMobileOpen(false)}
              className={`relative inline-flex items-center gap-1.5 text-foreground/70 hover:text-foreground font-medium transition-colors ${mobile ? 'py-2 text-lg' : ''}`}
            >
              <Home className="w-4 h-4" />
              {t('nav.familyHub')}
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </Link>
          )}
          {userRole === 'student' && (
            <>
              {/* School-enrolled students get their school surfaces; self-study
                  users (no active school_student_relationships) do not. */}
              {isSchoolStudent && (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => mobile && setMobileOpen(false)}
                    className={`inline-flex items-center gap-1.5 text-foreground/70 hover:text-foreground font-medium transition-colors ${mobile ? 'py-2 text-lg' : ''}`}
                  >
                    <Home className="w-4 h-4" />
                    {t('nav.dashboard')}
                  </Link>
                  <Link
                    to="/news"
                    onClick={() => mobile && setMobileOpen(false)}
                    className={`inline-flex items-center gap-1.5 text-foreground/70 hover:text-foreground font-medium transition-colors ${mobile ? 'py-2 text-lg' : ''}`}
                  >
                    <Newspaper className="w-4 h-4" />
                    {t('nav.news')}
                  </Link>
                  <Link
                    to="/assessments"
                    onClick={() => mobile && setMobileOpen(false)}
                    className={`inline-flex items-center gap-1.5 text-foreground/70 hover:text-foreground font-medium transition-colors ${mobile ? 'py-2 text-lg' : ''}`}
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    {t('nav.assessments')}
                  </Link>
                  <Link
                    to="/report-cards"
                    onClick={() => mobile && setMobileOpen(false)}
                    className={`inline-flex items-center gap-1.5 text-foreground/70 hover:text-foreground font-medium transition-colors ${mobile ? 'py-2 text-lg' : ''}`}
                  >
                    <FileText className="w-4 h-4" />
                    {t('nav.reportCards')}
                  </Link>
                  <Link
                    to="/grades"
                    onClick={() => mobile && setMobileOpen(false)}
                    className={`inline-flex items-center gap-1.5 text-foreground/70 hover:text-foreground font-medium transition-colors ${mobile ? 'py-2 text-lg' : ''}`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    {t('nav.grades')}
                  </Link>
                </>
              )}
              {/* Study Tools stays reachable for every student (enrolled + self-study). */}
              <Link
                to="/quiz-generator"
                onClick={() => mobile && setMobileOpen(false)}
                className={`inline-flex items-center gap-1.5 text-foreground/70 hover:text-foreground font-medium transition-colors ${mobile ? 'py-2 text-lg' : ''}`}
              >
                <BookOpen className="w-4 h-4" />
                {t('nav.studyTools')}
              </Link>
            </>
          )}
          {userRole !== 'parent' && (
            <Link
              to="/inbox"
              onClick={() => mobile && setMobileOpen(false)}
              className={`relative inline-flex items-center gap-1.5 text-foreground/70 hover:text-foreground font-medium transition-colors ${mobile ? 'py-2 text-lg' : ''}`}
            >
              <InboxIcon className="w-4 h-4" />
              {language === 'ar' ? 'الوارد' : 'Inbox'}
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </Link>
          )}
          {!isSchoolAdmin && !isTeacher && (
            <Link
              to="/invoices"
              onClick={() => mobile && setMobileOpen(false)}
              className={`inline-flex items-center gap-1.5 text-foreground/70 hover:text-foreground font-medium transition-colors ${mobile ? 'py-2 text-lg' : ''}`}
            >
              <Receipt className="w-4 h-4" />
              {language === 'ar' ? 'الفواتير' : 'Invoices'}
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
