import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Row {
  id: string;
  user_id: string;
  quiz_id: string;
  status: string;
  start_time: string;
  submitted_at: string | null;
  violation_count: number;
  flagged: boolean;
  percentage: number | null;
  test_title: string;
  student_name: string;
}

export const ExamMonitoring = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    // Fetch tests owned by the user that are exams
    const { data: tests } = await supabase
      .from('tests')
      .select('id, title')
      .eq('creator_id', user.id)
      .eq('assessment_mode', 'exam');

    const testIds = (tests || []).map((t) => t.id);
    if (!testIds.length) { setRows([]); setLoading(false); return; }
    const titleMap: Record<string, string> = {};
    for (const t of tests || []) titleMap[t.id] = t.title;

    const { data: sessions } = await supabase
      .from('exam_sessions')
      .select('id, user_id, quiz_id, status, start_time, submitted_at, violation_count, flagged, percentage')
      .in('quiz_id', testIds)
      .order('start_time', { ascending: false })
      .limit(200);

    const userIds = Array.from(new Set((sessions || []).map((s) => s.user_id)));
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']);
    const nameMap: Record<string, string> = {};
    for (const p of profiles || []) nameMap[p.id] = p.display_name || t('examMon.studentFallback');

    setRows((sessions || []).map((s) => ({
      ...s,
      test_title: titleMap[s.quiz_id] || t('examMon.examFallback'),
      student_name: nameMap[s.user_id] || t('examMon.studentFallback'),
    })) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('examMon.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('examMon.subtitle')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> {t('examMon.refresh')}
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{t('examMon.sessions')}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('examMon.colStudent')}</TableHead>
                <TableHead>{t('examMon.colExam')}</TableHead>
                <TableHead>{t('examMon.colStatus')}</TableHead>
                <TableHead>{t('examMon.colStarted')}</TableHead>
                <TableHead>{t('examMon.colSubmitted')}</TableHead>
                <TableHead className="text-center">{t('examMon.colViolations')}</TableHead>
                <TableHead className="text-center">{t('examMon.colScore')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t('examMon.noSessions')}</TableCell></TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.id} className={r.flagged ? 'bg-destructive/5' : ''}>
                  <TableCell className="font-medium">{r.student_name}</TableCell>
                  <TableCell>{r.test_title}</TableCell>
                  <TableCell>
                    {r.status === 'not_started' && <Badge variant="outline">{t('examMon.statusNotStarted')}</Badge>}
                    {r.status === 'in_progress' && <Badge variant="secondary">{t('examMon.statusInProgress')}</Badge>}
                    {r.status === 'submitted' && <Badge>{t('examMon.statusSubmitted')}</Badge>}
                    {r.status === 'auto_submitted' && <Badge variant="outline">{t('examMon.statusAutoSubmitted')}</Badge>}
                  </TableCell>
                  <TableCell className="text-xs">{new Date(r.start_time).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'}</TableCell>
                  <TableCell className="text-center">
                    {r.flagged ? (
                      <Badge variant="destructive" className="gap-1"><ShieldAlert className="h-3 w-3" /> {r.violation_count}</Badge>
                    ) : (
                      <span className="text-sm">{r.violation_count}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{r.percentage != null && r.status !== 'in_progress' ? `${r.percentage}%` : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
