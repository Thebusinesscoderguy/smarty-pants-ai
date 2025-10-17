import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuestManagement } from '@/hooks/useQuestManagement';
import { useAuth } from '@/contexts/AuthContext';

export default function MadeByMe() {
  // SEO
  useEffect(() => {
    const title = 'Made by Me – Your Quests';
    document.title = title;
    const desc = 'View and manage quests you created. Create new custom quests quickly.';

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
    link.setAttribute('href', window.location.origin + '/quests/made-by-me');

    const ld = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Made by Me – Your Quests',
      url: window.location.origin + '/quests/made-by-me',
      description: desc,
    };
    const existing = document.getElementById('ld-json-made-by-me');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.id = 'ld-json-made-by-me';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(ld);
    document.head.appendChild(script);
  }, []);

  const { user } = useAuth();
  const { quests, loading, fetchQuests } = useQuestManagement();

  useEffect(() => { fetchQuests(); }, []);

  return (
    <main className="container mx-auto max-w-5xl py-8">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Made by Me</h1>
          <p className="text-muted-foreground">{user ? 'Quests you created' : 'Demo: sample quests shown (sign in to save).'} </p>
        </div>
        <Button asChild>
          <Link to="/quests/create">Create Quest</Link>
        </Button>
      </header>

      <section aria-label="Your quests" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!loading && quests.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="py-10 text-center">
              <p className="mb-4">You have not created any quests yet.</p>
              <Button asChild>
                <Link to="/quests/create">Create your first quest</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {quests.map((q) => (
          <Card key={q.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <CardTitle className="text-lg leading-tight">{q.title}</CardTitle>
              <Badge variant="secondary" className="shrink-0">{q.difficulty}</Badge>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{q.description}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{q.type}</Badge>
                {typeof q.target_value === 'number' && (
                  <Badge variant="outline">Target: {q.target_value}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
