import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface SchoolSubject {
  id: string;
  name: string;
  name_ar: string | null;
  created_at: string;
}

export const SubjectManagement = () => {
  const [subjects, setSubjects] = useState<SchoolSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectNameAr, setNewSubjectNameAr] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    fetchSubjects();
  }, [user]);

  const getSchoolId = async () => {
    if (!user) throw new Error('No user');
    const { data } = await supabase
      .from('school_accounts')
      .select('id')
      .eq('admin_user_id', user.id)
      .single();
    if (!data) throw new Error('No school found');
    return data.id;
  };

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      const schoolId = await getSchoolId();
      const { data, error } = await supabase
        .from('school_subjects')
        .select('*')
        .eq('school_id', schoolId)
        .order('name');
      if (error) throw error;
      setSubjects(data || []);
    } catch (error: any) {
      if (error.message !== 'No school found') {
        console.error('Error fetching subjects:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addSubject = async () => {
    if (!newSubjectName.trim()) return;
    try {
      setIsAdding(true);
      const schoolId = await getSchoolId();
      const { error } = await supabase
        .from('school_subjects')
        .insert({ school_id: schoolId, name: newSubjectName.trim(), name_ar: newSubjectNameAr.trim() || null });
      if (error) throw error;
      toast({ title: t('subj.added'), description: `${newSubjectName.trim()} ${t('subj.addedDescSuffix')}` });
      setNewSubjectName('');
      setNewSubjectNameAr('');
      fetchSubjects();
    } catch (error: any) {
      console.error('Error adding subject:', error);
      toast({ title: t('subj.error'), description: t('subj.failedAdd'), variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  // Persist an edited Arabic name (used on the bilingual report card grid).
  const saveArabicName = async (id: string, value: string) => {
    const name_ar = value.trim() || null;
    setSubjects(prev => prev.map(s => (s.id === id ? { ...s, name_ar } : s)));
    const { error } = await supabase.from('school_subjects').update({ name_ar }).eq('id', id);
    if (error) toast({ title: t('subj.error'), variant: 'destructive' });
  };

  const deleteSubject = async (id: string, name: string) => {
    if (!confirm(`${t('subj.confirmDelete1')}"${name}"${t('subj.confirmDelete2')}`)) return;
    try {
      const { error } = await supabase.from('school_subjects').delete().eq('id', id);
      if (error) throw error;
      toast({ title: t('subj.deleted'), description: `${name} ${t('subj.deletedDescSuffix')}` });
      fetchSubjects();
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({ title: t('subj.error'), description: t('subj.failedDelete'), variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">{t('subj.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t('subj.title')}</h2>
        <p className="text-muted-foreground">{t('subj.subtitle')}</p>
      </div>

      {/* Add Subject */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex gap-3 flex-wrap">
            <Input
              placeholder={t('subj.namePlaceholder')}
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubject()}
              className="flex-1 min-w-[180px]"
            />
            <Input
              placeholder={t('subj.namePlaceholderAr')}
              value={newSubjectNameAr}
              onChange={(e) => setNewSubjectNameAr(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubject()}
              dir="rtl"
              className="flex-1 min-w-[180px]"
            />
            <Button onClick={addSubject} disabled={isAdding || !newSubjectName.trim()}>
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {t('subj.add')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subject List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {subjects.map((subject) => (
          <Card key={subject.id} className="bg-card border-border">
            <CardContent className="p-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-foreground block truncate">{subject.name}</span>
                  <Input
                    defaultValue={subject.name_ar || ''}
                    placeholder={t('subj.namePlaceholderAr')}
                    dir="rtl"
                    className="h-7 mt-1 text-sm"
                    onBlur={(e) => { if ((e.target.value.trim() || null) !== (subject.name_ar || null)) saveArabicName(subject.id, e.target.value); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  />
                </div>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => deleteSubject(subject.id, subject.name)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {subjects.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>{t('subj.emptyTitle')}</p>
          </CardContent>
        </Card>
      )}

      {subjects.length > 0 && (
        <p className="text-sm text-muted-foreground">
          <Badge variant="secondary">{subjects.length}</Badge> {t('subj.footerSuffix')}
        </p>
      )}
    </div>
  );
};
