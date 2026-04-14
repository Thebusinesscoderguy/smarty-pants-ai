import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_active_days: number;
  last_active_date: string | null;
}

export const useStreak = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData>({
    current_streak: 0,
    longest_streak: 0,
    total_active_days: 0,
    last_active_date: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchStreak = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('user_streaks')
        .select('current_streak, longest_streak, total_active_days, last_active_date')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setStreak(data);
    } catch (e) {
      console.error('Error fetching streak:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const recordActivity = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc('update_user_streak', { p_user_id: user.id });
      if (error) throw error;
      if (data) {
        setStreak({
          current_streak: data.current_streak,
          longest_streak: data.longest_streak,
          total_active_days: data.total_active_days,
          last_active_date: data.last_active_date,
        });
      }
    } catch (e) {
      console.error('Error recording activity:', e);
    }
  }, [user]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  // Auto-record activity on mount (once per session)
  useEffect(() => {
    if (!user || loading) return;
    const key = `streak_recorded_${new Date().toISOString().split('T')[0]}`;
    if (!sessionStorage.getItem(key)) {
      recordActivity();
      sessionStorage.setItem(key, 'true');
    }
  }, [user, loading, recordActivity]);

  return { streak, loading, recordActivity };
};
