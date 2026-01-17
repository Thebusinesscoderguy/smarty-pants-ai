
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ApiKeyErrorAlertProps {
  visible: boolean;
}

const ApiKeyErrorAlert = ({ visible }: ApiKeyErrorAlertProps) => {
  const { t } = useLanguage();
  
  if (!visible) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{t('error.apiKeyError')}</AlertTitle>
      <AlertDescription>
        {t('error.apiKeyNotConfigured')}
      </AlertDescription>
    </Alert>
  );
};

export default ApiKeyErrorAlert;
