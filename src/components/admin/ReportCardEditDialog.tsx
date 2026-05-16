import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const name = card.student_name || card.name || 'Student';

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
          language: 'en',
        },
      });
      if (error) throw error;
      if (data?.remarks) setComments(data.remarks);
      else throw new Error('No remarks returned');
    } catch (e: any) {
      toast.error(e.message || 'AI generation failed');
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
    toast.success('Saved');
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edit Report Card — {name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Overall %</Label>
              <Input value={overall} onChange={e => setOverall(e.target.value)} placeholder="0-100" />
            </div>
            <div>
              <Label>Attendance %</Label>
              <Input value={attendance} onChange={e => setAttendance(e.target.value)} placeholder="0-100" />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label>Principal's Remarks</Label>
              <Button size="sm" variant="outline" onClick={generateRemarks} disabled={aiLoading}>
                <Sparkles className="h-3 w-3 mr-1" />{aiLoading ? 'Generating…' : 'Generate with AI'}
              </Button>
            </div>
            <Textarea rows={5} value={comments} onChange={e => setComments(e.target.value)} placeholder="2-3 sentences about the student…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
