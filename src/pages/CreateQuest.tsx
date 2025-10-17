import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuestManagement } from '@/hooks/useQuestManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Subject { id: string; name: string }

export default function CreateQuest() {
  // SEO
  useEffect(() => {
    document.title = 'Create Quest - Student Quests';
    const desc = 'Create a new student quest manually with subject, difficulty, and goals.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);

    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', window.location.origin + '/quests/create');

    const ld = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Create Quest',
      url: window.location.origin + '/quests/create',
      description: desc,
    };
    const existing = document.getElementById('ld-json-create-quest');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.id = 'ld-json-create-quest';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(ld);
    document.head.appendChild(script);
  }, []);

  const navigate = useNavigate();
  const { createQuest } = useQuestManagement();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'daily' as 'daily' | 'weekly',
    difficulty: 'basic' as 'basic' | 'intermediate' | 'hard',
    target_value: '1',
    subject_id: ''
  });

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data } = await supabase.from('subjects').select('id, name').order('name');
        setSubjects(data || []);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, []);

  const onSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast({ title: "Error", description: "Title and description are required", variant: "destructive" });
      return;
    }
    const res = await createQuest({
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      difficulty: form.difficulty,
      target_value: parseInt(form.target_value || '1', 10) || 1,
      subject_id: form.subject_id || undefined,
    });
    if (res) navigate('/quests');
  };

  return (
    <main className="container mx-auto max-w-3xl py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Create Quest</h1>
        <p className="text-muted-foreground">Manually create a new quest for your learners.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Quest Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Complete 5 Math Problems" />
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Practice arithmetic and problem-solving skills" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={form.type} onValueChange={(v: 'daily' | 'weekly') => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={form.difficulty} onValueChange={(v: 'basic' | 'intermediate' | 'hard') => setForm({ ...form, difficulty: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="target">Target Value</Label>
              <Input id="target" inputMode="numeric" value={form.target_value}
                onChange={(e) => { const v = e.target.value; if (v === '' || /^\d+$/.test(v)) setForm({ ...form, target_value: v }); }}
                placeholder="1" />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingSubjects ? 'Loading...' : 'All Subjects'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Subjects</SelectItem>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={onSubmit} disabled={!form.title.trim() || !form.description.trim()}>Create Quest</Button>
            <Button variant="outline" asChild>
              <Link to="/quests">Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
