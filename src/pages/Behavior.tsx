import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BehaviorCard } from '@/components/family/BehaviorCard';
import { EmptyHint } from '@/components/family/EmptyHint';
import { Shield, Loader2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';

interface Child {
  id: string;
  name: string;
}

/**
 * Behavior — read-only, parent-facing.
 *
 * Lists behavior incidents for the signed-in parent's own children only.
 * Children come from `parent_child_relationships` (RLS scopes to this parent's
 * own links) and each child's incidents are rendered via the shared
 * BehaviorCard, whose `behavior_incidents` query is itself RLS-scoped. A parent
 * can never see another student's records.
 */
const BehaviorPage = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data: rels } = await supabase
        .from('parent_child_relationships')
        .select('child_id')
        .eq('parent_id', user.id);

      const childIds = (rels || []).map((r) => r.child_id).filter(Boolean);
      if (childIds.length === 0) {
        if (!cancelled) { setChildren([]); setLoading(false); }
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', childIds);

      const list: Child[] = (profiles || []).map((p) => ({
        id: p.id,
        name: p.display_name || t('fh.studentFallback'),
      }));
      list.sort((a, b) => a.name.localeCompare(b.name));

      if (!cancelled) { setChildren(list); setLoading(false); }
    })();

    return () => { cancelled = true; };
  }, [user]);

  if (!user) return <Navigate to="/auth" replace />;

  const labels = {
    title: isRTL ? 'السلوك' : 'Behavior',
    subtitle: isRTL ? 'تقارير سلوك أبنائك' : "Your children's behavior reports",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <SEO
        title="Behavior — Teachly.AI"
        description="Read-only behavior reports for your own children."
        path="/behavior"
      />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{labels.title}</h1>
            <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" /> {t('fh.loadingShort')}
          </div>
        ) : children.length === 0 ? (
          <EmptyHint icon={Users} text={t('fh.noChildrenTitle')} />
        ) : (
          <div className="space-y-6">
            {children.map((child) => (
              <section key={child.id}>
                <h2 className="text-lg font-semibold mb-3">{child.name}</h2>
                <BehaviorCard studentId={child.id} />
              </section>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BehaviorPage;
