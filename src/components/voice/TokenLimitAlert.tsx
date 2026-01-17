
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TokenLimitAlertProps {
  isTokenLimitReached: boolean;
  monthlyLimit: number;
}

const TokenLimitAlert = ({ isTokenLimitReached, monthlyLimit }: TokenLimitAlertProps) => {
  const { t } = useLanguage();
  
  if (!isTokenLimitReached) return null;

  return (
    <Alert variant="destructive" className="mb-4 bg-red-900/30 border-red-700">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{t('error.tokenLimitReached')}</AlertTitle>
      <AlertDescription>
        {t('error.tokenLimitDesc').replace('{limit}', monthlyLimit.toLocaleString())}
      </AlertDescription>
    </Alert>
  );
};

export default TokenLimitAlert;
