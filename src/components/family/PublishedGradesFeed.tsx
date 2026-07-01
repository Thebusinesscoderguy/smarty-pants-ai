import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, BookOpen, CalendarDays, Award, LayoutGrid } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { EmptyHint } from './EmptyHint';

/* Published grade items — the ONLY grade data students/parents can read (RLS-scoped).
   Rendered as reference-style cards (type, title, component, subject, week/date, mark). */

interface Item {
  id: string;
  component: string;
  title: string | null;
  is_weekly: boolean;
  week_number: number | null;
  occurred_on: string | null;
  mark_value: number | null;
  mark_max: number | null;
  subject: string;
  published_at: string;
}

// component -> i18n keys for the card "type" and the component label line.
const COMPONENT_META: Record<string, { typeKey: string; labelKey: string }> = {
  classwork:  { typeKey: 'gbFeed.typeClasswork',  labelKey: 'gradebook.classwork' },
  homework:   { typeKey: 'gbFeed.typeHomework',   labelKey: 'gradebook.homework' },
  literacy:   { typeKey: 'gbFeed.typeLiteracy',   labelKey: 'gradebook.literacy' },
  attendance: { typeKey: 'gbFeed.typeAttendance', labelKey: 'gbFeed.compAttendance' },
  quiz1:      { typeKey: 'gbFeed.typeQuiz',        labelKey: 'rubric.quiz1' },
  quiz2:      { typeKey: 'gbFeed.typeQuiz',        labelKey: 'rubric.quiz2' },
  final_exam: { typeKey: 'gbFeed.typeExam',        labelKey: 'gbSemester.finalExamCol' },
  project:    { typeKey: 'gbFeed.typeProject',     labelKey: 'gbSemester.projectCol' },
};

export const PublishedGradesFeed = ({ studentId }: { studentId: string }) => {
  const { t } = useLanguage();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('published_grades')
      .select('id, component, title, is_weekly, week_number, occurred_on, mark_value, mark_max, subject_id, published_at')
      .eq('student_id', studentId)
      .order('published_at', { ascending: false })
      .limit(100);

    const subjectIds = [...new Set((data || []).map(d => d.subject_id))];
    const nameById: Record<string, string> = {};
    if (subjectIds.length) {
      const { data: subs } = await supabase.from('school_subjects').select('id, name').in('id', subjectIds);
      (subs || []).forEach(s => { nameById[s.id] = s.name; });
    }
    setItems((data || []).map(d => ({
      id: d.id, component: d.component, title: d.title, is_weekly: d.is_weekly,
      week_number: d.week_number, occurred_on: d.occurred_on,
      mark_value: d.mark_value, mark_max: d.mark_max,
      subject: nameById[d.subject_id] || t('fh.subjectFallback'),
      published_at: d.published_at,
    })));
    setLoading(false);
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <p className="text-sm text-muted-foreground">{t('fh.loadingShort')}</p>;
  if (items.length === 0) return <EmptyHint icon={ClipboardList} text={t('gbFeed.empty')} />;

  return (
    <div className="space-y-3">
      {items.map(it => {
        const meta = COMPONENT_META[it.component] ?? { typeKey: 'gbFeed.typeGrade', labelKey: it.component };
        const compLabel = t(meta.labelKey);
        const title = it.title
          || (it.is_weekly ? `${compLabel} — ${t('gbFeed.week')} ${it.week_number}` : compLabel);
        return (
          <Card key={it.id} className="bg-card border-border overflow-hidden">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="h-4 w-4 text-primary" />
                  </span>
                  <span className="font-semibold text-foreground">{t(meta.typeKey)}</span>
                </div>
                {it.published_at && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(it.published_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              <h4 className="font-semibold text-foreground">{title}</h4>

              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><LayoutGrid className="h-4 w-4" /> {compLabel}</div>
                <div className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> {it.subject}</div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {it.is_weekly && it.week_number != null
                    ? `${t('gbFeed.week')} ${it.week_number}`
                    : (it.occurred_on ? new Date(`${it.occurred_on}T00:00:00`).toLocaleDateString() : '—')}
                </div>
              </div>

              <Badge variant="secondary" className="text-primary">
                {it.mark_value ?? '—'} / {it.mark_max ?? '—'}
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
