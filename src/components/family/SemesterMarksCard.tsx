import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { EmptyHint } from './EmptyHint';

/* ------------------------------------------------------------------ */
/* Semester marks (read-only — RLS scopes to student_id = auth.uid())   */
/* ------------------------------------------------------------------ */

interface SemesterRow {
  id: string;
  subject: string;
  semester: string;
  final: number | null;
  project: number | null;
}

const Mark = ({ label, value }: { label: string; value: number | null }) => (
  <div className="text-center">
    <div className="text-[10px] text-muted-foreground">{label}</div>
    <Badge variant={value == null ? 'outline' : 'secondary'} className="min-w-9 justify-center">
      {value == null ? '—' : value}
    </Badge>
  </div>
);

export const SemesterMarksCard = ({ studentId }: { studentId: string }) => {
  const { t } = useLanguage();
  const [rows, setRows] = useState<SemesterRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: marks } = await supabase
      .from('student_semester_marks')
      .select('id, subject_id, semester, final_exam_mark, project_mark')
      .eq('student_id', studentId)
      .order('semester', { ascending: false });

    const subjectIds = [...new Set((marks || []).map((m) => m.subject_id))];
    const nameById: Record<string, string> = {};
    if (subjectIds.length) {
      const { data: subjects } = await supabase
        .from('school_subjects')
        .select('id, name')
        .in('id', subjectIds);
      (subjects || []).forEach((s) => { nameById[s.id] = s.name; });
    }

    setRows(
      (marks || []).map((m) => ({
        id: m.id,
        subject: nameById[m.subject_id] || t('fh.subjectFallback'),
        semester: m.semester,
        final: m.final_exam_mark,
        project: m.project_mark,
      })),
    );
    setLoading(false);
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" /> {t('sg.semesterTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('fh.loadingShort')}</p>
        ) : rows.length === 0 ? (
          <EmptyHint icon={GraduationCap} text={t('sg.noSemesterMarks')} />
        ) : (
          <div className="divide-y divide-border">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{r.subject}</div>
                  <div className="text-xs text-muted-foreground">{t('sg.semesterLabel')} {r.semester}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Mark label={t('sg.final')} value={r.final} />
                  <Mark label={t('sg.project')} value={r.project} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
