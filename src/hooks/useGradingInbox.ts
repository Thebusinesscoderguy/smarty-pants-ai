import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Homework grading inbox — MANUAL only. Homework answers are free-text, so per the
// uniform grading rule they are graded by the teacher, never AI. This surfaces
// submitted-but-ungraded homework for hand-grading (score + feedback).
export interface GradingItem {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  assignment_title: string;
  answer_text: string;
  submitted_at: string | null;
}

function answerText(responseData: any): string {
  if (!responseData) return '';
  if (typeof responseData.text === 'string' && responseData.text.trim()) return responseData.text;
  // Fallback: older submissions stored an array of {question, studentAnswer}.
  if (Array.isArray(responseData.responses)) {
    return responseData.responses
      .map((r: any, i: number) => `Q${i + 1}: ${r?.studentAnswer ?? ''}`)
      .join('\n');
  }
  return '';
}

export const useGradingInbox = () => {
  const [items, setItems] = useState<GradingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Submitted-but-ungraded homework awaiting manual teacher grading.
    const { data, error: loadError } = await supabase
      .from('homework_submissions')
      .select('id, assignment_id, student_id, response_data, submitted_at, homework_assignments(title)')
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false });

    if (loadError) {
      setError(loadError.message);
      toast({ title: 'Failed to load grading inbox', description: loadError.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as any[];

    // Resolve student names (subject to profiles RLS).
    const studentIds = [...new Set(rows.map((d) => d.student_id).filter(Boolean))];
    const nameById: Record<string, string> = {};
    if (studentIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', studentIds);
      (profs ?? []).forEach((p: { id: string; display_name: string | null }) => {
        nameById[p.id] = p.display_name || 'Student';
      });
    }

    setItems(rows.map((d) => ({
      id: d.id,
      assignment_id: d.assignment_id,
      student_id: d.student_id,
      student_name: nameById[d.student_id] || 'Student',
      assignment_title: d.homework_assignments?.title || 'Assignment',
      answer_text: answerText(d.response_data),
      submitted_at: d.submitted_at,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Teacher manually awards a score + feedback.
  const grade = useCallback(async (id: string, score: number, feedback: string) => {
    const { error } = await supabase.from('homework_submissions').update({
      score,
      feedback: feedback || null,
      status: 'graded',
    }).eq('id', id);
    if (error) {
      toast({ title: 'Failed to save grade', description: error.message, variant: 'destructive' });
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast({ title: 'Graded' });
  }, []);

  return { items, loading, error, grade, refresh: load };
};
