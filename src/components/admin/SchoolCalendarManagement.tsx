import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Plus, Trash2, Pencil, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SchoolCalendarView } from '@/components/calendar/SchoolCalendarView';

interface Category { id: string; name: string; color: string; }
interface Entry { id: string; category_id: string | null; title: string; start_date: string; end_date: string; description: string | null; }

export const SchoolCalendarManagement = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);

  // Entry form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  // New category form
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#3b82f6');

  const loadData = useCallback(async (sid: string) => {
    const [{ data: cats }, { data: ents }] = await Promise.all([
      supabase.from('school_calendar_categories').select('*').eq('school_id', sid).order('name'),
      supabase.from('school_calendar_entries').select('*').eq('school_id', sid).order('start_date', { ascending: false }),
    ]);
    setCategories((cats as Category[]) || []);
    setEntries((ents as Entry[]) || []);
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: school } = await supabase.from('school_accounts').select('id').eq('admin_user_id', user.id).maybeSingle();
      setSchoolId(school?.id ?? null);
      if (school?.id) await loadData(school.id);
      setReady(true);
    })();
  }, [user, loadData]);

  const resetForm = () => { setEditingId(null); setTitle(''); setCategoryId(''); setDescription(''); };
  const bump = () => setVersion(v => v + 1);

  const saveEntry = async () => {
    if (!schoolId || !title.trim() || !categoryId) return;
    if (endDate < startDate) { toast({ title: t('calendar.invalidDates'), description: t('calendar.invalidDatesDesc'), variant: 'destructive' }); return; }
    const payload = { school_id: schoolId, category_id: categoryId, title: title.trim(), start_date: startDate, end_date: endDate, description: description.trim() || null };
    const { error } = editingId
      ? await supabase.from('school_calendar_entries').update(payload).eq('id', editingId)
      : await supabase.from('school_calendar_entries').insert(payload);
    if (error) { toast({ title: t('calendar.error'), description: error.message, variant: 'destructive' }); return; }
    toast({ title: editingId ? t('calendar.entryUpdated') : t('calendar.entryPosted') });
    resetForm(); loadData(schoolId); bump();
  };

  const editEntry = (e: Entry) => {
    setEditingId(e.id); setTitle(e.title); setCategoryId(e.category_id || '');
    setStartDate(e.start_date); setEndDate(e.end_date); setDescription(e.description || '');
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from('school_calendar_entries').delete().eq('id', id);
    if (error) { toast({ title: t('calendar.error'), description: error.message, variant: 'destructive' }); return; }
    if (schoolId) loadData(schoolId); bump();
  };

  const addCategory = async () => {
    if (!schoolId || !catName.trim()) return;
    const { error } = await supabase.from('school_calendar_categories').insert({ school_id: schoolId, name: catName.trim(), color: catColor });
    if (error) { toast({ title: t('calendar.error'), description: error.message, variant: 'destructive' }); return; }
    setCatName(''); setCatColor('#3b82f6'); loadData(schoolId); bump();
  };

  const updateCategoryColor = async (id: string, color: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, color } : c));
    await supabase.from('school_calendar_categories').update({ color }).eq('id', id);
    bump();
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('school_calendar_categories').delete().eq('id', id);
    if (error) { toast({ title: t('calendar.error'), description: error.message, variant: 'destructive' }); return; }
    if (schoolId) loadData(schoolId); bump();
  };

  if (!ready) return <div className="animate-pulse text-muted-foreground">{t('calendar.loading')}</div>;
  if (!schoolId) return <Card><CardContent className="p-8 text-center text-muted-foreground">{t('calendar.noSchool')}</CardContent></Card>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('calendar.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('calendar.subtitle')}</p>
        </div>
      </div>

      <Tabs defaultValue="manage">
        <TabsList>
          <TabsTrigger value="manage">{t('calendar.tabEntries')}</TabsTrigger>
          <TabsTrigger value="categories">{t('calendar.tabCategories')}</TabsTrigger>
          <TabsTrigger value="preview">{t('calendar.tabPreview')}</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{editingId ? t('calendar.editEntry') : t('calendar.postEntryCard')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">{t('calendar.titleLabel')}</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={t('calendar.titlePlaceholder')} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t('calendar.category')}</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger><SelectValue placeholder={categories.length ? t('calendar.selectCategory') : t('calendar.addCategoryFirst')} /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded" style={{ backgroundColor: c.color }} />{c.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t('calendar.startDate')}</Label>
                  <Input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); if (endDate < e.target.value) setEndDate(e.target.value); }} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t('calendar.endDate')}</Label>
                  <Input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t('calendar.descriptionOptional')}</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveEntry} disabled={!title.trim() || !categoryId}>
                  <Plus className="h-4 w-4 mr-2" />{editingId ? t('calendar.saveChanges') : t('calendar.postEntry')}
                </Button>
                {editingId && <Button variant="ghost" onClick={resetForm}><X className="h-4 w-4 mr-1" />{t('calendar.cancel')}</Button>}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {entries.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">{t('calendar.noEntries')}</CardContent></Card>
            ) : entries.map(e => {
              const cat = categories.find(c => c.id === e.category_id);
              return (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <span className="h-3 w-3 rounded shrink-0" style={{ backgroundColor: cat?.color || '#64748b' }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.start_date}{e.end_date !== e.start_date ? ` → ${e.end_date}` : ''}{cat ? ` · ${cat.name}` : ''}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editEntry(e)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteEntry(e.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{t('calendar.addCategory')}</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <div><Label className="text-xs text-muted-foreground">{t('calendar.name')}</Label><Input value={catName} onChange={e => setCatName(e.target.value)} placeholder={t('calendar.namePlaceholder')} /></div>
              <div><Label className="text-xs text-muted-foreground">{t('calendar.color')}</Label><Input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} className="w-16 h-10 p-1" /></div>
              <Button onClick={addCategory} disabled={!catName.trim()}><Plus className="h-4 w-4 mr-2" />{t('calendar.add')}</Button>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categories.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                <Input type="color" value={c.color} onChange={e => updateCategoryColor(c.id, e.target.value)} className="w-12 h-8 p-1 shrink-0" />
                <span className="text-sm font-medium flex-1 truncate">{c.name}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCategory(c.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <SchoolCalendarView schoolId={schoolId} version={version} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
