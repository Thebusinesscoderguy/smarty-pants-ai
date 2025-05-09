
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { AlertCircle } from 'lucide-react';

interface TokenUsageDisplayProps {
  totalTokensUsed: number;
  monthlyLimit: number;
  inputTokens: number;
  outputTokens: number;
}

const TokenUsageDisplay = ({ totalTokensUsed, monthlyLimit, inputTokens, outputTokens }: TokenUsageDisplayProps) => {
  const usagePercentage = Math.min((totalTokensUsed / monthlyLimit) * 100, 100);
  const isApproachingLimit = usagePercentage >= 80;
  const isAtLimit = usagePercentage >= 100;
  
  // Determine the color class based on usage percentage
  const indicatorColorClass = isAtLimit 
    ? "bg-red-500" 
    : isApproachingLimit 
      ? "bg-yellow-500" 
      : "bg-blue-500";
  
  return (
    <div className="flex flex-col w-full bg-gray-800/50 rounded-lg p-3">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-gray-400">
          Monthly Token Usage: <span className="font-semibold">{totalTokensUsed}</span> / {monthlyLimit}
          <span className="ml-2 text-gray-500">({inputTokens} input, {outputTokens} output)</span>
        </div>
        
        {isAtLimit && (
          <div className="flex items-center text-red-400">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium">Limit reached</span>
          </div>
        )}
        
        {isApproachingLimit && !isAtLimit && (
          <div className="text-xs text-yellow-400">
            Approaching limit
          </div>
        )}
      </div>
      
      <div className="relative h-2 w-full bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full transition-all ${indicatorColorClass}`}
          style={{ width: `${usagePercentage}%` }}
        />
      </div>
    </div>
  );
};

export default TokenUsageDisplay;
