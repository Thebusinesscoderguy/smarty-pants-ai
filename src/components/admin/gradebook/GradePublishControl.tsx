import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { riyadhToday, isPublishDay } from './types';

/**
 * Term-start setting (admin) + biweekly-Wednesday Publish action (teacher/admin).
 * The button only enables on a publish day (Riyadh); the server RPC re-enforces the gate,
 * so off-schedule publishing is impossible regardless of the UI.
 */
export const GradePublishControl = ({
  schoolId, subjectId, isAdmin,
}: { schoolId: string; subjectId: string; isAdmin: boolean }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [termStart, setTermStart] = useState<string>('');
  const [savedStart, setSavedStart] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    const { data } = await supabase
      .from('school_grade_settings')
      .select('term_start_date')
      .eq('school_id', schoolId)
      .maybeSingle();
    setSavedStart(data?.term_start_date ?? null);
    setTermStart(data?.term_start_date ?? '');
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const saveStart = async () => {
    if (!user || !termStart) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('school_grade_settings')
        .upsert({ school_id: schoolId, term_start_date: termStart, updated_by: user.id, updated_at: new Date().toISOString() },
          { onConflict: 'school_id' });
      if (error) throw error;
      setSavedStart(termStart);
      toast({ title: t('gbPublish.saved') });
    } catch (e) {
      console.error(e);
      toast({ title: t('gbPublish.error'), description: t('gbPublish.saveFailed'), variant: 'destructive' });
    } finally { setIsSaving(false); }
  };

  const canPublishToday = !!savedStart && isPublishDay(riyadhToday(), savedStart);

  const publish = async () => {
    setIsPublishing(true);
    try {
      const { data, error } = await supabase.rpc('publish_grades', { p_subject_id: subjectId });
      if (error) throw error;
      toast({ title: t('gbPublish.published'), description: `${data ?? 0} ${t('gbPublish.itemsSuffix')}` });
    } catch (e: any) {
      console.error(e);
      toast({ title: t('gbPublish.error'), description: e?.message || t('gbPublish.publishFailed'), variant: 'destructive' });
    } finally { setIsPublishing(false); }
  };

  return (
    <Card className="bg-muted/30 border-border">
      <CardContent className="p-4 flex items-center gap-3 flex-wrap">
        <CalendarDays className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-semibold text-foreground">{t('gbPublish.title')}</span>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t('gbPublish.termStartLabel')}</span>
            <Input type="date" className="w-auto h-8" value={termStart} onChange={e => setTermStart(e.target.value)} />
            <Button size="sm" variant="outline" onClick={saveStart} disabled={isSaving || !termStart}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('gbPublish.saveStart')}
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-muted-foreground">
            {!savedStart ? t('gbPublish.noTermStart') : canPublishToday ? t('gbPublish.openToday') : t('gbPublish.closedHint')}
          </span>
          <Button size="sm" onClick={publish} disabled={!canPublishToday || isPublishing}>
            {isPublishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            {t('gbPublish.publishBtn')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
