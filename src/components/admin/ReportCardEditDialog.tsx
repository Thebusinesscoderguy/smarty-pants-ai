import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface Card {
  id: string;
  student_id: string;
  student_name?: string;
  name?: string;
  term: string;
  academic_year: string;
  data: any;
}

interface Props {
  card: Card | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}

export const ReportCardEditDialog = ({ card, open, onOpenChange, onSaved }: Props) => {
  const { t, language } = useLanguage();
  const [comments, setComments] = useState('');
  const [overall, setOverall] = useState('');
  const [attendance, setAttendance] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!card) return;
    setComments(card.data?.comments || '');
    setOverall(card.data?.overall != null ? String(card.data.overall) : '');
    setAttendance(card.data?.attendance_rate != null ? String(card.data.attendance_rate) : '');
  }, [card]);

  if (!card) return null;
  const name = card.student_name || card.name || t('rcEdit.studentFallback');

  const generateRemarks = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report-card-remarks', {
        body: {
          student_name: name,
          term: card.term,
          subjects: card.data?.subjects || [],
          overall: card.data?.overall,
          attendance_rate: card.data?.attendance_rate,
          language,
        },
      });
      if (error) throw error;
      if (data?.remarks) setComments(data.remarks);
      else throw new Error(t('rcEdit.noRemarks'));
    } catch (e: any) {
      toast.error(e.message || t('rcEdit.aiFailed'));
    } finally { setAiLoading(false); }
  };

  const save = async () => {
    setSaving(true);
    const newData = {
      ...(card.data || {}),
      comments: comments || null,
      overall: overall ? Number(overall) : card.data?.overall ?? null,
      attendance_rate: attendance ? Number(attendance) : card.data?.attendance_rate ?? null,
    };
    const { error } = await supabase.from('report_cards').update({ data: newData }).eq('id', card.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t('rc.saved'));
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{t('rcEdit.title')} {name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('rcEdit.overall')}</Label>
              <Input value={overall} onChange={e => setOverall(e.target.value)} placeholder="0-100" />
            </div>
            <div>
              <Label>{t('rcEdit.attendance')}</Label>
              <Input value={attendance} onChange={e => setAttendance(e.target.value)} placeholder="0-100" />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label>{t('rcEdit.remarks')}</Label>
              <Button size="sm" variant="outline" onClick={generateRemarks} disabled={aiLoading}>
                <Sparkles className="h-3 w-3 mr-1" />{aiLoading ? t('rcEdit.generating') : t('rcEdit.generateAi')}
              </Button>
            </div>
            <Textarea rows={5} value={comments} onChange={e => setComments(e.target.value)} placeholder={t('rcEdit.remarksPlaceholder')} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('rcEdit.cancel')}</Button>
          <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? t('rcEdit.saving') : t('rcEdit.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
