import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

// Weekend definition — Saudi week is Friday + Saturday (getDay: Sun=0 … Sat=6).
// Change this one constant to shift the weekend (e.g. [0,6] for Sun/Sat).
export const WEEKEND_DAYS = [5, 6];
export const isWeekend = (d: Date) => WEEKEND_DAYS.includes(d.getDay());

export interface CalendarCategory { id: string; name: string; color: string; }
export interface CalendarEntry {
  id: string; category_id: string | null; title: string;
  start_date: string; end_date: string; description: string | null;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const toKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

interface Props {
  schoolId?: string;   // optional scope (admin view); read-only surfaces rely on RLS
  version?: number;    // bump to force a refetch after edits
}

export const SchoolCalendarView = ({ schoolId, version = 0 }: Props) => {
  const { t } = useLanguage();
  const today = new Date();
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [categories, setCategories] = useState<CalendarCategory[]>([]);
  const [entries, setEntries] = useState<CalendarEntry[]>([]);

  const grid = useMemo(() => {
    const monthStart = new Date(view.getFullYear(), view.getMonth(), 1);
    const gridStart = new Date(monthStart);
    gridStart.setDate(1 - monthStart.getDay()); // back to the Sunday of the first week
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d;
    });
  }, [view]);

  const load = useCallback(async () => {
    const gridStartKey = toKey(grid[0]);
    const gridEndKey = toKey(grid[41]);
    let catQ = supabase.from('school_calendar_categories').select('id, name, color');
    let entQ = supabase.from('school_calendar_entries')
      .select('id, category_id, title, start_date, end_date, description')
      .lte('start_date', gridEndKey).gte('end_date', gridStartKey);
    if (schoolId) { catQ = catQ.eq('school_id', schoolId); entQ = entQ.eq('school_id', schoolId); }
    const [{ data: cats }, { data: ents }] = await Promise.all([catQ, entQ]);
    setCategories((cats as CalendarCategory[]) || []);
    setEntries((ents as CalendarEntry[]) || []);
  }, [grid, schoolId]);

  useEffect(() => { load(); }, [load, version]);

  const colorOf = (e: CalendarEntry) => categories.find(c => c.id === e.category_id)?.color || '#64748b';
  const entriesOn = (d: Date) => { const k = toKey(d); return entries.filter(e => e.start_date <= k && e.end_date >= k); };

  const todayKey = toKey(today);
  const monthLabel = `${t(`calendar.mon${view.getMonth()}`)} ${view.getFullYear()}`;
  const shift = (n: number) => setView(new Date(view.getFullYear(), view.getMonth() + n, 1));

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">{monthLabel}</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setView(new Date(today.getFullYear(), today.getMonth(), 1))}>{t('calendar.today')}</Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((lbl, i) => (
            <div key={lbl} className={`text-center text-xs font-medium py-1 ${WEEKEND_DAYS.includes(i) ? 'text-amber-600 dark:text-amber-500' : 'text-muted-foreground'}`}>{t(`calendar.dow${i}`)}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {grid.map((d, i) => {
            const outside = d.getMonth() !== view.getMonth();
            const weekend = isWeekend(d);
            const isToday = toKey(d) === todayKey;
            const dayEntries = entriesOn(d);
            return (
              <div
                key={i}
                className={[
                  'min-h-[78px] rounded-md border p-1 text-left align-top overflow-hidden',
                  weekend ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/40' : 'bg-background border-border',
                  outside ? 'opacity-40' : '',
                ].join(' ')}
              >
                <div className={`text-[11px] mb-1 ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                  {d.getDate()}{isToday ? ' •' : ''}
                </div>
                <div className="space-y-0.5">
                  {dayEntries.slice(0, 3).map(e => (
                    <div key={e.id} title={e.title + (e.description ? ` — ${e.description}` : '')}
                      className="text-[10px] leading-tight text-white rounded px-1 py-0.5 truncate"
                      style={{ backgroundColor: colorOf(e) }}>
                      {e.title}
                    </div>
                  ))}
                  {dayEntries.length > 3 && <div className="text-[10px] text-muted-foreground px-1">+{dayEntries.length - 3} {t('calendar.more')}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 border-t border-border text-xs">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-background border border-border" /> {t('calendar.legendWeekday')}</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40" /> {t('calendar.legendWeekend')}</span>
          {categories.map(c => (
            <span key={c.id} className="flex items-center gap-1.5"><span className="h-3 w-3 rounded" style={{ backgroundColor: c.color }} /> {c.name}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
