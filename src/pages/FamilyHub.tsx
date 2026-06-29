import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, FileText, ClipboardList, Receipt, Newspaper, ChevronRight,
  Loader2, GraduationCap, Sparkles, Shield, MessageCircle,
  LayoutDashboard, CalendarCheck, CalendarDays,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AttendanceSummaryCard } from '@/components/attendance/AttendanceSummaryCard';
import { NewsFeed } from '@/components/news/NewsFeed';
import { SchoolCalendarView } from '@/components/calendar/SchoolCalendarView';
import { ParentTeacherMessaging } from '@/components/admin/ParentTeacherMessaging';
import { BehaviorCard } from '@/components/family/BehaviorCard';
import { RecentGradesCard } from '@/components/family/RecentGradesCard';
import { EmptyHint } from '@/components/family/EmptyHint';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

const FH_STATUS_KEY: Record<string, string> = { issued: 'inv.statusIssued', paid: 'inv.statusPaid', overdue: 'inv.statusOverdue', void: 'inv.statusVoid', draft: 'inv.statusDraft' };

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
  | 'report-cards' | 'invoices' | 'news' | 'messages' | 'calendar';

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
    { value: 'invoices', label: isRTL ? 'الفواتير' : 'Invoices', icon: Receipt },
    { value: 'news', label: t('nav.news'), icon: Newspaper },
    { value: 'messages', label: t('nav.messages'), icon: MessageCircle },
    { value: 'calendar', label: t('fh.schoolCalendar'), icon: CalendarDays },
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

                    <TabsContent value="invoices">
                      <InvoicesCard studentId={selectedChild.id} onOpen={() => navigate('/invoices')} />
                    </TabsContent>
                  </>
                )}

                <TabsContent value="news"><NewsFeed /></TabsContent>
                <TabsContent value="messages"><ParentTeacherMessaging /></TabsContent>
                <TabsContent value="calendar"><SchoolCalendarView /></TabsContent>
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
/* Report cards                                                        */
/* ------------------------------------------------------------------ */

interface ReportCardRow {
  id: string;
  term: string;
  academic_year: string;
  published_at: string | null;
  pdf_url: string | null;
}

const ReportCardsCard = ({ studentId, onOpen }: { studentId: string; onOpen: () => void }) => {
  const { t } = useLanguage();
  const [rows, setRows] = useState<ReportCardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('report_cards')
        .select('id, term, academic_year, published_at, pdf_url')
        .eq('student_id', studentId)
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(4);
      if (!cancelled) { setRows((data as ReportCardRow[]) || []); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" /> {t('fh.reportCards')}
        </CardTitle>
        {rows.length > 0 && (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onOpen}>
            {t('fh.open')} <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('fh.loadingShort')}</p>
        ) : rows.length === 0 ? (
          <EmptyHint icon={FileText} text={t('fh.noReportCards')} />
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <button
                key={r.id}
                onClick={onOpen}
                className="w-full flex items-center justify-between rounded-lg border border-border p-3 text-left hover:bg-muted transition-colors"
              >
                <div>
                  <div className="font-medium text-sm">{r.term} · {r.academic_year}</div>
                  {r.published_at && (
                    <div className="text-xs text-muted-foreground">
                      {t('fh.publishedPrefix')} {new Date(r.published_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/* Invoices                                                            */
/* ------------------------------------------------------------------ */

interface InvoiceRow {
  id: string;
  title: string;
  amount_cents: number;
  currency: string;
  status: string;
  due_date: string | null;
}

const statusColor: Record<string, string> = {
  issued: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  paid: 'bg-green-500/15 text-green-600 border-green-500/30',
  overdue: 'bg-red-500/15 text-red-600 border-red-500/30',
  void: 'bg-muted text-muted-foreground',
  draft: 'bg-muted text-muted-foreground',
};

const formatMoney = (cents: number, cur = 'usd') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: (cur || 'usd').toUpperCase() }).format(cents / 100);

const InvoicesCard = ({ studentId, onOpen }: { studentId: string; onOpen: () => void }) => {
  const { t } = useLanguage();
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('school_invoices')
        .select('id, title, amount_cents, currency, status, due_date')
        .eq('student_id', studentId)
        .order('issued_at', { ascending: false })
        .limit(5);
      if (!cancelled) { setRows((data as InvoiceRow[]) || []); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  const outstanding = rows.filter((r) => ['issued', 'overdue'].includes(r.status));

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" /> {t('fh.invoices')}
        </CardTitle>
        {rows.length > 0 && (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onOpen}>
            {t('fh.open')} <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('fh.loadingShort')}</p>
        ) : rows.length === 0 ? (
          <EmptyHint icon={Receipt} text={t('fh.noInvoices')} />
        ) : (
          <div className="space-y-2">
            {outstanding.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {outstanding.length} {t('fh.outstandingWord')} ·{' '}
                <span className="font-medium text-foreground">
                  {formatMoney(outstanding.reduce((s, r) => s + r.amount_cents, 0), rows[0]?.currency)}
                </span>{' '}
                {t('fh.dueWord')}
              </div>
            )}
            {rows.map((r) => (
              <button
                key={r.id}
                onClick={onOpen}
                className="w-full flex items-center justify-between rounded-lg border border-border p-3 text-left hover:bg-muted transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{r.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatMoney(r.amount_cents, r.currency)}
                    {r.due_date ? ` · ${t('fh.dueWord')} ${new Date(r.due_date).toLocaleDateString()}` : ''}
                  </div>
                </div>
                <Badge variant="outline" className={statusColor[r.status] || ''}>{FH_STATUS_KEY[r.status] ? t(FH_STATUS_KEY[r.status]) : r.status}</Badge>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
