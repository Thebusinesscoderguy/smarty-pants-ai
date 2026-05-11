import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileText, Download, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { renderReportCardToPdf, defaultLayoutConfig, ReportCardLayout } from '@/lib/reportCardPdf';

interface Section { id: string; grade_level: string; section_name: string; }
interface ReportCard { id: string; student_id: string; term: string; academic_year: string; data: any; published: boolean; }

export const ReportCardManagement = () => {
  const { user } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState('');
  const [term, setTerm] = useState('Term 1');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [cards, setCards] = useState<(ReportCard & { name: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>({ school_name: '', principal_name: '' });

  useEffect(() => {
    if (!user) return;
    supabase.from('school_accounts').select('id, school_name').eq('admin_user_id', user.id).maybeSingle()
      .then(async ({ data }) => {
        if (!data) return;
        setSchoolId(data.id);
        const { data: secs } = await supabase.from('school_sections').select('*').eq('school_id', data.id);
        setSections(secs || []);
        const { data: s } = await supabase.from('report_card_settings').select('*').eq('school_id', data.id).maybeSingle();
        setSettings(s || { school_name: data.school_name, principal_name: '' });
      });
  }, [user]);

  const loadCards = async () => {
    if (!schoolId) return;
    const { data } = await supabase.from('report_cards').select('*')
      .eq('school_id', schoolId).eq('term', term).eq('academic_year', year);
    const ids = (data || []).map(c => c.student_id);
    if (!ids.length) { setCards([]); return; }
    const { data: profs } = await supabase.from('profiles').select('id, display_name').in('id', ids);
    const nameMap = new Map((profs || []).map(p => [p.id, p.display_name || 'Unknown']));
    setCards((data || []).map(c => ({ ...c, name: nameMap.get(c.student_id) || 'Unknown' })));
  };

  useEffect(() => { loadCards(); }, [schoolId, term, year]);

  const generate = async () => {
    if (!schoolId || !sectionId) { toast.error('Pick a section'); return; }
    setLoading(true);
    try {
      const { data: assigns } = await supabase.from('section_students').select('student_id').eq('section_id', sectionId);
      const studentIds = (assigns || []).map(a => a.student_id);
      if (!studentIds.length) { toast.error('No students in section'); setLoading(false); return; }

      const { data: profs } = await supabase.from('profiles').select('id, display_name').in('id', studentIds);
      const nameMap = new Map((profs || []).map(p => [p.id, p.display_name || 'Unknown']));

      // Pull gradebook entries
      const { data: entries } = await supabase.from('gradebook_entries' as any).select('*').in('student_id', studentIds);
      // Pull attendance for term (rough: last 90 days)
      const since = new Date(); since.setDate(since.getDate() - 90);
      const { data: att } = await supabase.from('attendance_records').select('student_id, status')
        .in('student_id', studentIds).gte('date', since.toISOString().slice(0, 10));

      const rows = studentIds.map(sid => {
        const sEntries = (entries || []).filter((e: any) => e.student_id === sid);
        const subjects: Record<string, { total: number; count: number }> = {};
        sEntries.forEach((e: any) => {
          const key = e.subject_id || e.subject || 'General';
          const score = Number(e.percentage ?? e.score ?? 0);
          if (!subjects[key]) subjects[key] = { total: 0, count: 0 };
          subjects[key].total += score; subjects[key].count += 1;
        });
        const subjectAvgs = Object.entries(subjects).map(([k, v]) => ({ subject: k, avg: v.count ? Math.round(v.total / v.count) : 0 }));
        const overall = subjectAvgs.length ? Math.round(subjectAvgs.reduce((s, x) => s + x.avg, 0) / subjectAvgs.length) : 0;
        const sAtt = (att || []).filter(a => a.student_id === sid);
        const present = sAtt.filter(a => a.status === 'present' || a.status === 'late').length;
        const attendanceRate = sAtt.length ? Math.round((present / sAtt.length) * 100) : null;
        return {
          school_id: schoolId, student_id: sid, section_id: sectionId, term, academic_year: year,
          generated_by: user?.id,
          data: { name: nameMap.get(sid), subjects: subjectAvgs, overall, attendance_rate: attendanceRate },
          published: false,
        };
      });

      const { error } = await supabase.from('report_cards').upsert(rows, { onConflict: 'student_id,term,academic_year' });
      if (error) { toast.error('Generate failed: ' + error.message); setLoading(false); return; }
      toast.success(`Generated ${rows.length} report cards`);
      await loadCards();
    } finally { setLoading(false); }
  };

  const publishAll = async () => {
    const ids = cards.filter(c => !c.published).map(c => c.id);
    if (!ids.length) return;
    const { error } = await supabase.from('report_cards').update({ published: true, published_at: new Date().toISOString() }).in('id', ids);
    if (error) { toast.error(error.message); return; }
    toast.success(`Published ${ids.length} cards`);
    loadCards();
  };

  const layout: ReportCardLayout = (settings?.layout_config && settings.layout_config.sections?.length) ? settings.layout_config : defaultLayoutConfig;

  const renderCardToDoc = (doc: jsPDF, card: ReportCard & { name: string }) => {
    renderReportCardToPdf(doc, {
      name: card.name, term: card.term, academic_year: card.academic_year, data: card.data || {},
    }, settings, layout);
  };

  const downloadPdf = (card: ReportCard & { name: string }) => {
    const doc = new jsPDF();
    renderCardToDoc(doc, card);
    doc.save(`report-${card.name}-${card.term}.pdf`);
  };

  const downloadAllPdf = () => {
    if (!cards.length) return;
    const doc = new jsPDF();
    cards.forEach((c, i) => {
      if (i > 0) doc.addPage();
      renderCardToDoc(doc, c);
    });
    doc.save(`report-cards-${term}-${year}.pdf`);
    toast.success(`Downloaded ${cards.length} report cards`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Settings</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
          <div><Label>School Name</Label><Input value={settings.school_name || ''} onChange={e => setSettings({ ...settings, school_name: e.target.value })} /></div>
          <div><Label>Principal Name</Label><Input value={settings.principal_name || ''} onChange={e => setSettings({ ...settings, principal_name: e.target.value })} /></div>
          <div className="md:col-span-2">
            <Button size="sm" variant="outline" onClick={async () => {
              if (!schoolId) return;
              const { error } = await supabase.from('report_card_settings').upsert({ school_id: schoolId, ...settings });
              if (error) toast.error(error.message); else toast.success('Saved');
            }}>Save Settings</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Generate Report Cards</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-4 gap-3">
            <div><Label>Section</Label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
                <SelectContent className="bg-popover">{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.grade_level} - {s.section_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Term</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {['Term 1', 'Term 2', 'Term 3', 'Final'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Academic Year</Label><Input value={year} onChange={e => setYear(e.target.value)} /></div>
            <div className="flex items-end"><Button onClick={generate} disabled={loading} className="w-full">{loading ? 'Generating...' : 'Generate'}</Button></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><div className="flex justify-between items-center gap-2 flex-wrap"><CardTitle>Report Cards ({term}, {year})</CardTitle><div className="flex gap-2"><Button size="sm" variant="outline" onClick={downloadAllPdf} disabled={!cards.length}><Download className="h-4 w-4 mr-1" />Download All</Button><Button size="sm" onClick={publishAll} disabled={!cards.some(c => !c.published)}><CheckCircle2 className="h-4 w-4 mr-1" />Publish All</Button></div></div></CardHeader>
        <CardContent>
          {cards.length === 0 ? <p className="text-sm text-muted-foreground">No report cards yet.</p> : (
            <div className="divide-y divide-border border border-border rounded-lg">
              {cards.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">Overall: {c.data?.overall ?? '-'}% · Attendance: {c.data?.attendance_rate ?? '-'}%</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.published ? <Badge>Published</Badge> : <Badge variant="outline">Draft</Badge>}
                    <Button size="sm" variant="outline" onClick={() => downloadPdf(c)}><Download className="h-4 w-4 mr-1" />PDF</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
