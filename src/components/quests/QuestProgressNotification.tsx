import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface QuestProgressData {
  questTitle: string;
  oldValue: number;
  newValue: number;
  targetValue: number;
  questType: 'daily' | 'weekly';
  completed?: boolean;
}

interface QuestProgressNotificationProps {
  progressUpdate: QuestProgressData | null;
  onComplete: () => void;
}

export const QuestProgressNotification: React.FC<QuestProgressNotificationProps> = ({
  progressUpdate,
  onComplete
}) => {
  const [currentValue, setCurrentValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (progressUpdate) {
      setCurrentValue(progressUpdate.oldValue);
      setIsAnimating(true);
      
      // Animate the counter
      const timer = setTimeout(() => {
        setCurrentValue(progressUpdate.newValue);
        
        // Hide notification after animation
        const hideTimer = setTimeout(() => {
          setIsAnimating(false);
          onComplete();
        }, 2000);

        return () => clearTimeout(hideTimer);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [progressUpdate, onComplete]);

  if (!progressUpdate || !isAnimating) return null;

  const progress = (currentValue / progressUpdate.targetValue) * 100;
  const isCompleted = currentValue >= progressUpdate.targetValue;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -50 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Card className={`p-4 min-w-[300px] ${
          isCompleted 
            ? 'bg-gradient-to-r from-green-500/90 to-emerald-500/90' 
            : 'bg-gradient-to-r from-blue-500/90 to-purple-500/90'
        } backdrop-blur-sm border-white/20 text-white shadow-2xl`}>
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: isCompleted ? 360 : 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {isCompleted ? (
                <Trophy className="h-8 w-8 text-yellow-300" />
              ) : (
                <Target className="h-8 w-8 text-white" />
              )}
            </motion.div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm">
                  {progressUpdate.questType === 'daily' ? '📅' : '🗓️'} {progressUpdate.questTitle}
                </h3>
                {isCompleted && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full font-bold"
                  >
                    COMPLETED!
                  </motion.span>
                )}
              </div>
              
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Progress</span>
                <motion.span
                  key={currentValue}
                  initial={{ scale: 1.2, color: '#fbbf24' }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  transition={{ duration: 0.3 }}
                  className="font-mono font-bold"
                >
                  {currentValue}/{progressUpdate.targetValue}
                </motion.span>
              </div>
              
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    isCompleted 
                      ? 'bg-gradient-to-r from-yellow-300 to-yellow-400' 
                      : 'bg-gradient-to-r from-white to-blue-200'
                  }`}
                  initial={{ width: `${(progressUpdate.oldValue / progressUpdate.targetValue) * 100}%` }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
          
          {isCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-2 text-center text-sm font-medium"
            >
              🎉 Quest Complete! Well done!
            </motion.div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};