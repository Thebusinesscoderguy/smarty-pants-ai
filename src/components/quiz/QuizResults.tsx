
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import type { Quiz } from '@/hooks/useQuizGenerator';

interface QuizResultsProps {
  quiz: Quiz;
}

interface AttemptRow {
  id: string;
  score: number;
  total_possible: number;
  answers: Array<{
    id: string | null;
    index: number;
    question: string;
    selected: string;
    correct: string;
    is_correct: boolean;
    points: number;
    explanation?: string | null;
  }>
}

export const QuizResults = ({ quiz }: QuizResultsProps) => {
  const [attempt, setAttempt] = useState<AttemptRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          setError('Please sign in to view your results.');
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('quiz_id', quiz.id)
          .order('completed_at', { ascending: false })
          .limit(1);
        if (error) throw error;
        setAttempt((data as any)?.[0] ?? null);
      } catch (e: any) {
        setError(e.message ?? 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [quiz.id]);

  const percent = useMemo(() => {
    if (!attempt) return 0;
    return Math.round((attempt.score / Math.max(1, attempt.total_possible)) * 100);
  }, [attempt]);

  if (loading) {
    return <div className="py-6 text-sm opacity-80">Loading results...</div>;
  }

  if (error) {
    return <div className="py-6 text-sm text-red-600">{error}</div>;
  }

  if (!attempt) {
    return <div className="py-6 text-sm opacity-80">No attempts yet. Take the quiz to see your results.</div>;
  }

  const answers = attempt.answers || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Latest Result</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge variant="outline">Score</Badge>
            <div className="text-base font-medium">{attempt.score}/{attempt.total_possible} ({percent}%)</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Question Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {answers.map((a, i) => {
              const q = quiz.questions?.[a.index];
              const explanation = a.explanation ?? (q as any)?.explanation ?? null;
              const correctOpt = a.correct;
              const selected = a.selected;
              return (
                <div key={i}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-medium">{a.question}</div>
                    {a.is_correct ? (
                      <Badge className="bg-green-100 text-green-800">Correct</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Incorrect</Badge>
                    )}
                  </div>
                  <div className="mt-2 text-sm opacity-90">
                    <div><span className="font-semibold">Your answer:</span> {String(selected)}</div>
                    {!a.is_correct && (
                      <div><span className="font-semibold">Correct answer:</span> {String(correctOpt)}</div>
                    )}
                    {explanation && (
                      <div className="mt-2"><span className="font-semibold">Explanation:</span> {explanation}</div>
                    )}
                  </div>
                  {i < answers.length - 1 && <Separator className="mt-4" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizResults;
