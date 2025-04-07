
import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

const OpenAIKeyForm = () => {
  useEffect(() => {
    // Check if API key exists in localStorage
    const storedKey = localStorage.getItem('openai_api_key');
    
    if (storedKey) {
      // Key already exists, no need to do anything
      console.log("OpenAI API key is already set");
    } else {
      // If no key exists, display a message
      toast({
        title: "OpenAI API Key Required",
        description: "Please contact the administrator to set up the OpenAI API key.",
        variant: "destructive",
      });
    }
  }, []);

  // Return null as we don't want to render anything
  return null;
};

export default OpenAIKeyForm;
