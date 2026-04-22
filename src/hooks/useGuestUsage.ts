import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'guest_usage';

type FeatureType = 'quiz' | 'study_plan' | 'presentation';

interface GuestUsage {
  quiz: number;
  study_plan: number;
  presentation: number;
}

function getUsage(): GuestUsage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { quiz: 0, study_plan: 0, presentation: 0 };
}

function setUsage(usage: GuestUsage) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

export function useGuestUsage() {
  const { user } = useAuth();

  const canGenerate = useCallback((feature: FeatureType): boolean => {
    if (user) return true; // logged-in users have no limit
    const usage = getUsage();
    return usage[feature] < 1;
  }, [user]);

  const recordUsage = useCallback((feature: FeatureType) => {
    if (user) return; // don't track for logged-in users
    const usage = getUsage();
    usage[feature] += 1;
    setUsage(usage);
  }, [user]);

  const isGuest = !user;

  return { canGenerate, recordUsage, isGuest };
}
