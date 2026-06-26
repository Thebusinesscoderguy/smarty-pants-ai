import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Pencil, Trash2, FileText, Plus, ArrowLeft, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

type Plan = {
  id: string;
  topic: string;
  subject: string | null;
  grade_level: string | null;
  duration_minutes: number | null;
  content: string;
  created_at: string;
  updated_at: string;
};

const LessonPlansLibrary = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'updated'>('newest');
  const [editing, setEditing] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchPlans();
  }, [user]);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('teacher_lesson_plans')
      .select('*')
      .eq('teacher_id', user!.id)
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: t('lpl.error'), description: error.message, variant: 'destructive' });
    } else {
      setPlans((data || []) as Plan[]);
    }
    setLoading(false);
  };

  const subjects = useMemo(() => {
    const s = new Set<string>();
    plans.forEach((p) => p.subject && s.add(p.subject));
    return Array.from(s).sort();
  }, [plans]);

  const filtered = useMemo(() => {
    let list = plans.filter((p) => {
      const q = search.toLowerCase();
      const matchQ =
        !q ||
        p.topic.toLowerCase().includes(q) ||
        (p.subject || '').toLowerCase().includes(q) ||
        (p.grade_level || '').toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q);
      const matchS = subjectFilter === 'all' || p.subject === subjectFilter;
      return matchQ && matchS;
    });
    list = [...list].sort((a, b) => {
      if (sort === 'oldest') return a.created_at.localeCompare(b.created_at);
      if (sort === 'updated') return b.updated_at.localeCompare(a.updated_at);
      return b.created_at.localeCompare(a.created_at);
    });
    return list;
  }, [plans, search, subjectFilter, sort]);

  const grouped = useMemo(() => {
    const groups: Record<string, Plan[]> = {};
    filtered.forEach((p) => {
      const key = p.subject || t('lpl.uncategorized');
      (groups[key] ||= []).push(p);
    });
    return groups;
  }, [filtered]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('lpl.confirmDelete'))) return;
    const { error } = await supabase.from('teacher_lesson_plans').delete().eq('id', id);
    if (error) {
      toast({ title: t('lpl.error'), description: error.message, variant: 'destructive' });
    } else {
      setPlans((prev) => prev.filter((p) => p.id !== id));
      toast({ title: t('lpl.deleted'), description: t('lpl.deletedDesc') });
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from('teacher_lesson_plans')
      .update({
        topic: editing.topic,
        subject: editing.subject,
        grade_level: editing.grade_level,
        duration_minutes: editing.duration_minutes,
        content: editing.content,
      })
      .eq('id', editing.id);
    setSaving(false);
    if (error) {
      toast({ title: t('lpl.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('lpl.saved'), description: t('lpl.savedDesc') });
      setEditing(null);
      fetchPlans();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                {t('lpl.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {plans.length} {t('lpl.plansSavedSuffix')}
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/school-admin?tab=lesson-plans')}>
            <Plus className="h-4 w-4 mr-1" /> {t('lpl.newPlan')}
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative md:col-span-2">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder={t('lpl.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger><SelectValue placeholder={t('lpl.subject')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('lpl.allSubjects')}</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sort} onValueChange={(v: any) => setSort(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t('lpl.newest')}</SelectItem>
                    <SelectItem value="oldest">{t('lpl.oldest')}</SelectItem>
                    <SelectItem value="updated">{t('lpl.recentlyUpdated')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>{plans.length === 0 ? t('lpl.emptyNone') : t('lpl.emptyFilter')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([subj, items]) => (
              <div key={subj}>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  {subj}
                  <Badge variant="secondary">{items.length}</Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((p) => (
                    <Card key={p.id} className="hover:shadow-md transition-shadow flex flex-col">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base line-clamp-2">{p.topic}</CardTitle>
                        <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                          {p.grade_level && <Badge variant="outline">{p.grade_level}</Badge>}
                          {p.duration_minutes && <Badge variant="outline">{p.duration_minutes} {t('lpl.minSuffix')}</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col">
                        <p className="text-xs text-muted-foreground line-clamp-3 flex-1">
                          {p.content.replace(/[#*`>-]/g, '').slice(0, 180)}...
                        </p>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(p.created_at), 'MMM d, yyyy')}
                          </span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(p.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('lpl.editTitle')}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>{t('lpl.topic')}</Label>
                  <Input value={editing.topic} onChange={(e) => setEditing({ ...editing, topic: e.target.value })} />
                </div>
                <div>
                  <Label>{t('lpl.subjectLabel')}</Label>
                  <Input value={editing.subject || ''} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} />
                </div>
                <div>
                  <Label>{t('lpl.gradeLevel')}</Label>
                  <Input value={editing.grade_level || ''} onChange={(e) => setEditing({ ...editing, grade_level: e.target.value })} />
                </div>
                <div>
                  <Label>{t('lpl.duration')}</Label>
                  <Input type="number" value={editing.duration_minutes || ''} onChange={(e) => setEditing({ ...editing, duration_minutes: parseInt(e.target.value) || null })} />
                </div>
              </div>
              <div>
                <Label>{t('lpl.contentMarkdown')}</Label>
                <Textarea
                  className="min-h-[400px] font-mono text-sm"
                  value={editing.content}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>{t('lpl.cancel')}</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              {t('lpl.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LessonPlansLibrary;
