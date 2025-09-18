import { useState, useCallback, useRef } from 'react';

interface QuestProgressData {
  questTitle: string;
  oldValue: number;
  newValue: number;  
  targetValue: number;
  questType: 'daily' | 'weekly';
  completed?: boolean;
}

export const useQuestProgressNotification = () => {
  const [currentNotification, setCurrentNotification] = useState<QuestProgressData | null>(null);
  const previousQuestValues = useRef<Map<string, number>>(new Map());
  const isShowingRef = useRef(false);
  const lastShownAtRef = useRef<number>(0);

  const showProgressUpdate = useCallback((
    questId: string,
    questTitle: string,
    newValue: number,
    targetValue: number,
    questType: 'daily' | 'weekly'
  ) => {
    const oldValue = previousQuestValues.current.get(questId) || 0;

    // Always update stored value so future comparisons are correct
    if (newValue > oldValue) {
      previousQuestValues.current.set(questId, newValue);
    }

    // Global guard: only one popup at a time, with a brief cooldown
    const now = Date.now();
    if (isShowingRef.current || now - lastShownAtRef.current < 2500) {
      return;
    }

    // Only show notification if value actually increased
    if (newValue > oldValue) {
      const completed = newValue >= targetValue;

      isShowingRef.current = true;
      lastShownAtRef.current = now;

      setCurrentNotification({
        questTitle,
        oldValue,
        newValue,
        targetValue,
        questType,
        completed
      });

      // Auto-release guard after animation window
      window.setTimeout(() => {
        isShowingRef.current = false;
      }, 2200);
    }
  }, []);

  const clearNotification = useCallback(() => {
    setCurrentNotification(null);
  }, []);

  const initializeQuestValues = useCallback((quests: Array<{
    id: string;
    current_value?: number;
  }>) => {
    quests.forEach(quest => {
      if (!previousQuestValues.current.has(quest.id)) {
        previousQuestValues.current.set(quest.id, quest.current_value || 0);
      }
    });
  }, []);

  return {
    currentNotification,
    showProgressUpdate,
    clearNotification,
    initializeQuestValues
  };
};