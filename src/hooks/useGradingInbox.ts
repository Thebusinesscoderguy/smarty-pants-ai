import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface GradingItem {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  assignment_title: string;
  ai_score: number | null;
  ai_feedback: string | null;
  ai_confidence: number | null;
  submitted_at: string | null;
}

export const useGradingInbox = () => {
  const [items, setItems] = useState<GradingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('homework_submissions')
      .select('id, assignment_id, student_id, ai_score, ai_feedback, ai_confidence, submitted_at, homework_assignments(title), profiles:student_id(display_name)')
      .eq('status', 'ai_graded')
      .order('submitted_at', { ascending: false });

    if (error) {
      toast({ title: 'Failed to load grading inbox', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    setItems(((data ?? []) as any[]).map((d) => ({
      id: d.id,
      assignment_id: d.assignment_id,
      student_id: d.student_id,
      student_name: d.profiles?.display_name || 'Student',
      assignment_title: d.homework_assignments?.title || 'Assignment',
      ai_score: d.ai_score,
      ai_feedback: d.ai_feedback,
      ai_confidence: d.ai_confidence,
      submitted_at: d.submitted_at,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = useCallback(async (id: string, overrideScore?: number, overrideFeedback?: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const { error } = await supabase.from('homework_submissions').update({
      score: overrideScore ?? item.ai_score,
      feedback: overrideFeedback ?? item.ai_feedback,
      status: 'graded',
    }).eq('id', id);
    if (error) {
      toast({ title: 'Failed to approve', description: error.message, variant: 'destructive' });
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast({ title: 'Approved' });
  }, [items]);

  const bulkApproveHighConfidence = useCallback(async () => {
    const high = items.filter((i) => (i.ai_confidence ?? 0) >= 0.8);
    if (!high.length) {
      toast({ title: 'No high-confidence items to approve' });
      return;
    }
    for (const it of high) {
      await supabase.from('homework_submissions').update({
        score: it.ai_score, feedback: it.ai_feedback, status: 'graded',
      }).eq('id', it.id);
    }
    setItems((prev) => prev.filter((i) => (i.ai_confidence ?? 0) < 0.8));
    toast({ title: `Approved ${high.length} submissions` });
  }, [items]);

  return { items, loading, approve, bulkApproveHighConfidence, refresh: load };
};
