
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useQuizGenerator, type Quiz } from '@/hooks/useQuizGenerator';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Lightbulb, Loader2, RotateCcw, Sparkles, Target } from 'lucide-react';
import { ShareArtifactButton } from '@/components/share/ShareArtifactButton';

interface QuizResultsProps {
  quiz: Quiz;
  onStartQuiz?: (quiz: Quiz) => void;
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

export const QuizResults = ({ quiz, onStartQuiz }: QuizResultsProps) => {
  const { generateQuiz, saveQuiz } = useQuizGenerator();
  const [attempt, setAttempt] = useState<AttemptRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingPractice, setCreatingPractice] = useState<'mistakes' | 'similar' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);

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
  const missedAnswers = answers.filter((answer) => !answer.is_correct);

  const startMistakesQuiz = async () => {
    if (!missedAnswers.length) {
      toast({ title: 'No mistakes found', description: 'You got every question correct on your latest attempt.' });
      return;
    }

    setCreatingPractice('mistakes');
    try {
      const mistakesQuiz: Quiz = {
        title: `${quiz.title} – Mistakes Only`,
        description: 'Retake only the questions missed in your latest attempt.',
        difficulty: quiz.difficulty,
        subject_id: quiz.subject_id,
        questions: missedAnswers.map((answer, index) => {
          const original = quiz.questions?.[answer.index];
          return {
            ...original,
            id: undefined,
            question: original?.question || answer.question,
            type: original?.type || 'multiple_choice',
            options: original?.options,
            correct_answer: original?.correct_answer || answer.correct,
            explanation: original?.explanation || answer.explanation || undefined,
            points: original?.points || answer.points || 1,
            order_index: index,
          };
        }),
      };
      const savedId = await saveQuiz(mistakesQuiz);
      if (savedId) onStartQuiz?.({ ...mistakesQuiz, id: savedId });
    } finally {
      setCreatingPractice(null);
    }
  };

  const startSimilarQuiz = async () => {
    setCreatingPractice('similar');
    try {
      const source = quiz.questions
        .map((q, index) => `${index + 1}. ${q.question}\nAnswer: ${q.correct_answer}`)
        .join('\n\n');
      const similarQuiz = await generateQuiz(
        `Create a new quiz similar to "${quiz.title}". Match the same learning objectives, difficulty, and question count, but use new wording, contexts, values, and answers. Do not repeat the original questions exactly. Original quiz:\n\n${source}`,
        quiz.difficulty,
        quiz.questions.length
      );
      if (!similarQuiz) return;
      const quizToSave = { ...similarQuiz, title: `${quiz.title} – Similar Quiz`, subject_id: quiz.subject_id };
      const savedId = await saveQuiz(quizToSave);
      if (savedId) onStartQuiz?.({ ...quizToSave, id: savedId });
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
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline">Score</Badge>
              <div className="text-base font-medium">{attempt.score}/{attempt.total_possible} ({percent}%)</div>
            </div>
            {onStartQuiz && quiz.id && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => onStartQuiz(quiz)} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Retake quiz
                </Button>
                <Button variant="outline" onClick={startMistakesQuiz} disabled={creatingPractice !== null || missedAnswers.length === 0} className="gap-2">
                  {creatingPractice === 'mistakes' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                  Retake mistakes only
                </Button>
                <Button variant="outline" onClick={startSimilarQuiz} disabled={creatingPractice !== null} className="gap-2">
                  {creatingPractice === 'similar' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Retake similar quiz
                </Button>
              </div>
            )}
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
