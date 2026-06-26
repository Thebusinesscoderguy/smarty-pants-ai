import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, ThumbsUp, ThumbsDown, Plus, FileDown, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Category { id: string; name: string; valence: 'positive' | 'negative'; default_points: number; }
interface Student { id: string; name: string; }
interface Incident {
  id: string; student_id: string; category_id: string | null; valence: 'positive' | 'negative';
  description: string | null; points: number; incident_date: string; created_at: string;
}

export const BehaviorManagement = () => {
  const { user, isSchoolAdmin } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [ready, setReady] = useState(false);

  // Quick-log form
  const [logStudent, setLogStudent] = useState('');
  const [logCategory, setLogCategory] = useState('');
  const [logNote, setLogNote] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

  // Profile view
  const [profileStudent, setProfileStudent] = useState('');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // New category (admin)
  const [catName, setCatName] = useState('');
  const [catValence, setCatValence] = useState<'positive' | 'negative'>('positive');
  const [catPoints, setCatPoints] = useState('1');

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      let sid: string | null = null;
      const { data: school } = await supabase.from('school_accounts').select('id').eq('admin_user_id', user.id).maybeSingle();
      sid = school?.id ?? null;
      if (!sid) {
        const { data: teacher } = await supabase.from('school_teachers').select('school_id')
          .ilike('email', user.email || '').eq('is_active', true).maybeSingle();
        sid = teacher?.school_id ?? null;
      }
      setSchoolId(sid);
      if (sid) {
        const [cats, rels] = await Promise.all([
          supabase.from('behavior_categories').select('*').eq('school_id', sid).order('name'),
          supabase.from('school_student_relationships').select('student_id').eq('school_id', sid).eq('is_active', true),
        ]);
        setCategories((cats.data as Category[]) || []);
        const ids = (rels.data || []).map(r => r.student_id);
        if (ids.length) {
          const { data: profs } = await supabase.from('profiles').select('id, display_name').in('id', ids);
          setStudents((profs || []).map(p => ({ id: p.id, name: p.display_name || 'Unknown' }))
            .sort((a, b) => a.name.localeCompare(b.name)));
        }
      }
      setReady(true);
    };
    init();
  }, [user]);

  const loadIncidents = useCallback(async () => {
    if (!profileStudent) { setIncidents([]); return; }
    let q = supabase.from('behavior_incidents').select('*').eq('student_id', profileStudent)
      .order('incident_date', { ascending: false });
    if (fromDate) q = q.gte('incident_date', fromDate);
    if (toDate) q = q.lte('incident_date', toDate);
    const { data } = await q;
    setIncidents((data as Incident[]) || []);
  }, [profileStudent, fromDate, toDate]);

  useEffect(() => { loadIncidents(); }, [loadIncidents]);

  const logIncident = async () => {
    if (!user || !schoolId || !logStudent || !logCategory) return;
    const cat = categories.find(c => c.id === logCategory);
    if (!cat) return;
    const { error } = await supabase.from('behavior_incidents').insert({
      school_id: schoolId, student_id: logStudent, category_id: cat.id,
      valence: cat.valence, points: cat.default_points, description: logNote.trim() || null,
      incident_date: logDate, recorded_by: user.id,
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Logged', description: 'Behavior incident recorded.' });
    setLogNote('');
    if (profileStudent === logStudent) loadIncidents();
  };

  const addCategory = async () => {
    if (!schoolId || !catName.trim()) return;
    const { data, error } = await supabase.from('behavior_categories').insert({
      school_id: schoolId, name: catName.trim(), valence: catValence, default_points: parseInt(catPoints) || 0,
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setCategories(prev => [...prev, data as Category].sort((a, b) => a.name.localeCompare(b.name)));
    setCatName('');
  };

  const deleteIncident = async (id: string) => {
    const { error } = await supabase.from('behavior_incidents').delete().eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setIncidents(prev => prev.filter(i => i.id !== id));
  };

  const totalPoints = incidents.reduce((sum, i) => sum + (i.valence === 'positive' ? i.points : -i.points), 0);
  const catName_ = (id: string | null) => categories.find(c => c.id === id)?.name || '—';

  const exportPdf = () => {
    const student = students.find(s => s.id === profileStudent);
    if (!student) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Behavior Incident Report', 14, 18);
    doc.setFontSize(11);
    doc.text(`Student: ${student.name}`, 14, 28);
    doc.text(`Net points: ${totalPoints}`, 14, 35);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 42);
    autoTable(doc, {
      startY: 48,
      head: [['Date', 'Type', 'Category', 'Points', 'Note']],
      body: incidents.map(i => [
        i.incident_date, i.valence, catName_(i.category_id),
        (i.valence === 'positive' ? '+' : '-') + i.points, i.description || '',
      ]),
    });
    doc.save(`behavior-${student.name.replace(/\s+/g, '_')}.pdf`);
  };

  if (!ready) return <div className="animate-pulse text-muted-foreground">Loading...</div>;
  if (!schoolId) return <Card><CardContent className="p-8 text-center text-muted-foreground">No school found for your account.</CardContent></Card>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold text-foreground">Behavior Management</h2>
          <p className="text-sm text-muted-foreground">Log positive and negative incidents and generate per-student reports</p>
        </div>
      </div>

      <Tabs defaultValue="log">
        <TabsList>
          <TabsTrigger value="log">Quick Log</TabsTrigger>
          <TabsTrigger value="profile">Student Profile</TabsTrigger>
          {isSchoolAdmin && <TabsTrigger value="categories">Categories</TabsTrigger>}
        </TabsList>

        <TabsContent value="log" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Log an incident</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Student</Label>
                  <Select value={logStudent} onValueChange={setLogStudent}>
                    <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <Select value={logCategory} onValueChange={setLogCategory}>
                    <SelectTrigger><SelectValue placeholder={categories.length ? 'Select category' : 'No categories yet'} /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.valence === 'positive' ? '👍' : '👎'} {c.name} ({c.valence === 'positive' ? '+' : '-'}{c.default_points})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <Input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Note (optional)</Label>
                <Textarea value={logNote} onChange={e => setLogNote(e.target.value)} rows={2} placeholder="What happened?" />
              </div>
              <Button onClick={logIncident} disabled={!logStudent || !logCategory}>
                <Plus className="h-4 w-4 mr-2" />Log Incident
              </Button>
              {!categories.length && (
                <p className="text-xs text-muted-foreground">No categories exist yet. {isSchoolAdmin ? 'Add some in the Categories tab.' : 'Ask an admin to create behavior categories.'}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="mt-4 space-y-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="min-w-[200px]">
              <Label className="text-xs text-muted-foreground">Student</Label>
              <Select value={profileStudent} onValueChange={setProfileStudent}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            {profileStudent && (
              <Button variant="outline" onClick={exportPdf} disabled={!incidents.length}>
                <FileDown className="h-4 w-4 mr-2" />Export PDF
              </Button>
            )}
          </div>

          {profileStudent && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">History</CardTitle>
                <Badge variant={totalPoints >= 0 ? 'default' : 'destructive'}>Net points: {totalPoints}</Badge>
              </CardHeader>
              <CardContent>
                {incidents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No incidents recorded for this range.</p>
                ) : (
                  <div className="space-y-2">
                    {incidents.map(i => (
                      <div key={i.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                        {i.valence === 'positive'
                          ? <ThumbsUp className="h-4 w-4 text-green-500 mt-0.5" />
                          : <ThumbsDown className="h-4 w-4 text-destructive mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{catName_(i.category_id)}</span>
                            <Badge variant="outline" className="text-[10px]">{i.valence === 'positive' ? '+' : '-'}{i.points}</Badge>
                            <span className="text-xs text-muted-foreground">{i.incident_date}</span>
                          </div>
                          {i.description && <p className="text-sm text-muted-foreground mt-0.5">{i.description}</p>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteIncident(i.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {isSchoolAdmin && (
          <TabsContent value="categories" className="mt-4 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Add category</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap items-end gap-3">
                <div><Label className="text-xs text-muted-foreground">Name</Label><Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Helped a peer" /></div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select value={catValence} onValueChange={(v) => setCatValence(v as 'positive' | 'negative')}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs text-muted-foreground">Points</Label><Input type="number" min="0" className="w-24" value={catPoints} onChange={e => setCatPoints(e.target.value)} /></div>
                <Button onClick={addCategory} disabled={!catName.trim()}><Plus className="h-4 w-4 mr-2" />Add</Button>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categories.map(c => (
                <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg border border-border">
                  {c.valence === 'positive' ? <ThumbsUp className="h-4 w-4 text-green-500" /> : <ThumbsDown className="h-4 w-4 text-destructive" />}
                  <span className="text-sm font-medium">{c.name}</span>
                  <Badge variant="outline" className="text-[10px] ml-auto">{c.valence === 'positive' ? '+' : '-'}{c.default_points}</Badge>
                </div>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
