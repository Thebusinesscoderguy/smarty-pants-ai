import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const ASC_STATUS_KEY: Record<string, string> = { present: 'asc.present', absent: 'asc.absent', late: 'asc.late', excused: 'asc.excused' };

interface Props {
  studentId: string;
  studentName?: string;
  days?: number;
}

type Row = { date: string; status: string };

export const AttendanceSummaryCard = ({ studentId, studentName, days = 30 }: Props) => {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    const since = new Date();
    since.setDate(since.getDate() - days);
    supabase
      .from('attendance_records')
      .select('date, status')
      .eq('student_id', studentId)
      .gte('date', since.toISOString().slice(0, 10))
      .order('date', { ascending: false })
      .then(({ data }) => {
        setRows((data || []) as Row[]);
        setLoading(false);
      });
  }, [studentId, days]);

  const total = rows.length;
  const present = rows.filter(r => r.status === 'present' || r.status === 'late').length;
  const absent = rows.filter(r => r.status === 'absent').length;
  const late = rows.filter(r => r.status === 'late').length;
  const excused = rows.filter(r => r.status === 'excused').length;
  const rate = total ? Math.round((present / total) * 100) : 0;

  const statusColor = (s: string) => ({
    present: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
    absent: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
    late: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    excused: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  }[s] || 'bg-muted text-muted-foreground');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-primary" />
          {t('asc.attendance')}{studentName ? ` — ${studentName}` : ''}
          <span className="text-xs text-muted-foreground font-normal ml-auto">{t('asc.last')} {days} {t('asc.daysWord')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('asc.loading')}</p>
        ) : total === 0 ? (
          <p className="text-sm text-muted-foreground">{t('asc.noRecords')}</p>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{rate}%</span>
              <span className="text-sm text-muted-foreground">{t('asc.rate')}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-green-500/10">
                <div className="font-bold text-green-700 dark:text-green-400">{present - late}</div>
                <div className="text-muted-foreground">{t('asc.present')}</div>
              </div>
              <div className="p-2 rounded bg-amber-500/10">
                <div className="font-bold text-amber-700 dark:text-amber-400">{late}</div>
                <div className="text-muted-foreground">{t('asc.late')}</div>
              </div>
              <div className="p-2 rounded bg-red-500/10">
                <div className="font-bold text-red-700 dark:text-red-400">{absent}</div>
                <div className="text-muted-foreground">{t('asc.absent')}</div>
              </div>
              <div className="p-2 rounded bg-blue-500/10">
                <div className="font-bold text-blue-700 dark:text-blue-400">{excused}</div>
                <div className="text-muted-foreground">{t('asc.excused')}</div>
              </div>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {rows.slice(0, 7).map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs px-2 py-1 rounded hover:bg-muted/50">
                  <span className="text-foreground">{r.date}</span>
                  <Badge variant="outline" className={statusColor(r.status)}>{ASC_STATUS_KEY[r.status] ? t(ASC_STATUS_KEY[r.status]) : r.status}</Badge>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
