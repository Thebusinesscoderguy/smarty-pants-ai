import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

type Status = 'not_started' | 'in_progress' | 'achieved';
interface Goal {
  id: string; owner_id: string; owner_type: 'teacher' | 'student'; title: string; description: string | null;
  target_date: string | null; status: Status; progress: number; created_at: string;
}
interface Update { id: string; goal_id: string; note: string | null; progress: number | null; created_at: string; }

const STATUS_LABEL: Record<Status, string> = { not_started: 'Not started', in_progress: 'In progress', achieved: 'Achieved' };

export const GrowthGoals = () => {
  const { user, isSchoolAdmin } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [ready, setReady] = useState(false);

  // Create form
  const [forWhom, setForWhom] = useState<'self' | 'student'>('self');
  const [studentId, setStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const loadGoals = useCallback(async () => {
    // RLS scopes visibility: owners see own; teachers see their students'; admins see school-wide.
    const { data } = await supabase.from('growth_goals').select('*').order('created_at', { ascending: false });
    setGoals((data as Goal[]) || []);
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      let sid: string | null = null;
      const { data: school } = await supabase.from('school_accounts').select('id').eq('admin_user_id', user.id).maybeSingle();
      sid = school?.id ?? null;
      if (!sid) {
        const { data: t } = await supabase.from('school_teachers').select('school_id').ilike('email', user.email || '').eq('is_active', true).maybeSingle();
        sid = t?.school_id ?? null;
      }
      setSchoolId(sid);
      if (sid) {
        const { data: rels } = await supabase.from('school_student_relationships').select('student_id').eq('school_id', sid).eq('is_active', true);
        const ids = (rels || []).map(r => r.student_id);
        if (ids.length) {
          const { data: profs } = await supabase.from('profiles').select('id, display_name').in('id', ids);
          setStudents((profs || []).map(p => ({ id: p.id, name: p.display_name || 'Unknown' })).sort((a, b) => a.name.localeCompare(b.name)));
        }
      }
      await loadGoals();
      setReady(true);
    })();
  }, [user, loadGoals]);

  const createGoal = async () => {
    if (!user || !title.trim()) return;
    if (forWhom === 'student' && !studentId) return;
    const { error } = await supabase.from('growth_goals').insert({
      school_id: schoolId,
      owner_id: forWhom === 'self' ? user.id : studentId,
      owner_type: forWhom === 'self' ? 'teacher' : 'student',
      title: title.trim(), description: description.trim() || null,
      target_date: targetDate || null, status: 'not_started', progress: 0, created_by: user.id,
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Goal created' });
    setTitle(''); setDescription(''); setTargetDate(''); setStudentId('');
    loadGoals();
  };

  const studentName = (id: string) => students.find(s => s.id === id)?.name;
  const ownerLabel = (g: Goal) => g.owner_id === user?.id ? 'Me' : (g.owner_type === 'student' ? (studentName(g.owner_id) || 'Student') : 'Teacher');

  if (!ready) return <div className="animate-pulse text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Target className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Professional Growth Goals</h2>
          <p className="text-sm text-muted-foreground">Set goals, log progress, and mark them achieved</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">New goal</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Goal for</Label>
              <Select value={forWhom} onValueChange={(v) => setForWhom(v as 'self' | 'student')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Myself{isSchoolAdmin ? ' (staff)' : ' (teacher)'}</SelectItem>
                  <SelectItem value="student">A student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {forWhom === 'student' && (
              <div>
                <Label className="text-xs text-muted-foreground">Student</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Target date (optional)</Label>
              <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Improve questioning techniques" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <Button onClick={createGoal} disabled={!title.trim() || (forWhom === 'student' && !studentId)}>
            <Plus className="h-4 w-4 mr-2" />Create Goal
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {goals.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground">No goals yet.</CardContent></Card>
        ) : goals.map(g => (
          <GoalCard key={g.id} goal={g} ownerLabel={ownerLabel(g)} canEdit={g.owner_id === user?.id || isSchoolAdmin} onChange={loadGoals} userId={user!.id} />
        ))}
      </div>
    </div>
  );
};

const GoalCard = ({ goal, ownerLabel, canEdit, onChange, userId }: {
  goal: Goal; ownerLabel: string; canEdit: boolean; onChange: () => void; userId: string;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [note, setNote] = useState('');
  const [progress, setProgress] = useState(goal.progress);

  const loadUpdates = useCallback(async () => {
    const { data } = await supabase.from('goal_updates').select('*').eq('goal_id', goal.id).order('created_at', { ascending: false });
    setUpdates((data as Update[]) || []);
  }, [goal.id]);

  useEffect(() => { if (expanded) loadUpdates(); }, [expanded, loadUpdates]);

  const addUpdate = async () => {
    if (!note.trim() && progress === goal.progress) return;
    const status: Status = progress >= 100 ? 'achieved' : progress > 0 ? 'in_progress' : goal.status;
    const [{ error: uErr }, { error: gErr }] = await Promise.all([
      supabase.from('goal_updates').insert({ goal_id: goal.id, note: note.trim() || null, progress, created_by: userId }),
      supabase.from('growth_goals').update({ progress, status }).eq('id', goal.id),
    ]);
    if (uErr || gErr) { toast({ title: 'Error', description: (uErr || gErr)!.message, variant: 'destructive' }); return; }
    setNote('');
    loadUpdates();
    onChange();
  };

  const setStatus = async (status: Status) => {
    const prog = status === 'achieved' ? 100 : goal.progress;
    const { error } = await supabase.from('growth_goals').update({ status, progress: prog }).eq('id', goal.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setProgress(prog);
    onChange();
  };

  return (
    <Card>
      <button onClick={() => setExpanded(v => !v)} className="w-full text-left">
        <CardContent className="p-4 flex items-center gap-3">
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{goal.title}</span>
              <Badge variant="outline" className="text-[10px]">{ownerLabel}</Badge>
              <Badge variant={goal.status === 'achieved' ? 'secondary' : 'default'} className="text-[10px]">{STATUS_LABEL[goal.status]}</Badge>
            </div>
            <Progress value={goal.progress} className="h-1.5 mt-2" />
          </div>
          <span className="text-sm text-muted-foreground">{goal.progress}%</span>
        </CardContent>
      </button>

      {expanded && (
        <CardContent className="border-t border-border pt-4 space-y-4">
          {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}
          {goal.target_date && <p className="text-xs text-muted-foreground">Target: {goal.target_date}</p>}

          {canEdit && (
            <div className="space-y-3 p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[160px]">
                  <Label className="text-xs text-muted-foreground">Progress: {progress}%</Label>
                  <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(parseInt(e.target.value))} className="w-full" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={goal.status} onValueChange={(v) => setStatus(v as Status)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not started</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="achieved">Achieved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Add a progress note..." />
              <Button size="sm" onClick={addUpdate}><Plus className="h-4 w-4 mr-2" />Log update</Button>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-2">Progress timeline</p>
            {updates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No updates logged yet.</p>
            ) : (
              <div className="space-y-2">
                {updates.map(u => (
                  <div key={u.id} className="flex items-start gap-3 text-sm border-l-2 border-primary/30 pl-3">
                    <div className="flex-1">
                      {u.note && <p>{u.note}</p>}
                      <p className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleString()} {u.progress != null && `· ${u.progress}%`}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
