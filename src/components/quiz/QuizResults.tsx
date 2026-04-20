
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import type { Quiz, QuizQuestion } from '@/hooks/useQuizGenerator';
import { useQuizGenerator } from '@/hooks/useQuizGenerator';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Lightbulb, Loader2, RotateCcw, Target, Sparkles } from 'lucide-react';
import { ShareArtifactButton } from '@/components/share/ShareArtifactButton';

interface QuizResultsProps {
  quiz: Quiz;
  onRetakeReady?: (quiz: Quiz) => void;
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

const ELI5Button = ({ text }: { text: string }) => {
  const [simplified, setSimplified] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (simplified) { setSimplified(null); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('eli5-explain', { body: { text } });
      if (error) throw error;
      setSimplified(data?.text || text);
    } catch { setSimplified(null); } finally { setLoading(false); }
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={handleClick} disabled={loading} className="gap-1">
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3" />}
        {simplified ? 'Original' : 'ELI5'}
      </Button>
      {simplified && <div className="text-sm bg-accent/20 p-2 rounded mt-1">{simplified}</div>}
    </>
  );
};

export const QuizResults = ({ quiz, onRetakeReady }: QuizResultsProps) => {
  const [attempt, setAttempt] = useState<AttemptRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const [creatingPractice, setCreatingPractice] = useState<null | 'retake' | 'mistakes' | 'similar'>(null);
  const { generateQuiz, saveQuiz } = useQuizGenerator();

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
  const wrongAnswers = answers.filter((a: any) => a && a.is_correct === false);

  const handleRetakeSame = async () => {
    setCreatingPractice('retake');
    try {
      const savedId = await saveQuiz({ ...quiz, title: `${quiz.title} (Retake)` });
      if (savedId) toast({ title: 'Saved', description: 'Retake quiz saved to your Library.' });
    } catch (e: any) {
      toast({ title: 'Failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setCreatingPractice(null);
    }
  };

  const handleRetakeMistakes = async () => {
    if (wrongAnswers.length === 0) {
      toast({ title: 'No mistakes', description: 'You got everything correct!' });
      return;
    }
    setCreatingPractice('mistakes');
    try {
      const wrongQs: QuizQuestion[] = wrongAnswers.map((ans: any, i: number) => {
        const base = (quiz.questions || []).find((q: any) => q.id === ans.id) || quiz.questions[ans.index] || {} as any;
        return {
          id: base.id,
          question: base.question || ans.question,
          type: (base as any).type || 'multiple_choice',
          options: base.options,
          correct_answer: base.correct_answer || String(ans.correct ?? ''),
          explanation: base.explanation || ans.explanation,
          points: base.points ?? 1,
          order_index: i,
        } as QuizQuestion;
      });
      const newQuiz: Quiz = {
        title: `${quiz.title} – Mistakes Only`,
        description: 'Practice only the questions you missed.',
        difficulty: quiz.difficulty,
        questions: wrongQs,
      };
      const savedId = await saveQuiz(newQuiz);
      if (savedId) toast({ title: 'Saved', description: 'Mistakes-only quiz saved to your Library.' });
    } catch (e: any) {
      toast({ title: 'Failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setCreatingPractice(null);
    }
  };

  const handleRetakeSimilar = async () => {
    setCreatingPractice('similar');
    try {
      const target = Math.max(quiz.questions.length, 5);
      const similar = await generateQuiz(quiz.title, quiz.difficulty as any, target);
      if (!similar) return;
      const savedId = await saveQuiz({ ...similar, title: `${quiz.title} (Similar)` });
      if (savedId) toast({ title: 'Saved', description: 'Similar quiz saved to your Library.' });
    } catch (e: any) {
      toast({ title: 'Failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setCreatingPractice(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-lg">Latest Result</CardTitle>
            <ShareArtifactButton
              artifactType="quiz"
              title={quiz.title}
              content={{ questions: quiz.questions, description: quiz.description }}
              sourceId={quiz.id}
              label="Share quiz"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline">Score</Badge>
            <div className="text-base font-medium">{attempt.score}/{attempt.total_possible} ({percent}%)</div>
          </div>

          <div className="pt-2 border-t">
            <div className="text-sm font-medium mb-2">Practice again</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Button onClick={handleRetakeSame} disabled={creatingPractice !== null}>
                {creatingPractice === 'retake' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                Retake Quiz
              </Button>
              <Button variant="outline" onClick={handleRetakeMistakes} disabled={creatingPractice !== null || wrongAnswers.length === 0}>
                {creatingPractice === 'mistakes' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}
                Retake Mistakes Only
              </Button>
              <Button variant="outline" onClick={handleRetakeSimilar} disabled={creatingPractice !== null}>
                {creatingPractice === 'similar' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Retake Similar Quiz
              </Button>
            </div>
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
              const baseExplanation = (a.explanation ?? (q as any)?.explanation ?? null) as string | null;
              const explanation = overrides[i] ?? baseExplanation;
              const correctOpt = a.correct;
              const selected = a.selected;
              const timeMs = (a as any)?.time_taken_ms as number | undefined;

              const handleExplain = async (mode: 'summary' | 'detail') => {
                if (!baseExplanation) return;
                try {
                  setLoadingIdx(i);
                  const { data, error } = await supabase.functions.invoke('explain-text', {
                    body: { text: baseExplanation, mode }
                  });
                  if (error) throw error;
                  const newText = (data as any)?.text ?? (data as any)?.generatedText ?? null;
                  if (newText) {
                    setOverrides((prev) => ({ ...prev, [i]: newText }));
                  }
                } catch (e: any) {
                  console.error(e);
                  toast({ title: 'Failed to generate', description: e.message ?? 'Please try again.' });
                } finally {
                  setLoadingIdx(null);
                }
              };

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
                  <div className="mt-2 text-sm opacity-90 space-y-1">
                    <div><span className="font-semibold">Your answer:</span> {String(selected)}</div>
                    {!a.is_correct && (
                      <div><span className="font-semibold">Correct answer:</span> {String(correctOpt)}</div>
                    )}
                    {typeof timeMs === 'number' && timeMs > 0 && (
                      <div><span className="font-semibold">Time spent:</span> {Math.round(timeMs / 1000)}s</div>
                    )}
                    {explanation && (
                      <div className="mt-2 space-y-2">
                        <div><span className="font-semibold">Explanation:</span> {explanation}</div>
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" disabled={loadingIdx === i} onClick={() => handleExplain('summary')}>
                            {loadingIdx === i ? 'Loading…' : 'Summarise'}
                          </Button>
                          <Button size="sm" variant="outline" disabled={loadingIdx === i} onClick={() => handleExplain('detail')}>
                            {loadingIdx === i ? 'Loading…' : 'More detail'}
                          </Button>
                          <ELI5Button text={explanation} />
                        </div>
                      </div>
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
