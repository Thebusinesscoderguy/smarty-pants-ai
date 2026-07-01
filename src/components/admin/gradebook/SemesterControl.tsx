import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CalendarClock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Semester } from '@/hooks/useActiveSemester';

/**
 * Admin-only "End Semester" control. Shows which semester is open and advances S1 -> S2.
 * "Finalizing" is implicit: marks are stamped with the semester active when entered, so
 * ending a semester simply routes new entries to the next one. At S2 the button is
 * disabled (S2 is the final semester of the year; year rollover is a separate feature).
 */
export const SemesterControl = ({
  schoolId, activeSemester, onChanged,
}: {
  schoolId: string;
  activeSemester: Semester;
  onChanged: (s: Semester) => void;
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const isFinal = activeSemester === 'S2';
  const semesterLabel = activeSemester === 'S1' ? t('gradebook.semester1') : t('gradebook.semester2');

  const endSemester = async () => {
    if (!user || isFinal) return;
    setIsEnding(true);
    try {
      const { error } = await supabase
        .from('school_semester_state')
        .upsert(
          { school_id: schoolId, active_semester: 'S2', updated_by: user.id, updated_at: new Date().toISOString() },
          { onConflict: 'school_id' },
        );
      if (error) throw error;
      onChanged('S2');
      setConfirmOpen(false);
      toast({ title: t('gbSem.ended'), description: t('gbSem.endedDesc') });
    } catch (e) {
      console.error(e);
      toast({ title: t('gbSem.error'), description: t('gbSem.failed'), variant: 'destructive' });
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <Card className="bg-muted/30 border-border">
      <CardContent className="p-4 flex items-center gap-3 flex-wrap">
        <CalendarClock className="h-4 w-4 text-primary shrink-0" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{t('gbSem.title')}:</span>
          <Badge variant="secondary">{semesterLabel}</Badge>
        </div>
        <p className="text-xs text-muted-foreground flex-1 min-w-[12rem]">
          {isFinal ? t('gbSem.finalNote') : t('gbSem.hint')}
        </p>
        <Button size="sm" variant="destructive" disabled={isFinal} onClick={() => setConfirmOpen(true)}>
          {t('gbSem.endBtn')}
        </Button>
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('gbSem.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('gbSem.confirmBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isEnding}>{t('gbSem.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); endSemester(); }} disabled={isEnding}>
              {isEnding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('gbSem.confirmCta')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
