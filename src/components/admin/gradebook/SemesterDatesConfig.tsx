import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Loader2, CalendarRange } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * School-wide semester date ranges (admin only). The gradebook Summary uses these to
 * bound period-based components (classwork/homework two-stage average, attendance) to a
 * semester. Edits apply to the current academic year and to the whole school (not per
 * subject), even though this editor renders inside a subject's Summary tab.
 */
type Row = { start_date: string; end_date: string };
const empty = (): Row => ({ start_date: '', end_date: '' });

export const SemesterDatesConfig = ({ schoolId }: { schoolId: string }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const now = new Date();
  const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const academicYear = `${startYear}-${startYear + 1}`;

  const [rows, setRows] = useState<Record<'S1' | 'S2', Row>>({ S1: empty(), S2: empty() });
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    const { data } = await supabase
      .from('school_semester_dates')
      .select('semester, start_date, end_date')
      .eq('school_id', schoolId)
      .eq('academic_year', academicYear);
    const next: Record<'S1' | 'S2', Row> = { S1: empty(), S2: empty() };
    for (const d of data || []) {
      if (d.semester === 'S1' || d.semester === 'S2') {
        next[d.semester] = { start_date: d.start_date ?? '', end_date: d.end_date ?? '' };
      }
    }
    setRows(next);
  }, [schoolId, academicYear]);

  useEffect(() => { load(); }, [load]);

  const setCell = (sem: 'S1' | 'S2', key: keyof Row, value: string) =>
    setRows(prev => ({ ...prev, [sem]: { ...prev[sem], [key]: value } }));

  const save = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const upserts = (['S1', 'S2'] as const)
        .filter(sem => rows[sem].start_date && rows[sem].end_date)
        .map(sem => ({
          school_id: schoolId,
          academic_year: academicYear,
          semester: sem,
          start_date: rows[sem].start_date,
          end_date: rows[sem].end_date,
          created_by: user.id,
          updated_at: new Date().toISOString(),
        }));
      if (!upserts.length) { toast({ title: t('gbSemDates.nothingToSave') }); setIsSaving(false); return; }
      const { error } = await supabase
        .from('school_semester_dates')
        .upsert(upserts, { onConflict: 'school_id,academic_year,semester' });
      if (error) throw error;
      toast({ title: t('gbSemDates.saved'), description: `${t('gbSemDates.savedDescPrefix')} ${academicYear}` });
      load();
    } catch (e) {
      console.error(e);
      toast({ title: t('gbSemDates.error'), description: t('gbSemDates.failedSave'), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const row = (sem: 'S1' | 'S2', label: string) => (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="w-28 text-sm font-medium text-foreground">{label}</span>
      <Input type="date" className="w-auto h-8" value={rows[sem].start_date}
        onChange={e => setCell(sem, 'start_date', e.target.value)} />
      <span className="text-muted-foreground text-sm">—</span>
      <Input type="date" className="w-auto h-8" value={rows[sem].end_date}
        onChange={e => setCell(sem, 'end_date', e.target.value)} />
    </div>
  );

  return (
    <Card className="bg-muted/30 border-border">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarRange className="h-4 w-4 text-primary" />
          {t('gbSemDates.title')} <span className="font-normal text-muted-foreground">({academicYear})</span>
        </div>
        <p className="text-xs text-muted-foreground">{t('gbSemDates.hint')}</p>
        {row('S1', t('gradebook.semester1'))}
        {row('S2', t('gradebook.semester2'))}
        <Button size="sm" onClick={save} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {t('gbSemDates.save')}
        </Button>
      </CardContent>
    </Card>
  );
};
