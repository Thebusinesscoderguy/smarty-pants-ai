import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Receipt, CreditCard, CheckCircle2, Clock, Wallet } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useLanguage } from '@/contexts/LanguageContext';

const INVV_STATUS_KEY: Record<string, string> = { paid: 'inv.statusPaid', overdue: 'inv.statusOverdue', issued: 'inv.statusIssued' };

interface Invoice {
  id: string;
  student_id: string;
  title: string;
  description: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  due_date: string | null;
  issued_at: string;
  paid_at: string | null;
}

const Invoices = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('school_invoices').select('*').order('issued_at', { ascending: false });
    const list = (data as Invoice[]) || [];
    setInvoices(list);
    const ids = Array.from(new Set(list.map(i => i.student_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('id, display_name').in('id', ids);
      const map: Record<string, string> = {};
      (profs || []).forEach((p: any) => { map[p.id] = p.display_name || t('invv.studentFallback'); });
      setStudents(map);
    }
    setLoading(false);
  };

  const totals = useMemo(() => {
    let outstanding = 0, paid = 0;
    invoices.forEach(i => {
      if (i.status === 'paid') paid += i.amount_cents;
      else if (['issued', 'overdue'].includes(i.status)) outstanding += i.amount_cents;
    });
    return { outstanding, paid };
  }, [invoices]);

  const formatMoney = (c: number, cur = 'usd') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: cur.toUpperCase() }).format(c / 100);

  const payInvoice = async (inv: Invoice) => {
    setPaying(inv.id);
    try {
      const { data, error } = await supabase.functions.invoke('pay-invoice', {
        body: { invoice_id: inv.id },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      } else if (data?.message) {
        toast({ title: t('invv.paymentUnavailable'), description: data.message });
      }
    } catch (e: any) {
      toast({ title: t('invv.couldNotStart'), description: e.message, variant: 'destructive' });
    } finally {
      setPaying(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO title="Invoices & Fees | Teachly.AI" description="View school invoices, balances, and pay fees online." path="/invoices" />
      <Header />
      <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Receipt className="h-7 w-7 text-primary" /> {t('invv.title')}
            </h1>
            <p className="text-muted-foreground">{t('invv.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10"><Clock className="h-5 w-5 text-amber-600" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('invv.outstanding')}</p>
                  <p className="text-2xl font-bold">{formatMoney(totals.outstanding)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10"><Wallet className="h-5 w-5 text-green-600" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('invv.paidToDate')}</p>
                  <p className="text-2xl font-bold">{formatMoney(totals.paid)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border">
            <CardHeader><CardTitle>{t('invv.yourInvoices')}</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-muted-foreground">{t('invv.loading')}</div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">{t('invv.empty')}</div>
              ) : (
                <div className="space-y-3">
                  {invoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between gap-3 p-4 border border-border rounded-lg flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{inv.title}</p>
                          <Badge variant="outline" className={
                            inv.status === 'paid' ? 'bg-green-500/15 text-green-600 border-green-500/30'
                            : inv.status === 'overdue' ? 'bg-red-500/15 text-red-600 border-red-500/30'
                            : 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                          }>{INVV_STATUS_KEY[inv.status] ? t(INVV_STATUS_KEY[inv.status]) : inv.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {students[inv.student_id] || t('invv.studentFallback')} · {inv.due_date ? `${t('invv.duePrefix')} ${new Date(inv.due_date).toLocaleDateString()}` : t('invv.noDueDate')}
                        </p>
                        {inv.description && <p className="text-xs text-muted-foreground mt-1">{inv.description}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatMoney(inv.amount_cents, inv.currency)}</p>
                        {inv.status === 'paid' ? (
                          <p className="text-xs text-green-600 flex items-center gap-1 justify-end">
                            <CheckCircle2 className="h-3 w-3" /> {t('invv.paidPrefix')} {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : ''}
                          </p>
                        ) : inv.status === 'issued' || inv.status === 'overdue' ? (
                          <Button size="sm" className="mt-1" disabled={paying === inv.id} onClick={() => payInvoice(inv)}>
                            <CreditCard className="h-3.5 w-3.5 mr-1" />
                            {paying === inv.id ? t('invv.starting') : t('invv.payNow')}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Invoices;
