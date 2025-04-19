
import { useEffect } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OpenAIKeyForm = () => {
  useEffect(() => {
    // Set your OpenAI API key directly
    localStorage.setItem('openai_api_key', 'sk-YOUR_API_KEY_HERE');
  }, []);

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="mb-4 bg-green-900/20 border-green-500/30 text-green-400 hover:bg-green-900/30"
    >
      <Check className="h-4 w-4 mr-2" />
      OpenAI API Key Set
    </Button>
  );
};

export default OpenAIKeyForm;
