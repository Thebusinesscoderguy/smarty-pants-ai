import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { EmptyHint } from './EmptyHint';

/* ------------------------------------------------------------------ */
/* Report cards (read-only — RLS scopes to published rows for the       */
/* given student: parents see their child's, a student sees their own)  */
/* ------------------------------------------------------------------ */

interface ReportCardRow {
  id: string;
  term: string;
  academic_year: string;
  published_at: string | null;
  pdf_url: string | null;
}

export const ReportCardsCard = ({ studentId, onOpen }: { studentId: string; onOpen: () => void }) => {
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
