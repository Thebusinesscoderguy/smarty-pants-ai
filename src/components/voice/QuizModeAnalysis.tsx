
import React from 'react';
import { Alert } from '@/components/ui/alert';

interface QuizModeAnalysisProps {
  isQuizMode: boolean;
  hasResponseData: boolean;
  userStrengths: string[];
  userWeaknesses: string[];
  getFastResponseTopics: () => string;
  getSlowResponseTopics: () => string;
}

const QuizModeAnalysis = ({
  isQuizMode,
  hasResponseData,
  userStrengths,
  userWeaknesses,
  getFastResponseTopics,
  getSlowResponseTopics
}: QuizModeAnalysisProps) => {
  if (!isQuizMode || !hasResponseData) return null;

  return (
    <Alert className="mb-4 bg-blue-900/30 border-blue-700">
      <div>
        <h3 className="font-medium">Learning Analysis:</h3>
        <div className="text-sm mt-1">
          <div><span className="font-semibold">Strengths:</span> {userStrengths.length > 0 ? userStrengths.join(', ') : 'Not enough data yet'}</div>
          <div><span className="font-semibold">Areas to improve:</span> {userWeaknesses.length > 0 ? userWeaknesses.join(', ') : 'Not enough data yet'}</div>
          <div><span className="font-semibold">Quick responses:</span> {getFastResponseTopics()}</div>
          <div><span className="font-semibold">Slower responses:</span> {getSlowResponseTopics()}</div>
        </div>
      </div>
    </Alert>
  );
};

export default QuizModeAnalysis;
