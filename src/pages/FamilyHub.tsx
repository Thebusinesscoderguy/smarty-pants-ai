import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users, FileText, ClipboardList, Receipt, Newspaper, ChevronRight,
  Loader2, GraduationCap, Sparkles,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AttendanceSummaryCard } from '@/components/attendance/AttendanceSummaryCard';
import { NewsFeed } from '@/components/news/NewsFeed';
import { supabase } from '@/integrations/supabase/client';

/**
 * Family Hub — the parent's home base.
 *
 * Every figure on this page is read live from the database and is strictly
 * scoped (by RLS) to the signed-in parent's own children. There is NO mock or
 * placeholder student data. When a parent has no children linked, or a child
 * has no records yet, we render explicit empty states rather than inventing data.
 */

interface Child {
  id: string;
  name: string;
  avatarUrl: string | null;
}

const initials = (name: string) =>
  name.split(' ').map((w) => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || '?';

const FamilyHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        name: p.display_name || 'Student',
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Family Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your {children.length === 1 ? "child's" : "children's"} attendance, grades,
            report cards, invoices and school news — all in one place.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading your family hub…
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

            {selectedChild && <ChildOverview key={selectedChild.id} child={selectedChild} onNavigate={navigate} />}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Per-child overview                                                  */
/* ------------------------------------------------------------------ */

const ChildOverview = ({
  child,
  onNavigate,
}: {
  child: Child;
  onNavigate: (path: string) => void;
}) => {
  return (
    <div className="space-y-6">
      {/* Child header */}
      <Card className="bg-card border-border">
        <CardContent className="p-5 flex items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-primary/20">
            {child.avatarUrl && <AvatarImage src={child.avatarUrl} alt={child.name} />}
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials(child.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="text-xl font-bold truncate">{child.name}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <GraduationCap className="h-4 w-4" /> Student overview
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance (reuses the same component the parent dashboard uses) */}
        <AttendanceSummaryCard studentId={child.id} studentName={child.name} />

        {/* Recent grades */}
        <RecentGradesCard studentId={child.id} />

        {/* Report cards */}
        <ReportCardsCard studentId={child.id} onOpen={() => onNavigate('/report-cards')} />

        {/* Invoices */}
        <InvoicesCard studentId={child.id} onOpen={() => onNavigate('/invoices')} />
      </div>

      {/* School news (RLS already scopes to this parent's children's schools) */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-primary" /> School News
        </h3>
        <NewsFeed />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Recent grades                                                       */
/* ------------------------------------------------------------------ */

interface GradeRow {
  id: string;
  subject: string;
  classwork: number | null;
  homework: number | null;
  date: string;
}

const RecentGradesCard = ({ studentId }: { studentId: string }) => {
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: grades } = await supabase
      .from('student_daily_grades')
      .select('id, subject_id, classwork_mark, homework_mark, grade_date')
      .eq('student_id', studentId)
      .order('grade_date', { ascending: false })
      .limit(8);

    const subjectIds = [...new Set((grades || []).map((g) => g.subject_id))];
    const nameById: Record<string, string> = {};
    if (subjectIds.length) {
      const { data: subjects } = await supabase
        .from('school_subjects')
        .select('id, name')
        .in('id', subjectIds);
      (subjects || []).forEach((s) => { nameById[s.id] = s.name; });
    }

    setRows(
      (grades || []).map((g) => ({
        id: g.id,
        subject: nameById[g.subject_id] || 'Subject',
        classwork: g.classwork_mark,
        homework: g.homework_mark,
        date: g.grade_date,
      })),
    );
    setLoading(false);
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" /> Recent Grades
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <EmptyHint icon={ClipboardList} text="No grades recorded yet. They'll appear here as teachers enter daily marks." />
        ) : (
          <div className="divide-y divide-border">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{r.subject}</div>
                  <div className="text-xs text-muted-foreground">{r.date}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Mark label="CW" value={r.classwork} />
                  <Mark label="HW" value={r.homework} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Mark = ({ label, value }: { label: string; value: number | null }) => (
  <div className="text-center">
    <div className="text-[10px] text-muted-foreground">{label}</div>
    <Badge variant={value == null ? 'outline' : 'secondary'} className="min-w-9 justify-center">
      {value == null ? '—' : value}
    </Badge>
  </div>
);

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
          <FileText className="h-4 w-4 text-primary" /> Report Cards
        </CardTitle>
        {rows.length > 0 && (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onOpen}>
            Open <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <EmptyHint icon={FileText} text="No report cards published yet. You'll be notified when one is available." />
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
                      Published {new Date(r.published_at).toLocaleDateString()}
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
          <Receipt className="h-4 w-4 text-primary" /> Invoices
        </CardTitle>
        {rows.length > 0 && (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onOpen}>
            Open <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <EmptyHint icon={Receipt} text="No invoices. Anything your school bills will show up here." />
        ) : (
          <div className="space-y-2">
            {outstanding.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {outstanding.length} outstanding ·{' '}
                <span className="font-medium text-foreground">
                  {formatMoney(outstanding.reduce((s, r) => s + r.amount_cents, 0), rows[0]?.currency)}
                </span>{' '}
                due
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
                    {r.due_date ? ` · due ${new Date(r.due_date).toLocaleDateString()}` : ''}
                  </div>
                </div>
                <Badge variant="outline" className={statusColor[r.status] || ''}>{r.status}</Badge>
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

const EmptyHint = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <div className="flex items-start gap-2 text-sm text-muted-foreground py-2">
    <Icon className="h-4 w-4 mt-0.5 shrink-0 opacity-60" />
    <span>{text}</span>
  </div>
);

const NoChildrenState = () => (
  <Card className="bg-card border-border">
    <CardContent className="p-10 text-center max-w-md mx-auto">
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Users className="h-7 w-7 text-primary" />
      </div>
      <h2 className="text-lg font-semibold mb-2">No children linked yet</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Once your school connects a student to your account, their attendance, grades,
        report cards and invoices will appear here automatically.
      </p>
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" />
        Ask your school administrator to link your child, or accept a pending invitation.
      </div>
    </CardContent>
  </Card>
);

export default FamilyHub;
