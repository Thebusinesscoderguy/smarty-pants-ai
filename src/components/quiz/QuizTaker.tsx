import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Quiz } from '@/hooks/useQuizGenerator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { SpeakButton } from '@/components/voice/SpeakButton';
import { TTSSettingsBar } from '@/components/voice/TTSSettingsBar';


interface QuizTakerProps {
  quiz: Quiz;
  onComplete: (result: { score: number; total: number; saved: boolean }) => void;
}

// Basic evaluator for supported question types (for multiple choice)
function isCorrectAnswerSync(selected: string | null, correct: string | undefined | null, type?: string) {
  if (!correct || selected == null) return false;
  if (type === 'short_answer') {
    // For short answers, do a basic check - semantic check happens async
    return selected.trim().toLowerCase() === String(correct).trim().toLowerCase();
  }
  return String(selected).trim() === String(correct).trim();
}

// Semantic check for open-ended questions using AI
async function checkOpenAnswer(userAnswer: string, correctAnswer: string, question: string): Promise<{ is_correct: boolean; score: number; feedback: string }> {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('check-open-answer', {
      body: { userAnswer, correctAnswer, question }
    });
    
    if (error || !data?.success) {
      console.error('Semantic check failed:', error);
      // Fallback to basic check
      return {
        is_correct: userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase(),
        score: userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase() ? 1 : 0,
        feedback: ''
      };
    }
    
    return {
      is_correct: data.is_correct,
      score: data.score,
      feedback: data.feedback || ''
    };
  } catch (e) {
    console.error('Error in semantic check:', e);
    return {
      is_correct: userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase(),
      score: 0,
      feedback: ''
    };
  }
}

export const QuizTaker = ({ quiz, onComplete }: QuizTakerProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const [ttsVoice, setTtsVoice] = useState('alloy');
  
  const startTimeRef = useRef<number>(Date.now());
  const questionStartRef = useRef<number>(Date.now());
  const perQuestionMsRef = useRef<Record<string, number>>({});

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

      // Auto-grade objective questions (MCQ, true/false, matching) only.
      // Open-ended questions (short_answer / essay) are routed to the teacher review queue.
      const OPEN_ENDED = new Set(['short_answer', 'essay', 'open_ended', 'long_answer']);
      let score = 0;
      let pendingReview = 0;
      const answerPayload = questions.map((q: any, i: number) => {
        const qid = q.id ?? String(i);
        const selected = answers[qid] ?? '';
        const correct = q.correctAnswer ?? q.correct_answer;
        const points = q.points ?? 1;
        const isOpen = OPEN_ENDED.has(q.type);

        let correctBool: boolean | null = false;
        if (isOpen) {
          correctBool = null; // pending teacher review
          if (selected.trim()) pendingReview++;
        } else {
          correctBool = isCorrectAnswerSync(selected, correct, q.type);
          if (correctBool) score += points;
        }

        return {
          id: q.id ?? null,
          index: i,
          question: q.question,
          selected,
          correct,
          is_correct: correctBool,
          needs_review: isOpen,
          points,
          explanation: q.explanation ?? null,
          time_taken_ms: perQuestionMsRef.current[qid] || 0,
          ai_feedback: '',
        };
      });

      const total = totalPoints;
      const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

      // Try to save if user exists, otherwise just finish locally
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        toast({ title: 'Results ready', description: 'Sign in to save your score.' });
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
        toast({ title: t('quizTaker.attemptNotSaved'), description: t('quizTaker.scoreNotSaved') });
        onComplete({ score, total, saved: false });
        return;
      }

      toast({ title: t('quizTaker.quizSaved'), description: t('quizTaker.scoreResult').replace('{score}', score.toString()).replace('{total}', total.toString()) });
      onComplete({ score, total, saved: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (!current) {
    return (
      <Card>
        <CardContent className="py-8 text-center">{t('quizTaker.noQuestions')}</CardContent>
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
    <>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="mb-2 text-sm">{t('quizTaker.progress').replace('{current}', (index + 1).toString()).replace('{total}', questions.length.toString())}</div>
            <Progress value={progress} />
          </div>
          <TTSSettingsBar voice={ttsVoice} onVoiceChange={setTtsVoice} />
        </div>

      <div className="flex items-start gap-2">
        <div className="text-base font-medium flex-1">
          {current.question}
        </div>
        <SpeakButton
          text={`${current.question}. ${options.join('. ')}`}
          voice={ttsVoice}
          size="sm"
          variant="outline"
        />
      </div>

      {qType === 'short_answer' ? (
        <div className="space-y-2">
          <Label htmlFor="short-answer">{t('quizTaker.shortAnswer')}</Label>
          <Input
            id="short-answer"
            value={selected}
            onChange={(e) => handleSelect(qid, e.target.value)}
            placeholder={t('quizTaker.typeAnswer')}
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
        <Button variant="outline" onClick={goPrev} disabled={index === 0}>{t('quizTaker.previous')}</Button>
        {index < questions.length - 1 ? (
          <Button onClick={goNext}>{t('quizTaker.next')}</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? t('quizTaker.submitting') : t('quizTaker.submit')}
          </Button>
        )}
      </div>
      </div>
    </>
  );
};

export default QuizTaker;
