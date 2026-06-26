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
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // NOTE: student names are fetched in a separate query (not a PostgREST embed):
    // homework_submissions.student_id has no FK to profiles, so `profiles:student_id(...)`
    // raises PGRST200. This mirrors the pattern used in StudentManagement / AtRiskAlerts.
    const { data, error: loadError } = await supabase
      .from('homework_submissions')
      .select('id, assignment_id, student_id, ai_score, ai_feedback, ai_confidence, submitted_at, homework_assignments(title)')
      .eq('status', 'ai_graded')
      .order('submitted_at', { ascending: false });

    if (loadError) {
      setError(loadError.message);
      toast({ title: 'Failed to load grading inbox', description: loadError.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as any[];

    // Resolve student names (subject to profiles RLS: teachers see students in their
    // assigned sections; others fall back to a neutral label).
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

  return { items, loading, error, approve, bulkApproveHighConfidence, refresh: load };
};
