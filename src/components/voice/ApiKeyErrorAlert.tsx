
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ApiKeyErrorAlertProps {
  visible: boolean;
}

const ApiKeyErrorAlert = ({ visible }: ApiKeyErrorAlertProps) => {
  if (!visible) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>OpenAI API Key Error</AlertTitle>
      <AlertDescription>
        The OpenAI API key is not configured on the server. Please contact the administrator to set up the OpenAI API key in Supabase secrets.
      </AlertDescription>
    </Alert>
  );
};

export default ApiKeyErrorAlert;
