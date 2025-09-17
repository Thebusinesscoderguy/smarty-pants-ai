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

  const showProgressUpdate = useCallback((
    questId: string,
    questTitle: string,
    newValue: number,
    targetValue: number,
    questType: 'daily' | 'weekly'
  ) => {
    const oldValue = previousQuestValues.current.get(questId) || 0;
    
    // Only show notification if value actually increased
    if (newValue > oldValue) {
      const completed = newValue >= targetValue;
      
      setCurrentNotification({
        questTitle,
        oldValue,
        newValue,
        targetValue,
        questType,
        completed
      });
      
      // Update stored value
      previousQuestValues.current.set(questId, newValue);
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