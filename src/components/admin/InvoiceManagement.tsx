import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Plus, FileText, CheckCircle2, X, DollarSign, Clock } from 'lucide-react';

interface Invoice {
  id: string;
  student_id: string;
  parent_id: string | null;
  title: string;
  description: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  due_date: string | null;
  issued_at: string;
  paid_at: string | null;
}

interface Student { id: string; display_name: string | null; }

const statusColor: Record<string, string> = {
  issued: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  paid: 'bg-green-500/15 text-green-600 border-green-500/30',
  overdue: 'bg-red-500/15 text-red-600 border-red-500/30',
  void: 'bg-muted text-muted-foreground',
  draft: 'bg-muted text-muted-foreground',
};

export const InvoiceManagement = () => {
  const { user } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'issued' | 'paid' | 'overdue'>('all');

  const [form, setForm] = useState({
    student_id: '',
    title: '',
    description: '',
    amount: '',
    due_date: '',
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: school } = await supabase
        .from('school_accounts').select('id').eq('admin_user_id', user.id).maybeSingle();
      if (!school) { setLoading(false); return; }
      setSchoolId(school.id);
      await Promise.all([loadInvoices(school.id), loadStudents(school.id)]);
      setLoading(false);
    })();
  }, [user]);

  const loadInvoices = async (sid: string) => {
    const { data } = await supabase.from('school_invoices')
      .select('*').eq('school_id', sid).order('issued_at', { ascending: false });
    setInvoices((data as Invoice[]) || []);
  };

  const loadStudents = async (sid: string) => {
    const { data: rels } = await supabase.from('school_student_relationships')
      .select('student_id').eq('school_id', sid).eq('is_active', true);
    const ids = (rels || []).map((r: any) => r.student_id);
    if (ids.length === 0) { setStudents([]); return; }
    const { data: profs } = await supabase.from('profiles')
      .select('id, display_name').in('id', ids);
    setStudents((profs as Student[]) || []);
  };

  const totals = useMemo(() => {
    const t = { outstanding: 0, paid: 0, count: invoices.length };
    invoices.forEach(i => {
      if (i.status === 'paid') t.paid += i.amount_cents;
      else if (['issued', 'overdue'].includes(i.status)) t.outstanding += i.amount_cents;
    });
    return t;
  }, [invoices]);

  const filtered = invoices.filter(i => filter === 'all' || i.status === filter);

  const studentName = (id: string) => students.find(s => s.id === id)?.display_name || id.slice(0, 8);

  const createInvoice = async () => {
    if (!schoolId || !form.student_id || !form.title || !form.amount) {
      toast({ title: 'Missing info', description: 'Student, title, and amount are required', variant: 'destructive' });
      return;
    }
    const cents = Math.round(parseFloat(form.amount) * 100);
    if (isNaN(cents) || cents < 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }

    // find parent
    const { data: rel } = await supabase.from('parent_child_relationships')
      .select('parent_id').eq('child_id', form.student_id).maybeSingle();

    const { error } = await supabase.from('school_invoices').insert({
      school_id: schoolId,
      student_id: form.student_id,
      parent_id: rel?.parent_id || null,
      title: form.title,
      description: form.description || null,
      amount_cents: cents,
      due_date: form.due_date || null,
      status: 'issued',
      created_by: user?.id,
    });
    if (error) {
      toast({ title: 'Could not create', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Invoice issued' });
    setOpen(false);
    setForm({ student_id: '', title: '', description: '', amount: '', due_date: '' });
    if (schoolId) loadInvoices(schoolId);
  };

  const markPaid = async (id: string) => {
    const { error } = await supabase.from('school_invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Marked as paid' });
    if (schoolId) loadInvoices(schoolId);
  };

  const voidInvoice = async (id: string) => {
    const { error } = await supabase.from('school_invoices').update({ status: 'void' }).eq('id', id);
    if (error) { toast({ title: 'Failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Invoice voided' });
    if (schoolId) loadInvoices(schoolId);
  };

  const formatMoney = (c: number, cur = 'usd') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: cur.toUpperCase() }).format(c / 100);

  if (loading) return <div className="text-muted-foreground">Loading invoices…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Fees & Invoicing</h2>
          <p className="text-muted-foreground">Issue invoices and track parent payments.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Invoice</Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Student</Label>
                <Select value={form.student_id} onValueChange={(v) => setForm(f => ({ ...f, student_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select a student" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.display_name || s.id.slice(0, 8)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Term 1 Tuition" />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Amount (USD)</Label>
                  <Input type="number" step="0.01" min="0" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="500.00" />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={form.due_date}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
              </div>
              <Button className="w-full" onClick={createInvoice}>Issue Invoice</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total invoices</p>
              <p className="text-2xl font-bold">{totals.count}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className="text-2xl font-bold">{formatMoney(totals.outstanding)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10"><DollarSign className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Collected</p>
              <p className="text-2xl font-bold">{formatMoney(totals.paid)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">Invoices</CardTitle>
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No invoices yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{studentName(inv.student_id)}</TableCell>
                    <TableCell>{inv.title}</TableCell>
                    <TableCell>{formatMoney(inv.amount_cents, inv.currency)}</TableCell>
                    <TableCell>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor[inv.status] || ''}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {inv.status === 'issued' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => markPaid(inv.id)}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Mark paid
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => voidInvoice(inv.id)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
