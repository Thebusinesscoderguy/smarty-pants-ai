import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { EmptyHint } from './EmptyHint';

/* ------------------------------------------------------------------ */
/* Behavior (read-only — parent sees only their child's records)        */
/* ------------------------------------------------------------------ */

interface BehaviorRow {
  id: string;
  valence: 'positive' | 'negative';
  points: number;
  description: string | null;
  date: string;
  category: string;
}

export const BehaviorCard = ({ studentId }: { studentId: string }) => {
  const { t } = useLanguage();
  const [rows, setRows] = useState<BehaviorRow[]>([]);
  const [net, setNet] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: incidents } = await supabase
      .from('behavior_incidents')
      .select('id, category_id, valence, points, description, incident_date')
      .eq('student_id', studentId)
      .order('incident_date', { ascending: false });

    const catIds = [...new Set((incidents || []).map((i) => i.category_id).filter(Boolean))] as string[];
    const nameById: Record<string, string> = {};
    if (catIds.length) {
      const { data: cats } = await supabase
        .from('behavior_categories')
        .select('id, name')
        .in('id', catIds);
      (cats || []).forEach((c) => { nameById[c.id] = c.name; });
    }

    const all: BehaviorRow[] = (incidents || []).map((i) => ({
      id: i.id,
      valence: i.valence as 'positive' | 'negative',
      points: i.points,
      description: i.description,
      date: i.incident_date,
      category: (i.category_id && nameById[i.category_id]) || t('fh.incidentFallback'),
    }));
    setNet(all.reduce((sum, r) => sum + (r.valence === 'positive' ? r.points : -r.points), 0));
    setRows(all.slice(0, 8));
    setLoading(false);
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> {t('fh.behavior')}
        </CardTitle>
        {!loading && rows.length > 0 && (
          <Badge variant={net >= 0 ? 'secondary' : 'destructive'}>{t('fh.netPrefix')} {net}</Badge>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('fh.loadingShort')}</p>
        ) : rows.length === 0 ? (
          <EmptyHint icon={Shield} text={t('fh.noBehavior')} />
        ) : (
          <div className="divide-y divide-border">
            {rows.map((r) => (
              <div key={r.id} className="flex items-start gap-2 py-2">
                {r.valence === 'positive'
                  ? <ThumbsUp className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  : <ThumbsDown className="h-4 w-4 text-destructive mt-0.5 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{r.category}</span>
                    <Badge variant="outline" className="text-[10px]">{r.valence === 'positive' ? '+' : '-'}{r.points}</Badge>
                  </div>
                  {r.description && <div className="text-xs text-muted-foreground">{r.description}</div>}
                  <div className="text-xs text-muted-foreground">{r.date}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
