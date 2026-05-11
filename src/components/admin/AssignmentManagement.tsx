import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, FileUp, Trash2, Eye, ClipboardList, Download, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Assignment {
  id: string; school_id: string; section_id: string | null; subject_id: string | null;
  created_by: string; title: string; description: string | null; due_date: string | null;
  total_points: number; attachment_urls: string[]; allow_late: boolean; late_penalty_pct: number;
  published: boolean; created_at: string;
}
interface Submission {
  id: string; assignment_id: string; student_id: string; content: string | null;
  attachment_urls: string[]; status: string; score: number | null; feedback: string | null;
  submitted_at: string | null;
}

export const AssignmentManagement = () => {
  const { user } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [items, setItems] = useState<Assignment[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [graderFor, setGraderFor] = useState<Assignment | null>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});

  // form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [sectionId, setSectionId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [totalPoints, setTotalPoints] = useState(100);
  const [allowLate, setAllowLate] = useState(true);
  const [latePenalty, setLatePenalty] = useState(0);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (user) init(); }, [user]);

  const init = async () => {
    if (!user) return;
    const { data: admin } = await supabase.from('school_accounts').select('id').eq('admin_user_id', user.id).maybeSingle();
    let sid = admin?.id as string | undefined;
    if (!sid) {
      const { data: t } = await supabase.from('school_teachers').select('school_id').eq('email', user.email?.toLowerCase() || '').eq('is_active', true).maybeSingle();
      sid = t?.school_id;
    }
    if (!sid) return;
    setSchoolId(sid);
    const [subj, secs] = await Promise.all([
      supabase.from('school_subjects').select('*').eq('school_id', sid),
      supabase.from('school_sections').select('*').eq('school_id', sid),
    ]);
    setSubjects(subj.data || []); setSections(secs.data || []);
    await loadList(sid);
  };

  const loadList = async (sid?: string) => {
    const sId = sid || schoolId; if (!sId) return;
    const { data } = await supabase.from('assignments' as any).select('*').eq('school_id', sId).order('created_at', { ascending: false });
    const list = (data || []) as unknown as Assignment[];
    setItems(list);
    if (list.length) {
      const { data: subRows } = await supabase.from('assignment_submissions' as any).select('assignment_id, status').in('assignment_id', list.map(a => a.id));
      const c: Record<string, number> = {};
      (subRows as any[] || []).forEach(r => { if (r.status === 'submitted' || r.status === 'graded' || r.status === 'late') c[r.assignment_id] = (c[r.assignment_id] || 0) + 1; });
      setCounts(c);
    }
  };

  const upload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('assignments').upload(path, file);
      if (error) throw error;
      setAttachments(prev => [...prev, path]);
      toast.success('File uploaded');
    } catch (e: any) { toast.error(e.message); } finally { setUploading(false); }
  };

  const reset = () => {
    setTitle(''); setDescription(''); setSubjectId(''); setSectionId(''); setDueDate('');
    setTotalPoints(100); setAllowLate(true); setLatePenalty(0); setAttachments([]);
  };

  const create = async (publish: boolean) => {
    if (!user || !schoolId || !title.trim()) { toast.error('Title required'); return; }
    const { error } = await supabase.from('assignments' as any).insert({
      school_id: schoolId, section_id: sectionId || null, subject_id: subjectId || null,
      created_by: user.id, title, description: description || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      total_points: totalPoints, attachment_urls: attachments,
      allow_late: allowLate, late_penalty_pct: latePenalty, published: publish,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success(publish ? 'Assignment published' : 'Draft saved');
    setDialogOpen(false); reset(); loadList();
  };

  const togglePublish = async (a: Assignment) => {
    await supabase.from('assignments' as any).update({ published: !a.published } as any).eq('id', a.id);
    loadList();
  };
  const remove = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    await supabase.from('assignments' as any).delete().eq('id', id);
    loadList();
  };

  const openGrader = async (a: Assignment) => {
    setGraderFor(a);
    const { data } = await supabase.from('assignment_submissions' as any).select('*').eq('assignment_id', a.id);
    const list = (data || []) as unknown as Submission[];
    setSubs(list);
    if (list.length) {
      const { data: profs } = await supabase.from('profiles').select('id, display_name').in('id', list.map(s => s.student_id));
      setStudentNames(Object.fromEntries((profs || []).map(p => [p.id, p.display_name || 'Student'])));
    }
  };

  const grade = async (sub: Submission, score: number, feedback: string) => {
    if (!user) return;
    const { error } = await supabase.from('assignment_submissions' as any).update({
      score, feedback, status: 'graded', graded_by: user.id, graded_at: new Date().toISOString(),
    } as any).eq('id', sub.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Graded');
    if (graderFor) openGrader(graderFor);
  };

  const downloadAttachment = async (path: string) => {
    const { data } = await supabase.storage.from('assignments').createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold">Assignments</h2>
          <p className="text-muted-foreground">Create homework with files, deadlines, and grading.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Assignment</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Assignment</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
              <div><Label>Instructions</Label><Textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Subject</Label>
                  <Select value={subjectId} onValueChange={setSubjectId}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent className="bg-popover">{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Section</Label>
                  <Select value={sectionId} onValueChange={setSectionId}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-popover">{sections.map(s => <SelectItem key={s.id} value={s.id}>{s.grade_level} - {s.section_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Due Date</Label><Input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
                <div><Label>Total Points</Label><Input type="number" value={totalPoints} onChange={e => setTotalPoints(Number(e.target.value))} /></div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2"><Switch checked={allowLate} onCheckedChange={setAllowLate} /><Label>Allow late submissions</Label></div>
                {allowLate && <div className="flex items-center gap-2"><Label>Late penalty %</Label><Input className="w-20" type="number" value={latePenalty} onChange={e => setLatePenalty(Number(e.target.value))} /></div>}
              </div>
              <div>
                <Label>Attachments</Label>
                <div className="flex items-center gap-2">
                  <Input type="file" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} disabled={uploading} />
                </div>
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {attachments.map((p, i) => (
                      <div key={p} className="flex items-center justify-between text-sm bg-muted rounded px-2 py-1">
                        <span className="truncate">{p.split('/').pop()}</span>
                        <Button size="sm" variant="ghost" onClick={() => setAttachments(attachments.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => create(false)}>Save Draft</Button>
              <Button onClick={() => create(true)}><Send className="h-4 w-4 mr-1" />Publish</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>No assignments yet.</p></CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {items.map(a => {
            const sec = sections.find(s => s.id === a.section_id);
            const subj = subjects.find(s => s.id === a.subject_id);
            const overdue = a.due_date && new Date(a.due_date) < new Date();
            return (
              <Card key={a.id}>
                <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{a.title}</h3>
                      {a.published ? <Badge>Published</Badge> : <Badge variant="outline">Draft</Badge>}
                      {overdue && <Badge variant="destructive">Past Due</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-3">
                      {subj && <span>{subj.name}</span>}
                      {sec && <span>{sec.grade_level} {sec.section_name}</span>}
                      {a.due_date && <span>Due {new Date(a.due_date).toLocaleString()}</span>}
                      <span>{a.total_points} pts</span>
                      <span>{counts[a.id] || 0} submissions</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" onClick={() => openGrader(a)}><Eye className="h-4 w-4 mr-1" />Submissions</Button>
                    <Button size="sm" variant="ghost" onClick={() => togglePublish(a)}>{a.published ? 'Unpublish' : 'Publish'}</Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!graderFor} onOpenChange={(o) => !o && setGraderFor(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Submissions — {graderFor?.title}</DialogTitle></DialogHeader>
          {subs.length === 0 ? <p className="text-sm text-muted-foreground">No submissions yet.</p> : (
            <div className="space-y-3">
              {subs.map(s => <SubmissionRow key={s.id} sub={s} studentName={studentNames[s.student_id] || 'Student'} maxPoints={graderFor?.total_points || 100} onGrade={grade} onDownload={downloadAttachment} />)}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SubmissionRow = ({ sub, studentName, maxPoints, onGrade, onDownload }: {
  sub: Submission; studentName: string; maxPoints: number;
  onGrade: (sub: Submission, score: number, feedback: string) => void;
  onDownload: (path: string) => void;
}) => {
  const [score, setScore] = useState<number>(sub.score ?? 0);
  const [feedback, setFeedback] = useState(sub.feedback ?? '');
  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div><span className="font-medium">{studentName}</span>
            <Badge variant="outline" className="ml-2">{sub.status}</Badge>
            {sub.submitted_at && <span className="text-xs text-muted-foreground ml-2">{new Date(sub.submitted_at).toLocaleString()}</span>}
          </div>
        </div>
        {sub.content && <div className="text-sm bg-muted p-2 rounded whitespace-pre-wrap">{sub.content}</div>}
        {sub.attachment_urls?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {sub.attachment_urls.map(p => (
              <Button key={p} size="sm" variant="outline" onClick={() => onDownload(p)}><Download className="h-3 w-3 mr-1" />{p.split('/').pop()}</Button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 flex-wrap">
          <div><Label className="text-xs">Score / {maxPoints}</Label><Input className="w-24" type="number" value={score} onChange={e => setScore(Number(e.target.value))} /></div>
          <div className="flex-1 min-w-[200px]"><Label className="text-xs">Feedback</Label><Input value={feedback} onChange={e => setFeedback(e.target.value)} /></div>
          <Button size="sm" onClick={() => onGrade(sub, score, feedback)}>Save Grade</Button>
        </div>
      </CardContent>
    </Card>
  );
};
