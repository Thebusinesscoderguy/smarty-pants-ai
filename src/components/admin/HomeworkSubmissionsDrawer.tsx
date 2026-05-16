import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Paperclip, CheckCircle2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  assignmentId: string | null;
  sectionId: string | null;
  title: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface Row {
  student_id: string;
  student_name: string;
  submission?: {
    id: string;
    status: string;
    response_data: any;
    score: number | null;
    feedback: string | null;
    ai_score: number | null;
    ai_feedback: string | null;
    ai_confidence: number | null;
    submitted_at: string | null;
  };
  draftScore: string;
  draftFeedback: string;
}

export const HomeworkSubmissionsDrawer = ({ assignmentId, sectionId, title, open, onOpenChange }: Props) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !assignmentId) return;
    void load();
  }, [open, assignmentId, sectionId]);

  const load = async () => {
    setLoading(true);
    try {
      let studentIds: string[] = [];
      if (sectionId) {
        const { data: ss } = await supabase.from('section_students').select('student_id').eq('section_id', sectionId);
        studentIds = (ss || []).map((s: any) => s.student_id);
      }
      const { data: subs } = await supabase
        .from('homework_submissions')
        .select('*')
        .eq('assignment_id', assignmentId!);

      // If no section, derive students from submissions
      if (!studentIds.length) studentIds = Array.from(new Set((subs || []).map((s: any) => s.student_id)));
      if (!studentIds.length) { setRows([]); setLoading(false); return; }

      const { data: profs } = await supabase.from('profiles').select('id, display_name').in('id', studentIds);
      const nameById = new Map((profs || []).map((p: any) => [p.id, p.display_name || 'Student']));
      const subBy = new Map((subs || []).map((s: any) => [s.student_id, s]));

      setRows(studentIds.map(sid => {
        const sub = subBy.get(sid) as any;
        return {
          student_id: sid,
          student_name: nameById.get(sid) || 'Student',
          submission: sub,
          draftScore: sub?.score != null ? String(sub.score) : sub?.ai_score != null ? String(sub.ai_score) : '',
          draftFeedback: sub?.feedback || sub?.ai_feedback || '',
        };
      }));
    } finally { setLoading(false); }
  };

  const setDraft = (sid: string, patch: Partial<Row>) => {
    setRows(prev => prev.map(r => r.student_id === sid ? { ...r, ...patch } : r));
  };

  const saveGrade = async (row: Row) => {
    if (!row.submission) return;
    setSaving(row.student_id);
    const score = row.draftScore ? Number(row.draftScore) : null;
    const { error } = await supabase.from('homework_submissions').update({
      score, feedback: row.draftFeedback || null, status: 'graded',
    }).eq('id', row.submission.id);
    setSaving(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`Saved grade for ${row.student_name}`);
    void load();
  };

  const approveAllAi = async () => {
    const toApprove = rows.filter(r => r.submission?.status === 'ai_graded');
    if (!toApprove.length) { toast.info('No AI grades to approve'); return; }
    for (const r of toApprove) {
      await supabase.from('homework_submissions').update({
        score: r.submission!.ai_score, feedback: r.submission!.ai_feedback, status: 'graded',
      }).eq('id', r.submission!.id);
    }
    toast.success(`Approved ${toApprove.length} AI grades`);
    void load();
  };

  const downloadAttachment = async (path: string) => {
    const { data, error } = await supabase.storage.from('assignments').createSignedUrl(path, 300);
    if (error || !data?.signedUrl) { toast.error('Could not load file'); return; }
    window.open(data.signedUrl, '_blank');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex justify-end">
          <Button size="sm" variant="outline" onClick={approveAllAi}>
            <Sparkles className="h-4 w-4 mr-1" />Approve all AI grades
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && rows.length === 0 && <p className="text-sm text-muted-foreground">No students assigned.</p>}
          {rows.map(r => {
            const status = r.submission?.status || 'not_submitted';
            const attachments: string[] = Array.isArray(r.submission?.response_data?.attachments)
              ? r.submission!.response_data.attachments : [];
            const text = r.submission?.response_data?.text || '';
            return (
              <div key={r.student_id} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <div className="font-medium">{r.student_name}</div>
                  <Badge variant={
                    status === 'graded' ? 'default'
                    : status === 'ai_graded' ? 'secondary'
                    : status === 'submitted' ? 'outline'
                    : 'outline'
                  }>
                    {status === 'not_submitted' ? 'Not submitted' : status}
                  </Badge>
                </div>

                {r.submission ? (
                  <>
                    {text && <p className="text-sm bg-muted/50 rounded p-2 whitespace-pre-wrap">{text}</p>}
                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((p, i) => (
                          <Button key={i} variant="outline" size="sm" onClick={() => downloadAttachment(p)}>
                            <Paperclip className="h-3 w-3 mr-1" />{p.split('/').pop()}
                          </Button>
                        ))}
                      </div>
                    )}
                    {r.submission.ai_score != null && status !== 'graded' && (
                      <div className="text-xs text-muted-foreground">
                        AI suggests: <strong>{r.submission.ai_score}</strong>
                        {r.submission.ai_confidence != null && ` (${Math.round(r.submission.ai_confidence * 100)}% confidence)`}
                      </div>
                    )}
                    <div className="flex gap-2 items-end">
                      <div className="w-24">
                        <label className="text-xs text-muted-foreground">Score</label>
                        <Input value={r.draftScore} onChange={e => setDraft(r.student_id, { draftScore: e.target.value })} placeholder="0-100" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground">Feedback</label>
                        <Textarea rows={2} value={r.draftFeedback} onChange={e => setDraft(r.student_id, { draftFeedback: e.target.value })} />
                      </div>
                      <Button size="sm" onClick={() => saveGrade(r)} disabled={saving === r.student_id}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />{saving === r.student_id ? 'Saving…' : 'Save'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Student has not submitted yet.</p>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};
