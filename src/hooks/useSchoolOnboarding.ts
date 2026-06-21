import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SchoolOnboardingProgress {
  id: string;
  school_id: string;
  current_step: number;
  completed_steps: string[];
  framework_chosen: boolean;
  students_imported: number;
  teachers_invited: number;
  gradebook_status: string;
  completed_at: string | null;
}

export const STEP_KEYS = ['welcome', 'roster', 'teachers', 'gradebook', 'curriculum', 'live'] as const;
export type StepKey = typeof STEP_KEYS[number];

export const useSchoolOnboarding = () => {
  const { user } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string>('');
  const [progress, setProgress] = useState<SchoolOnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data: school } = await supabase
      .from('school_accounts')
      .select('id, school_name')
      .eq('admin_user_id', user.id)
      .maybeSingle();

    if (!school) { setLoading(false); return; }
    setSchoolId(school.id);
    setSchoolName(school.school_name);

    const { data: existing } = await supabase
      .from('school_onboarding_progress' as any)
      .select('*')
      .eq('school_id', school.id)
      .maybeSingle();

    if (existing) {
      setProgress(existing as any);
    } else {
      const { data: created } = await supabase
        .from('school_onboarding_progress' as any)
        .insert({ school_id: school.id })
        .select()
        .single();
      if (created) setProgress(created as any);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const updateProgress = useCallback(async (updates: Partial<SchoolOnboardingProgress>) => {
    if (!schoolId) return;
    const { data } = await supabase
      .from('school_onboarding_progress' as any)
      .update(updates)
      .eq('school_id', schoolId)
      .select()
      .single();
    if (data) setProgress(data as any);
    return data;
  }, [schoolId]);

  const markStepComplete = useCallback(async (step: StepKey, extras: Partial<SchoolOnboardingProgress> = {}) => {
    if (!progress) return;
    const completed = Array.from(new Set([...(progress.completed_steps || []), step]));
    const nextIdx = STEP_KEYS.indexOf(step) + 1;
    await updateProgress({
      completed_steps: completed,
      current_step: Math.max(progress.current_step, nextIdx),
      ...extras,
    });
  }, [progress, updateProgress]);

  const goToStep = useCallback(async (idx: number) => {
    await updateProgress({ current_step: idx });
  }, [updateProgress]);

  const finish = useCallback(async () => {
    await updateProgress({ completed_at: new Date().toISOString() });
  }, [updateProgress]);

  return {
    schoolId, schoolName, progress, loading,
    updateProgress, markStepComplete, goToStep, finish, reload: load,
  };
};
