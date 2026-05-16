import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import jsPDF from 'jspdf';
import { renderReportCardToPdf, defaultLayoutConfig, ReportCardLayout } from '@/lib/reportCardPdf';
import { Header } from '@/components/layout/Header';
import { toast } from 'sonner';

interface Row {
  id: string;
  student_id: string;
  student_name: string;
  term: string;
  academic_year: string;
  data: any;
  school_id: string;
  published_at: string | null;
}

const ReportCards = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [settingsBySchool, setSettingsBySchool] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      // Cards visible via RLS (own + children if parent)
      const { data: cards } = await supabase
        .from('report_cards')
        .select('id, student_id, term, academic_year, data, school_id, published_at')
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (!cards?.length) { setRows([]); setLoading(false); return; }

      const studentIds = Array.from(new Set(cards.map(c => c.student_id)));
      const schoolIds = Array.from(new Set(cards.map(c => c.school_id)));

      const [{ data: profs }, { data: settings }] = await Promise.all([
        supabase.from('profiles').select('id, display_name').in('id', studentIds),
        supabase.from('report_card_settings').select('*').in('school_id', schoolIds),
      ]);

      const nameById = new Map((profs || []).map(p => [p.id, p.display_name || 'Student']));
      const settingsMap: Record<string, any> = {};
      (settings || []).forEach((s: any) => { settingsMap[s.school_id] = s; });
      setSettingsBySchool(settingsMap);

      setRows(cards.map(c => ({
        id: c.id, student_id: c.student_id, term: c.term, academic_year: c.academic_year,
        data: c.data, school_id: c.school_id, published_at: c.published_at,
        student_name: nameById.get(c.student_id) || 'Student',
      })));
      setLoading(false);
    })();
  }, [user]);

  const downloadPdf = (row: Row) => {
    const settings = settingsBySchool[row.school_id] || {};
    const layout: ReportCardLayout = (settings.layout_config?.sections?.length) ? settings.layout_config : defaultLayoutConfig;
    const doc = new jsPDF();
    renderReportCardToPdf(doc, {
      name: row.student_name, term: row.term, academic_year: row.academic_year, data: row.data || {},
    }, settings, layout);
    doc.save(`report-${row.student_name}-${row.term}.pdf`);
    toast.success('Downloaded');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 text-center text-muted-foreground">Please sign in to view report cards.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Report Cards</h1>
        <p className="text-muted-foreground mb-6">Published report cards for you and your children.</p>

        {loading ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Loading…</CardContent></Card>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No published report cards yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map(r => (
              <Card key={r.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div>
                      <CardTitle className="text-lg">{r.student_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{r.term} · {r.academic_year}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Overall {r.data?.overall ?? '-'}%</Badge>
                      <Badge variant="outline">Attendance {r.data?.attendance_rate ?? '-'}%</Badge>
                      <Button size="sm" onClick={() => downloadPdf(r)}>
                        <Download className="h-4 w-4 mr-1" />PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {Array.isArray(r.data?.subjects) && r.data.subjects.length > 0 && (
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {r.data.subjects.map((s: any, i: number) => (
                        <div key={i} className="flex justify-between bg-muted/50 rounded px-3 py-1.5">
                          <span className="truncate">{s.subject}</span>
                          <span className="font-medium">{s.avg}%</span>
                        </div>
                      ))}
                    </div>
                    {r.data?.comments && (
                      <p className="mt-3 text-sm italic text-muted-foreground border-l-2 border-primary pl-3">
                        "{r.data.comments}"
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportCards;
