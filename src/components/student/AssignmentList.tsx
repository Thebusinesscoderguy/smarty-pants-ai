import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ClipboardList, Clock, CheckCircle, Download, Paperclip } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface AssignmentItem {
  id: string; title: string; description: string | null; due_date: string | null;
  total_points: number; attachment_urls: string[]; allow_late: boolean;
  submission?: { id: string; status: string; score: number | null; feedback: string | null; content: string | null; attachment_urls: string[] };
}

export const AssignmentList = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [items, setItems] = useState<AssignmentItem[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [uploads, setUploads] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    if (!user) return;
    const { data: secStudents } = await supabase.from('section_students').select('section_id').eq('student_id', user.id);
    const sectionIds = (secStudents || []).map(s => s.section_id);
    if (!sectionIds.length) { setItems([]); return; }
    const { data: list } = await supabase.from('assignments' as any).select('*').eq('published', true).in('section_id', sectionIds).order('due_date', { ascending: true });
    const assigns = (list || []) as any[];
    if (!assigns.length) { setItems([]); return; }
    const { data: subs } = await supabase.from('assignment_submissions' as any).select('*').eq('student_id', user.id).in('assignment_id', assigns.map(a => a.id));
    const map = new Map<string, any>(((subs as any[]) || []).map(s => [s.assignment_id, s]));
    setItems(assigns.map(a => ({ ...a, submission: map.get(a.id) })));
  };

  const upload = async (assignId: string, file: File) => {
    if (!user) return;
    const path = `${user.id}/${assignId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('assignments').upload(path, file);
    if (error) { toast.error(error.message); return; }
    setUploads(prev => ({ ...prev, [assignId]: [...(prev[assignId] || []), path] }));
    toast.success(t('al2.fileUploaded'));
  };

  const submit = async (a: AssignmentItem) => {
    if (!user) return;
    setSubmitting(a.id);
    try {
      const overdue = a.due_date && new Date(a.due_date) < new Date();
      const status = overdue ? 'late' : 'submitted';
      const { error } = await supabase.from('assignment_submissions' as any).upsert({
        assignment_id: a.id, student_id: user.id,
        content: responses[a.id] || null,
        attachment_urls: uploads[a.id] || [],
        status, submitted_at: new Date().toISOString(),
      } as any, { onConflict: 'assignment_id,student_id' });
      if (error) throw error;
      toast.success(t('al2.submitted'));
      load();
    } catch (e: any) { toast.error(e.message); } finally { setSubmitting(null); }
  };

  const downloadFile = async (path: string) => {
    const { data } = await supabase.storage.from('assignments').createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />{t('al2.assignments')}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.map(a => {
          const overdue = a.due_date && new Date(a.due_date) < new Date();
          const submitted = a.submission && a.submission.status !== 'draft';
          return (
            <div key={a.id} className="p-3 rounded-lg border border-border bg-muted/30">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <h4 className="font-semibold">{a.title}</h4>
                  {a.description && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.description}</p>}
                </div>
                <div className="flex gap-1 flex-wrap">
                  <Badge variant="outline">{a.total_points} {t('al2.ptsSuffix')}</Badge>
                  {submitted && a.submission?.status === 'graded' && <Badge>{t('al2.gradedPrefix')} {a.submission.score}/{a.total_points}</Badge>}
                  {submitted && a.submission?.status !== 'graded' && <Badge className="bg-green-500/20 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />{t('al2.submitted')}</Badge>}
                </div>
              </div>
              {a.due_date && (
                <p className={`text-xs flex items-center gap-1 mt-1 ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                  <Clock className="h-3 w-3" />{t('al2.duePrefix')} {new Date(a.due_date).toLocaleString()} {overdue && t('al2.pastDue')}
                </p>
              )}
              {a.attachment_urls?.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-2">
                  {a.attachment_urls.map(p => (
                    <Button key={p} size="sm" variant="outline" onClick={() => downloadFile(p)}><Download className="h-3 w-3 mr-1" />{p.split('/').pop()}</Button>
                  ))}
                </div>
              )}
              {!submitted ? (
                (overdue && !a.allow_late) ? <p className="text-sm text-destructive mt-2">{t('al2.lateNotAllowed')}</p> : (
                  <div className="space-y-2 mt-3">
                    <Textarea placeholder={t('al2.yourAnswer')} value={responses[a.id] || ''} onChange={e => setResponses(p => ({ ...p, [a.id]: e.target.value }))} />
                    <div className="flex items-center gap-2 flex-wrap">
                      <Input type="file" className="flex-1 min-w-[160px]" onChange={e => e.target.files?.[0] && upload(a.id, e.target.files[0])} />
                      <Button size="sm" onClick={() => submit(a)} disabled={submitting === a.id}>{submitting === a.id ? t('al2.submitting') : t('al2.submit')}</Button>
                    </div>
                    {(uploads[a.id] || []).length > 0 && (
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
                        {(uploads[a.id] || []).map(p => <span key={p} className="bg-muted px-1.5 py-0.5 rounded inline-flex items-center gap-1"><Paperclip className="h-3 w-3" />{p.split('/').pop()}</span>)}
                      </div>
                    )}
                  </div>
                )
              ) : a.submission?.feedback ? (
                <p className="text-sm mt-2 p-2 bg-muted rounded"><strong>{t('al2.feedback')}</strong> {a.submission.feedback}</p>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
