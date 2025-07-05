
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface StatsOverlayProps {
  totalTokensUsed: number;
  monthlyLimit: number;
  isQuizMode: boolean;
  responseTimes: any[];
}

export const StatsOverlay = ({
  totalTokensUsed,
  monthlyLimit,
  isQuizMode,
  responseTimes
}: StatsOverlayProps) => {
  const usagePercentage = Math.min((totalTokensUsed / monthlyLimit) * 100, 100);
  
  return (
    <div className="absolute bottom-6 right-6 z-20">
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10 min-w-[200px]">
        <div className="text-xs text-white/60 mb-2">Usage</div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/80">Tokens</span>
            <span className="text-white font-medium">{totalTokensUsed}/{monthlyLimit}</span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
          {isQuizMode && (
            <div className="flex justify-between text-xs">
              <span className="text-purple-300">Quiz Mode</span>
              <span className="text-purple-300">{responseTimes.length} responses</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
