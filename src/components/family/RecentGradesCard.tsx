import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { EmptyHint } from './EmptyHint';

/* ------------------------------------------------------------------ */
/* Recent grades (read-only — parent sees only their child's marks)     */
/* ------------------------------------------------------------------ */

interface GradeRow {
  id: string;
  subject: string;
  classwork: number | null;
  homework: number | null;
  literacy: number | null;
  date: string;
}

const Mark = ({ label, value }: { label: string; value: number | null }) => (
  <div className="text-center">
    <div className="text-[10px] text-muted-foreground">{label}</div>
    <Badge variant={value == null ? 'outline' : 'secondary'} className="min-w-9 justify-center">
      {value == null ? '—' : value}
    </Badge>
  </div>
);

export const RecentGradesCard = ({ studentId }: { studentId: string }) => {
  const { t } = useLanguage();
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: grades } = await supabase
      .from('student_daily_grades')
      .select('id, subject_id, classwork_mark, homework_mark, literacy_mark, grade_date')
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
        subject: nameById[g.subject_id] || t('fh.subjectFallback'),
        classwork: g.classwork_mark,
        homework: g.homework_mark,
        literacy: g.literacy_mark,
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
          <ClipboardList className="h-4 w-4 text-primary" /> {t('fh.recentGrades')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('fh.loadingShort')}</p>
        ) : rows.length === 0 ? (
          <EmptyHint icon={ClipboardList} text={t('fh.noGrades')} />
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
                  <Mark label="Lit" value={r.literacy} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
