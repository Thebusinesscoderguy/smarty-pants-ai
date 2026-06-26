import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardCheck, Plus, X, Check, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Criterion { label: string; scale: number; }
interface Template { id: string; name: string; criteria: Criterion[]; }
interface Teacher { id: string; name: string; }
interface Observation {
  id: string; teacher_id: string; template_id: string | null; section_id: string | null;
  responses: Record<string, number>; notes: string | null; status: 'draft' | 'submitted' | 'acknowledged';
  observed_at: string; acknowledged_at: string | null;
}

export const ClassroomObservation = () => {
  const { user, isSchoolAdmin } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [myTeacherId, setMyTeacherId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [ready, setReady] = useState(false);

  // New observation form (admin)
  const [obsTeacher, setObsTeacher] = useState('');
  const [obsTemplate, setObsTemplate] = useState('');
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [obsNotes, setObsNotes] = useState('');

  // New template form (admin)
  const [tplName, setTplName] = useState('');
  const [tplCriteria, setTplCriteria] = useState<Criterion[]>([{ label: '', scale: 5 }]);

  const loadObservations = useCallback(async (sid: string) => {
    // RLS scopes this: admins see all school observations, teachers see only their own.
    const { data } = await supabase.from('observations').select('*')
      .eq('school_id', sid).order('observed_at', { ascending: false });
    setObservations((data as unknown as Observation[]) || []);
  }, []);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      let sid: string | null = null;
      const { data: school } = await supabase.from('school_accounts').select('id').eq('admin_user_id', user.id).maybeSingle();
      sid = school?.id ?? null;
      const { data: teacher } = await supabase.from('school_teachers').select('id, school_id')
        .ilike('email', user.email || '').eq('is_active', true).maybeSingle();
      if (teacher) { setMyTeacherId(teacher.id); if (!sid) sid = teacher.school_id; }
      setSchoolId(sid);
      if (sid) {
        const [tpls, tchrs] = await Promise.all([
          supabase.from('observation_templates').select('*').eq('school_id', sid).order('name'),
          supabase.from('school_teachers').select('id, first_name, last_name, email').eq('school_id', sid).eq('is_active', true),
        ]);
        setTemplates((tpls.data as unknown as Template[]) || []);
        setTeachers((tchrs.data || []).map(t => ({
          id: t.id, name: `${t.first_name || ''} ${t.last_name || ''}`.trim() || t.email,
        })));
        await loadObservations(sid);
      }
      setReady(true);
    };
    init();
  }, [user, loadObservations]);

  const selectedTemplate = templates.find(t => t.id === obsTemplate);

  const submitObservation = async () => {
    if (!user || !schoolId || !obsTeacher || !obsTemplate) return;
    const { error } = await supabase.from('observations').insert({
      school_id: schoolId, observer_id: user.id, teacher_id: obsTeacher, template_id: obsTemplate,
      responses, notes: obsNotes.trim() || null, status: 'submitted',
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Submitted', description: 'Observation shared with the teacher.' });
    setObsTeacher(''); setObsTemplate(''); setResponses({}); setObsNotes('');
    loadObservations(schoolId);
  };

  const addTemplate = async () => {
    if (!schoolId || !tplName.trim()) return;
    const criteria = tplCriteria.filter(c => c.label.trim());
    const { data, error } = await supabase.from('observation_templates').insert({
      school_id: schoolId, name: tplName.trim(), criteria: criteria as unknown as never,
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setTemplates(prev => [...prev, data as unknown as Template]);
    setTplName(''); setTplCriteria([{ label: '', scale: 5 }]);
  };

  const acknowledge = async (id: string) => {
    const { error } = await supabase.from('observations')
      .update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Acknowledged' });
    if (schoolId) loadObservations(schoolId);
  };

  const teacherName = (id: string) => teachers.find(t => t.id === id)?.name || 'Teacher';
  const templateName = (id: string | null) => templates.find(t => t.id === id)?.name || '—';

  if (!ready) return <div className="animate-pulse text-muted-foreground">Loading...</div>;
  if (!schoolId) return <Card><CardContent className="p-8 text-center text-muted-foreground">No school found for your account.</CardContent></Card>;

  // ---------- Teacher view: received observations ----------
  if (!isSchoolAdmin) {
    const mine = observations.filter(o => o.teacher_id === myTeacherId);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-foreground">My Observations</h2>
            <p className="text-sm text-muted-foreground">Feedback from your school leaders</p>
          </div>
        </div>
        {mine.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No observations yet.</CardContent></Card>
        ) : mine.map(o => (
          <ObservationCard key={o.id} obs={o} templates={templates} templateName={templateName}
            footer={o.status === 'acknowledged'
              ? <Badge variant="secondary"><Check className="h-3 w-3 mr-1" />Acknowledged</Badge>
              : <Button size="sm" onClick={() => acknowledge(o.id)}><Check className="h-4 w-4 mr-2" />Acknowledge</Button>} />
        ))}
      </div>
    );
  }

  // ---------- Leader (admin) view ----------
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Classroom Observation</h2>
          <p className="text-sm text-muted-foreground">Observe teachers against a template and share feedback</p>
        </div>
      </div>

      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="new">New / Conducted</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">New observation</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Teacher</Label>
                  <Select value={obsTeacher} onValueChange={setObsTeacher}>
                    <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                    <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Template</Label>
                  <Select value={obsTemplate} onValueChange={(v) => { setObsTemplate(v); setResponses({}); }}>
                    <SelectTrigger><SelectValue placeholder={templates.length ? 'Select template' : 'No templates yet'} /></SelectTrigger>
                    <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {selectedTemplate?.criteria.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 p-2 rounded-lg border border-border">
                  <span className="text-sm">{c.label}</span>
                  <Select value={responses[c.label]?.toString() || ''} onValueChange={(v) => setResponses(prev => ({ ...prev, [c.label]: parseInt(v) }))}>
                    <SelectTrigger className="w-24"><SelectValue placeholder="Rate" /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: c.scale }, (_, i) => i + 1).map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}

              <div>
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <Textarea value={obsNotes} onChange={e => setObsNotes(e.target.value)} rows={3} placeholder="Overall feedback..." />
              </div>
              <Button onClick={submitObservation} disabled={!obsTeacher || !obsTemplate}>
                <Send className="h-4 w-4 mr-2" />Submit Observation
              </Button>
            </CardContent>
          </Card>

          <h3 className="font-semibold text-foreground">Conducted observations</h3>
          {observations.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">None yet.</CardContent></Card>
          ) : observations.map(o => (
            <ObservationCard key={o.id} obs={o} templates={templates} templateName={templateName}
              header={`${teacherName(o.teacher_id)} · ${templateName(o.template_id)}`}
              footer={<Badge variant={o.status === 'acknowledged' ? 'secondary' : 'outline'}>{o.status}</Badge>} />
          ))}
        </TabsContent>

        <TabsContent value="templates" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">New template</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Template name</Label>
                <Input value={tplName} onChange={e => setTplName(e.target.value)} placeholder="e.g. Lesson Delivery Rubric" />
              </div>
              <Label className="text-xs text-muted-foreground">Criteria</Label>
              {tplCriteria.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input value={c.label} placeholder="Criterion label"
                    onChange={e => setTplCriteria(prev => prev.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))} />
                  <Select value={c.scale.toString()} onValueChange={(v) => setTplCriteria(prev => prev.map((x, i) => i === idx ? { ...x, scale: parseInt(v) } : x))}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>{[3, 4, 5, 10].map(n => <SelectItem key={n} value={n.toString()}>1–{n}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => setTplCriteria(prev => prev.filter((_, i) => i !== idx))}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setTplCriteria(prev => [...prev, { label: '', scale: 5 }])}>
                <Plus className="h-4 w-4 mr-1" />Add criterion
              </Button>
              <div>
                <Button onClick={addTemplate} disabled={!tplName.trim()}><Plus className="h-4 w-4 mr-2" />Save template</Button>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {templates.map(t => (
              <div key={t.id} className="p-3 rounded-lg border border-border">
                <p className="font-medium text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.criteria.length} criteria</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ObservationCard = ({ obs, templates, templateName, header, footer }: {
  obs: Observation; templates: Template[]; templateName: (id: string | null) => string;
  header?: string; footer: React.ReactNode;
}) => {
  const tpl = templates.find(t => t.id === obs.template_id);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{header || templateName(obs.template_id)}</CardTitle>
        <span className="text-xs text-muted-foreground">{new Date(obs.observed_at).toLocaleDateString()}</span>
      </CardHeader>
      <CardContent className="space-y-2">
        {tpl?.criteria.map((c, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{c.label}</span>
            <Badge variant="outline">{obs.responses?.[c.label] ?? '—'} / {c.scale}</Badge>
          </div>
        ))}
        {obs.notes && <p className="text-sm border-t border-border pt-2 mt-2 whitespace-pre-wrap">{obs.notes}</p>}
        <div className="pt-2">{footer}</div>
      </CardContent>
    </Card>
  );
};
