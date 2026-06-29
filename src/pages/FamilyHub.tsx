import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, FileText, ClipboardList, Newspaper, ChevronRight,
  Loader2, GraduationCap, Sparkles, Shield, MessageCircle,
  LayoutDashboard, CalendarCheck,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AttendanceSummaryCard } from '@/components/attendance/AttendanceSummaryCard';
import { NewsFeed } from '@/components/news/NewsFeed';
import { ParentTeacherMessaging } from '@/components/admin/ParentTeacherMessaging';
import { BehaviorCard } from '@/components/family/BehaviorCard';
import { RecentGradesCard } from '@/components/family/RecentGradesCard';
import { ReportCardsCard } from '@/components/family/ReportCardsCard';
import { EmptyHint } from '@/components/family/EmptyHint';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Family Hub — the parent's dashboard.
 *
 * Mirrors the teacher / school-admin dashboard pattern: a single shell with
 * grouped tab navigation, where each section (Grades, Behavior, Report Cards,
 * Invoices, News, Messages, Calendar) is its own focused view rather than one
 * long bundled scroll. The "Overview" tab is the at-a-glance dashboard.
 *
 * Every figure is read live from the database and is strictly scoped (by RLS)
 * to the signed-in parent's own children. There is NO mock or placeholder
 * student data — empty states are rendered explicitly.
 */

type FhTab =
  | 'overview' | 'grades' | 'attendance' | 'behavior'
  | 'report-cards' | 'news' | 'messages';

interface Child {
  id: string;
  name: string;
  avatarUrl: string | null;
}

const initials = (name: string) =>
  name.split(' ').map((w) => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || '?';

const FamilyHub = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isRTL = language === 'ar';

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FhTab>('overview');

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      // Children linked to this parent (RLS scopes to the parent's own links).
      const { data: rels } = await supabase
        .from('parent_child_relationships')
        .select('child_id')
        .eq('parent_id', user.id);

      const childIds = (rels || []).map((r) => r.child_id).filter(Boolean);
      if (childIds.length === 0) {
        if (!cancelled) { setChildren([]); setSelectedId(null); setLoading(false); }
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', childIds);

      const list: Child[] = (profiles || []).map((p) => ({
        id: p.id,
        name: p.display_name || t('fh.studentFallback'),
        avatarUrl: p.avatar_url,
      }));
      list.sort((a, b) => a.name.localeCompare(b.name));

      if (!cancelled) {
        setChildren(list);
        setSelectedId(list[0]?.id ?? null);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  const selectedChild = children.find((c) => c.id === selectedId) || null;

  // Tab definitions. Per-child tabs reflect the selected child; News / Messages /
  // Calendar are school-wide (RLS already scopes them to the parent's schools).
  const tabs: { value: FhTab; label: string; icon: React.ElementType }[] = [
    { value: 'overview', label: isRTL ? 'نظرة عامة' : 'Overview', icon: LayoutDashboard },
    { value: 'grades', label: t('nav.grades'), icon: ClipboardList },
    { value: 'attendance', label: isRTL ? 'الحضور' : 'Attendance', icon: CalendarCheck },
    { value: 'behavior', label: t('nav.behavior'), icon: Shield },
    { value: 'report-cards', label: t('nav.reportCards'), icon: FileText },
    { value: 'news', label: t('nav.news'), icon: Newspaper },
    { value: 'messages', label: t('nav.messages'), icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            {t('fh.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {children.length === 1 ? t('fh.subtitleOne') : t('fh.subtitleMany')}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> {t('fh.loading')}
          </div>
        ) : children.length === 0 ? (
          <NoChildrenState />
        ) : (
          <div className="space-y-6">
            {/* Child selector (only when more than one) */}
            {children.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {children.map((c) => {
                  const active = c.id === selectedId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        active
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card border-border hover:bg-muted'
                      }`}
                    >
                      <Avatar className="h-6 w-6">
                        {c.avatarUrl && <AvatarImage src={c.avatarUrl} alt={c.name} />}
                        <AvatarFallback className="text-[10px]">{initials(c.name)}</AvatarFallback>
                      </Avatar>
                      {c.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected child header */}
            {selectedChild && (
              <Card className="bg-card border-border">
                <CardContent className="p-5 flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-primary/20">
                    {selectedChild.avatarUrl && <AvatarImage src={selectedChild.avatarUrl} alt={selectedChild.name} />}
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {initials(selectedChild.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold truncate">{selectedChild.name}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" /> {t('fh.studentOverview')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabbed sections — same dashboard pattern as the teacher / admin view */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FhTab)} className="w-full">
              {/* Tab bar */}
              <div className="flex items-center gap-2 flex-wrap border-b border-border pb-3 mb-4">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.value;
                  return (
                    <Button
                      key={tab.value}
                      variant={active ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab(tab.value)}
                      className="whitespace-nowrap"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.label}
                    </Button>
                  );
                })}
              </div>

              {/* Hidden TabsList for accessibility / keyboard nav */}
              <TabsList className="sr-only">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                ))}
              </TabsList>

              <div className="mt-2">
                {selectedChild && (
                  <>
                    <TabsContent value="overview">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AttendanceSummaryCard studentId={selectedChild.id} studentName={selectedChild.name} />
                        <RecentGradesCard studentId={selectedChild.id} />
                        <BehaviorCard studentId={selectedChild.id} />
                        <ReportCardsCard studentId={selectedChild.id} onOpen={() => setActiveTab('report-cards')} />
                      </div>
                    </TabsContent>

                    <TabsContent value="grades">
                      <RecentGradesCard studentId={selectedChild.id} />
                    </TabsContent>

                    <TabsContent value="attendance">
                      <AttendanceSummaryCard studentId={selectedChild.id} studentName={selectedChild.name} />
                    </TabsContent>

                    <TabsContent value="behavior">
                      <BehaviorCard studentId={selectedChild.id} />
                    </TabsContent>

                    <TabsContent value="report-cards">
                      <ReportCardsCard studentId={selectedChild.id} onOpen={() => navigate('/report-cards')} />
                    </TabsContent>
                  </>
                )}

                <TabsContent value="news"><NewsFeed /></TabsContent>
                <TabsContent value="messages"><ParentTeacherMessaging /></TabsContent>
              </div>
            </Tabs>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

const NoChildrenState = () => {
  const { t } = useLanguage();
  return (
  <Card className="bg-card border-border">
    <CardContent className="p-10 text-center max-w-md mx-auto">
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Users className="h-7 w-7 text-primary" />
      </div>
      <h2 className="text-lg font-semibold mb-2">{t('fh.noChildrenTitle')}</h2>
      <p className="text-sm text-muted-foreground mb-5">
        {t('fh.noChildrenDesc')}
      </p>
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" />
        {t('fh.askAdmin')}
      </div>
    </CardContent>
  </Card>
  );
};

export default FamilyHub;
