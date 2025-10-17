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
    <main className="container mx-auto max-w-3xl py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Made by Me</h1>
        <p className="text-muted-foreground">View and manage quests you've created.</p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Quests</CardTitle>
          <Button asChild>
            <Link to="/quests/create">Create Quest</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <p className="text-center text-muted-foreground py-8">Loading quests...</p>
          )}

          {!loading && quests.length === 0 && (
            <div className="text-center py-10">
              <p className="mb-4 text-muted-foreground">You haven't created any quests yet.</p>
              <Button asChild>
                <Link to="/quests/create">Create your first quest</Link>
              </Button>
            </div>
          )}

          {!loading && quests.length > 0 && (
            <div className="space-y-3">
              {quests.map((q) => (
                <div key={q.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg">{q.title}</h3>
                    <Badge variant="secondary" className="shrink-0">{q.difficulty}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{q.description}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant="outline">{q.type}</Badge>
                    {typeof q.target_value === 'number' && (
                      <Badge variant="outline">Target: {q.target_value}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
