import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  current_streak: number;
  longest_streak: number;
  total_active_days: number;
  quest_xp: number;
  quiz_xp: number;
  total_xp: number;
}

export const useLeaderboard = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('student_leaderboard')
          .select('*')
          .order('total_xp', { ascending: false })
          .limit(50);

        if (error) throw error;
        setEntries((data as LeaderboardEntry[]) || []);

        if (user && data) {
          const idx = data.findIndex((e: any) => e.user_id === user.id);
          setUserRank(idx >= 0 ? idx + 1 : null);
        }
      } catch (e) {
        console.error('Error fetching leaderboard:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user]);

  return { entries, loading, userRank };
};
