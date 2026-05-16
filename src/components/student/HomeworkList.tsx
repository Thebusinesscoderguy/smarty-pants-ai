import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardCheck, Clock, CheckCircle, Paperclip, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface HomeworkItem {
  id: string;
  title: string;
  description: string | null;
  assignment_type: string;
  due_date: string | null;
  submission?: {
    id: string;
    status: string;
    score: number | null;
    feedback: string | null;
  };
}

export const HomeworkList = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Record<string, { path: string; name: string }[]>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetchHomework();
  }, [user]);

  const fetchHomework = async () => {
    if (!user) return;

    const { data: assignments } = await supabase
      .from('homework_assignments')
      .select('*')
      .eq('is_active', true)
      .order('due_date', { ascending: true });

    if (!assignments) return;

    const { data: subs } = await supabase
      .from('homework_submissions')
      .select('*')
      .eq('student_id', user.id);

    const subMap = new Map(subs?.map(s => [s.assignment_id, s]) || []);

    setHomework(assignments.map(a => ({
      ...a,
      submission: subMap.get(a.id) ? {
        id: subMap.get(a.id)!.id,
        status: subMap.get(a.id)!.status,
        score: subMap.get(a.id)!.score,
        feedback: subMap.get(a.id)!.feedback,
      } : undefined,
    })));
  };

  const handleSubmit = async (assignmentId: string) => {
    if (!user) return;
    setSubmitting(assignmentId);
    try {
      const { error } = await supabase.from('homework_submissions').upsert({
        assignment_id: assignmentId,
        student_id: user.id,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        response_data: { text: responses[assignmentId] || '', attachments: (attachments[assignmentId] || []).map(a => a.path) },
      }, { onConflict: 'assignment_id,student_id' });
      if (error) throw error;
      toast({ title: t('homework.success'), description: t('homework.successDesc') });
      fetchHomework();
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(null);
    }
  };

  const isOverdue = (date: string | null) => date ? new Date(date) < new Date() : false;

  const dueChip = (date: string | null) => {
    if (!date) return null;
    const ms = new Date(date).getTime() - Date.now();
    const days = Math.ceil(ms / 86400000);
    if (ms < 0) return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
    if (days === 0) return <Badge className="text-xs bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30">Due today</Badge>;
    if (days <= 2) return <Badge className="text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30">Due in {days}d</Badge>;
    return <Badge variant="outline" className="text-xs">Due in {days}d</Badge>;
  };

  const handleFile = async (assignmentId: string, files: FileList | null) => {
    if (!user || !files || !files.length) return;
    setUploading(assignmentId);
    try {
      const added: { path: string; name: string }[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 20 * 1024 * 1024) { toast({ title: 'File too large', description: `${file.name} exceeds 20MB`, variant: 'destructive' }); continue; }
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${user.id}/${assignmentId}/${Date.now()}-${safe}`;
        const { error } = await supabase.storage.from('assignments').upload(path, file, { upsert: false });
        if (error) { toast({ title: 'Upload failed', description: error.message, variant: 'destructive' }); continue; }
        added.push({ path, name: file.name });
      }
      setAttachments(prev => ({ ...prev, [assignmentId]: [...(prev[assignmentId] || []), ...added] }));
    } finally { setUploading(null); }
  };

  const removeAttachment = async (assignmentId: string, path: string) => {
    await supabase.storage.from('assignments').remove([path]);
    setAttachments(prev => ({ ...prev, [assignmentId]: (prev[assignmentId] || []).filter(a => a.path !== path) }));
  };

  if (homework.length === 0) return null;

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 rounded-2xl hover:shadow-lg transition-all duration-300" dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          {t('homework.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {homework.map(hw => (
          <div key={hw.id} className="p-4 rounded-xl bg-muted/50 border border-border transition-all duration-200 hover:border-primary/30">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-foreground">{hw.title}</h4>
                {hw.description && <p className="text-sm text-muted-foreground mt-1">{hw.description}</p>}
              </div>
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Badge variant="outline" className="border-primary/30 text-primary">{hw.assignment_type}</Badge>
                {hw.submission?.status === 'submitted' && (
                  <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
                    <CheckCircle className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />{t('homework.submitted')}
                  </Badge>
                )}
                {hw.submission?.status === 'graded' && (
                  <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30">
                    {t('homework.graded')}: {hw.submission.score}
                  </Badge>
                )}
              </div>
            </div>
            {hw.due_date && (
              <p className={`text-xs flex items-center gap-1 mb-3 ${isOverdue(hw.due_date) ? 'text-destructive' : 'text-muted-foreground'}`}>
                <Clock className="h-3 w-3" />
                {t('homework.due')}: {new Date(hw.due_date).toLocaleDateString(isRTL ? 'ar-SA' : undefined)} {isOverdue(hw.due_date) && `(${t('homework.overdue')})`}
              </p>
            )}
            {!hw.submission || hw.submission.status === 'pending' ? (
              <div className="space-y-2">
                <Textarea
                  placeholder={t('homework.placeholder')}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                  value={responses[hw.id] || ''}
                  onChange={e => setResponses(prev => ({ ...prev, [hw.id]: e.target.value }))}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                <Button
                  size="sm"
                  onClick={() => handleSubmit(hw.id)}
                  disabled={submitting === hw.id}
                >
                  {submitting === hw.id ? t('homework.submitting') : t('homework.submit')}
                </Button>
              </div>
            ) : hw.submission.feedback ? (
              <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted/50 rounded-lg">
                <strong className="text-foreground">{t('homework.feedback')}:</strong> {hw.submission.feedback}
              </p>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
