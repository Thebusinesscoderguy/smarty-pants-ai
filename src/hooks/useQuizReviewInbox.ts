import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface QuizReviewItem {
  attempt_id: string;
  source: 'quiz' | 'test';
  quiz_title: string;
  student_id: string;
  student_name: string;
  question_index: number;
  question: string;
  student_answer: string;
  reference_answer: string;
  points: number;
}

interface RawAnswer {
  id?: string | null;
  index?: number;
  question?: string;
  selected?: string;
  correct?: string;
  is_correct?: boolean | null;
  needs_review?: boolean;
  points?: number;
  teacher_score?: number;
  teacher_feedback?: string;
}

export const useQuizReviewInbox = () => {
  const [items, setItems] = useState<QuizReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all: QuizReviewItem[] = [];

    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('id, user_id, answers, quizzes(title), profiles:user_id(display_name)')
      .order('completed_at', { ascending: false })
      .limit(200);

    for (const a of (attempts ?? []) as any[]) {
      const ans: RawAnswer[] = Array.isArray(a.answers) ? a.answers : [];
      ans.forEach((r, i) => {
        if (r?.needs_review && r.teacher_score == null) {
          all.push({
            attempt_id: a.id,
            source: 'quiz',
            quiz_title: a.quizzes?.title || 'Quiz',
            student_id: a.user_id,
            student_name: a.profiles?.display_name || 'Student',
            question_index: r.index ?? i,
            question: r.question || '',
            student_answer: r.selected || '',
            reference_answer: r.correct || '',
            points: r.points ?? 1,
          });
        }
      });
    }

    const { data: tAttempts } = await supabase
      .from('test_attempts')
      .select('id, student_id, answers, tests(title), profiles:student_id(display_name)')
      .order('completed_at', { ascending: false })
      .limit(200);

    for (const a of (tAttempts ?? []) as any[]) {
      const ans: RawAnswer[] = Array.isArray(a.answers) ? a.answers : [];
      ans.forEach((r, i) => {
        if (r?.needs_review && r.teacher_score == null) {
          all.push({
            attempt_id: a.id,
            source: 'test',
            quiz_title: a.tests?.title || 'Exam',
            student_id: a.student_id,
            student_name: a.profiles?.display_name || 'Student',
            question_index: r.index ?? i,
            question: r.question || '',
            student_answer: r.selected || '',
            reference_answer: r.correct || '',
            points: r.points ?? 1,
          });
        }
      });
    }

    setItems(all);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const grade = useCallback(async (item: QuizReviewItem, awarded: number, feedback: string) => {
    const table = item.source === 'quiz' ? 'quiz_attempts' : 'test_attempts';
    const { data: row, error: fetchErr } = await supabase
      .from(table)
      .select('answers, score, total_possible, total_points')
      .eq('id', item.attempt_id)
      .maybeSingle();
    if (fetchErr || !row) {
      toast({ title: 'Failed to load attempt', variant: 'destructive' });
      return;
    }
    const answers: RawAnswer[] = Array.isArray((row as any).answers) ? (row as any).answers : [];
    const updated = answers.map((r, i) => {
      const idx = r.index ?? i;
      if (idx === item.question_index) {
        return {
          ...r,
          is_correct: awarded >= item.points,
          teacher_score: awarded,
          teacher_feedback: feedback,
          needs_review: false,
        };
      }
      return r;
    });
    const newScore = (row as any).score + awarded;
    const totalKey = item.source === 'quiz' ? 'total_possible' : 'total_points';
    const total = (row as any)[totalKey] ?? 0;
    const update: any = { answers: updated, score: newScore };
    if (item.source === 'test' && total > 0) update.percentage = Math.round((newScore * 100) / total);
    const { error } = await supabase.from(table).update(update).eq('id', item.attempt_id);
    if (error) {
      toast({ title: 'Failed to save grade', description: error.message, variant: 'destructive' });
      return;
    }
    setItems((prev) => prev.filter((x) => !(x.attempt_id === item.attempt_id && x.question_index === item.question_index)));
    toast({ title: 'Graded' });
  }, []);

  return { items, loading, grade, refresh: load };
};
