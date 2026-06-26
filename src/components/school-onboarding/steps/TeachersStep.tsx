import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GraduationCap, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface Row { first_name: string; last_name: string; email: string; }

export const TeachersStep = ({
  schoolId, onInvited,
}: { schoolId: string; onInvited: (count: number) => void }) => {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Row[]>([{ first_name: '', last_name: '', email: '' }]);
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<number>(0);

  useEffect(() => { loadExisting(); }, [schoolId]);

  async function loadExisting() {
    const { count } = await supabase
      .from('school_teachers').select('id', { count: 'exact', head: true }).eq('school_id', schoolId);
    if (count !== null) setExisting(count);
  }

  const addRow = () => setRows(p => [...p, { first_name: '', last_name: '', email: '' }]);
  const removeRow = (i: number) => setRows(p => p.filter((_, idx) => idx !== i));
  const updateRow = (i: number, key: keyof Row, val: string) =>
    setRows(p => p.map((r, idx) => idx === i ? { ...r, [key]: val } : r));

  const validRows = rows.filter(r => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email.trim()));

  const invite = async () => {
    if (validRows.length === 0) {
      toast({ title: t('ts2.addAtLeastOne'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    let success = 0, failed = 0;
    for (const r of validRows) {
      try {
        const { error } = await supabase.from('school_teachers').insert({
          school_id: schoolId,
          email: r.email.trim().toLowerCase(),
          first_name: r.first_name.trim() || null,
          last_name: r.last_name.trim() || null,
        });
        if (error && !error.message.includes('unique')) throw error;
        if (!error) success++;
      } catch { failed++; }
    }
    setSaving(false);
    toast({ title: t('ts2.teachersAdded'), description: `${success} ${t('ts2.added')}${failed ? `, ${failed} ${t('ts2.failed')}` : ''}` });
    setRows([{ first_name: '', last_name: '', email: '' }]);
    await loadExisting();
    onInvited(existing + success);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/30">
        <div className="flex items-start gap-3">
          <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">{t('ts2.inviteTeachers')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('ts2.inviteDesc')}
            </p>
            {existing > 0 && (
              <Badge variant="outline" className="mt-2">{existing} {existing === 1 ? t('ts2.teacherWord') : t('ts2.teachersWord')} {t('ts2.alreadyAdded')}</Badge>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_2fr_auto] gap-2 items-center">
            <Input placeholder={t('ts2.firstName')} value={r.first_name} onChange={(e) => updateRow(i, 'first_name', e.target.value)} />
            <Input placeholder={t('ts2.lastName')} value={r.last_name} onChange={(e) => updateRow(i, 'last_name', e.target.value)} />
            <Input type="email" placeholder={t('ts2.emailPlaceholder')} value={r.email} onChange={(e) => updateRow(i, 'email', e.target.value)} />
            <Button variant="ghost" size="icon" onClick={() => removeRow(i)} disabled={rows.length === 1}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-4 w-4 mr-2" />{t('ts2.addAnother')}
        </Button>
        <Button onClick={invite} disabled={saving || validRows.length === 0}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {t('ts2.addBtn')} {validRows.length || ''} {validRows.length === 1 ? t('ts2.teacherWord') : t('ts2.teachersWord')}
        </Button>
      </div>
    </div>
  );
};
