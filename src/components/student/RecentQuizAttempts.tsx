import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ClipboardCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AttemptRow {
  id: string;
  source: 'quiz' | 'exam';
  title: string;
  score: number;
  total: number;
  pendingReview: number;
  completed_at: string | null;
}

export const RecentQuizAttempts = () => {
  const [rows, setRows] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) { setLoading(false); return; }

      const [quizRes, testRes] = await Promise.all([
        supabase
          .from('quiz_attempts')
          .select('id, score, total_possible, answers, completed_at, quizzes(title)')
          .eq('user_id', u.user.id)
          .order('completed_at', { ascending: false })
          .limit(5),
        supabase
          .from('test_attempts')
          .select('id, score, total_points, answers, completed_at, tests(title)')
          .eq('student_id', u.user.id)
          .order('completed_at', { ascending: false })
          .limit(5),
      ]);

      const countPending = (answers: any) =>
        (Array.isArray(answers) ? answers : []).filter(
          (a: any) => a?.needs_review && a?.teacher_score == null
        ).length;

      const merged: AttemptRow[] = [
        ...((quizRes.data as any[]) ?? []).map((r): AttemptRow => ({
          id: r.id,
          source: 'quiz',
          title: r.quizzes?.title || 'Quiz',
          score: r.score ?? 0,
          total: r.total_possible ?? 0,
          pendingReview: countPending(r.answers),
          completed_at: r.completed_at,
        })),
        ...((testRes.data as any[]) ?? []).map((r): AttemptRow => ({
          id: r.id,
          source: 'exam',
          title: r.tests?.title || 'Exam',
          score: r.score ?? 0,
          total: r.total_points ?? 0,
          pendingReview: countPending(r.answers),
          completed_at: r.completed_at,
        })),
      ]
        .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
        .slice(0, 6);

      setRows(merged);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!rows.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Recent Quiz & Exam Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((r) => {
          const pct = r.total > 0 ? Math.round((r.score * 100) / r.total) : 0;
          return (
            <div key={`${r.source}-${r.id}`} className="flex items-center justify-between gap-2 p-3 rounded-md border bg-card">
              <div className="min-w-0">
                <div className="font-medium truncate">{r.title}</div>
                <div className="text-xs text-muted-foreground capitalize">{r.source}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {r.pendingReview > 0 ? (
                  <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-50 gap-1">
                    <Clock className="h-3 w-3" />
                    Awaiting teacher review ({r.pendingReview})
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-primary/30 text-primary">Graded</Badge>
                )}
                <div className="text-sm font-semibold tabular-nums">
                  {r.score}/{r.total} <span className="text-muted-foreground font-normal">({pct}%)</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
