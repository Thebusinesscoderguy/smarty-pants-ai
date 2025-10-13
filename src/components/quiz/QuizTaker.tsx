
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Quiz } from '@/hooks/useQuizGenerator';
import { useQuestEvents } from '@/hooks/useQuestEvents';

interface QuizTakerProps {
  quiz: Quiz;
  onComplete: (result: { score: number; total: number; saved: boolean }) => void;
}

// Basic evaluator for supported question types
function isCorrectAnswer(selected: string | null, correct: string | undefined | null, type?: string) {
  if (!correct || selected == null) return false;
  if (type === 'short_answer') {
    return selected.trim().toLowerCase() === String(correct).trim().toLowerCase();
  }
  return String(selected).trim() === String(correct).trim();
}

export const QuizTaker = ({ quiz, onComplete }: QuizTakerProps) => {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
const startTimeRef = useRef<number>(Date.now());
  const questionStartRef = useRef<number>(Date.now());
  const perQuestionMsRef = useRef<Record<string, number>>({});
  const { logQuestEvent } = useQuestEvents();

  const questions = quiz.questions || [];
  const totalPoints = useMemo(
    () => questions.reduce((acc: number, q: any) => acc + (q.points ?? 1), 0),
    [questions]
  );

  const current = questions[index];

  const handleSelect = (qid: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const commitTimeForCurrent = () => {
    const now = Date.now();
    const delta = now - questionStartRef.current;
    const qid = current?.id ?? String(index);
    if (qid != null) {
      perQuestionMsRef.current[qid] = (perQuestionMsRef.current[qid] || 0) + Math.max(0, delta);
    }
    questionStartRef.current = now;
  };

  const goNext = () => {
    if (index < questions.length - 1) {
      commitTimeForCurrent();
      setIndex((i) => i + 1);
    }
  };
  const goPrev = () => {
    if (index > 0) {
      commitTimeForCurrent();
      setIndex((i) => i - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Commit time for current question
      commitTimeForCurrent();
      // Score
      let score = 0;
      const answerPayload = questions.map((q: any, i: number) => {
        const qid = q.id ?? String(i);
        const selected = answers[qid] ?? '';
        const correct = q.correctAnswer ?? q.correct_answer;
        const correctBool = isCorrectAnswer(selected, correct, q.type);
        if (correctBool) score += q.points ?? 1;
        return {
          id: q.id ?? null,
          index: i,
          question: q.question,
          selected,
          correct,
          is_correct: correctBool,
          points: q.points ?? 1,
          explanation: q.explanation ?? null,
          time_taken_ms: perQuestionMsRef.current[qid] || 0,
        };
      });

      const total = totalPoints;
      const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

      // Try saving attempt if user authenticated
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        toast({
          title: 'Result calculated',
          description: `You scored ${score}/${total}. Log in to save your result.`,
        });
        onComplete({ score, total, saved: false });
        return;
      }

      const { error } = await supabase.from('quiz_attempts').insert({
        quiz_id: quiz.id,
        user_id: userData.user.id,
        score,
        total_possible: total,
        time_taken: durationSec,
        answers: answerPayload,
        completed_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Failed to save attempt:', error);
        toast({ title: 'Attempt not saved', description: 'Your score was not saved. Please try again.' });
        onComplete({ score, total, saved: false });
        return;
      }

      // Log quest event for AI classification
      await logQuestEvent({
        source: 'quiz',
        event_type: 'quiz_completed',
        subject_id: quiz.subject_id,
        score: (score / total) * 100,
        payload: {
          quiz_id: quiz.id,
          quiz_title: quiz.title,
          score,
          total_possible: total,
          time_taken: durationSec,
          percentage: Math.round((score / total) * 100)
        }
      });

      toast({ title: 'Quiz saved', description: `Score: ${score}/${total}` });
      onComplete({ score, total, saved: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (!current) {
    return (
      <Card>
        <CardContent className="py-8 text-center">No questions in this quiz.</CardContent>
      </Card>
    );
  }

  const qid = current.id ?? String(index);
  const selected = answers[qid] ?? '';
  const qType = current.type ?? 'multiple_choice';
  const options: string[] = Array.isArray(current.options)
    ? current.options
    : typeof current.options === 'object' && current.options
    ? Object.values(current.options)
    : [];

  const progress = Math.round(((index + 1) / questions.length) * 100);

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-sm">Question {index + 1} of {questions.length}</div>
        <Progress value={progress} />
      </div>

      <div className="text-base font-medium">
        {current.question}
      </div>

      {qType === 'short_answer' ? (
        <div className="space-y-2">
          <Label htmlFor="short-answer">Your Answer</Label>
          <Input
            id="short-answer"
            value={selected}
            onChange={(e) => handleSelect(qid, e.target.value)}
            placeholder="Type your answer"
          />
        </div>
      ) : (
        <RadioGroup value={selected} onValueChange={(v) => handleSelect(qid, v)} className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <RadioGroupItem id={`opt-${i}`} value={String(opt)} />
              <Label htmlFor={`opt-${i}`}>{String(opt)}</Label>
            </div>
          ))}
        </RadioGroup>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={goPrev} disabled={index === 0}>Previous</Button>
        {index < questions.length - 1 ? (
          <Button onClick={goNext}>Next</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuizTaker;
