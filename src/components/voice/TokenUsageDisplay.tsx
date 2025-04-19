
import React from 'react';

interface TokenUsageDisplayProps {
  totalTokensUsed: number;
  monthlyLimit: number;
  inputTokens: number;
  outputTokens: number;
}

const TokenUsageDisplay = ({ totalTokensUsed, monthlyLimit, inputTokens, outputTokens }: TokenUsageDisplayProps) => {
  return (
    <div className="flex justify-between items-center bg-gray-800/50 rounded-lg p-3">
      <div className="text-sm text-gray-400">
        Monthly Token Usage: {totalTokensUsed} / {monthlyLimit}
        <span className="ml-2 text-gray-500">({inputTokens} input, {outputTokens} output)</span>
      </div>
    </div>
  );
};

export default TokenUsageDisplay;
