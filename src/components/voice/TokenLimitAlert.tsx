
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface TokenLimitAlertProps {
  isTokenLimitReached: boolean;
  monthlyLimit: number;
}

const TokenLimitAlert = ({ isTokenLimitReached, monthlyLimit }: TokenLimitAlertProps) => {
  if (!isTokenLimitReached) return null;

  return (
    <Alert variant="destructive" className="mb-4 bg-red-900/30 border-red-700">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Token Limit Reached</AlertTitle>
      <AlertDescription>
        You've reached your monthly token limit of {monthlyLimit} tokens. Please try again next month or contact support for an upgraded plan.
      </AlertDescription>
    </Alert>
  );
};

export default TokenLimitAlert;
