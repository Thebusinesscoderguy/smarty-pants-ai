import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Globe, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Framework {
  id: string;
  code: string;
  name_en: string;
  region: string;
}

const REGION_LABEL: Record<string, string> = {
  gcc: 'GCC / Arab World',
  global: 'International',
  us: 'United States',
  uk: 'United Kingdom',
};

export const FrameworkStep = ({
  schoolId, onPicked,
}: { schoolId: string; onPicked: (frameworkId: string | null) => void }) => {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [schoolId]);

  async function load() {
    setLoading(true);
    const [{ data: all }, { data: settings }] = await Promise.all([
      supabase.from('curriculum_frameworks').select('id,code,name_en,region').eq('is_active', true).eq('launch_visible', true).order('region'),
      supabase.from('school_curriculum_settings').select('framework_id, is_primary').eq('school_id', schoolId),
    ]);
    if (all) setFrameworks(all as any);
    const primary = settings?.find((s: any) => s.is_primary) || settings?.[0];
    if (primary) {
      setSelected(primary.framework_id);
      onPicked(primary.framework_id);
    }
    setLoading(false);
  }

  async function pick(fwId: string) {
    setSaving(true);
    try {
      // Remove primary flag from any existing
      await supabase.from('school_curriculum_settings').delete().eq('school_id', schoolId);
      const { error } = await supabase.from('school_curriculum_settings').insert({
        school_id: schoolId, framework_id: fwId, is_primary: true,
      });
      if (error) throw error;
      setSelected(fwId);
      onPicked(fwId);
      toast({ title: 'Curriculum selected' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const grouped = frameworks.reduce<Record<string, Framework[]>>((acc, f) => {
    (acc[f.region] = acc[f.region] || []).push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-muted/30">
        <div className="flex gap-3 items-start">
          <Globe className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">Pick your primary curriculum framework</p>
            <p className="text-xs text-muted-foreground mt-1">
              This is the default framework used when generating quizzes, study plans, and lesson content.
              You can add more frameworks and customize units later.
            </p>
          </div>
        </div>
      </Card>

      {Object.entries(grouped).map(([region, fws]) => (
        <div key={region}>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">{REGION_LABEL[region] || region}</h4>
          <div className="grid sm:grid-cols-2 gap-2">
            {fws.map(f => {
              const isSel = selected === f.id;
              return (
                <button
                  key={f.id}
                  disabled={saving}
                  onClick={() => pick(f.id)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    isSel ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{f.name_en}</p>
                      <Badge variant="outline" className="text-[10px] mt-1">{f.code}</Badge>
                    </div>
                    {isSel && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
