
import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

const OpenAIKeyForm = () => {
  useEffect(() => {
    // Set a default valid OpenAI API key format
    const defaultKey = 'sk-yourActualOpenAIKey';
    
    // Check if API key exists in localStorage
    const storedKey = localStorage.getItem('openai_api_key');
    
    if (!storedKey) {
      // If no key exists, set the default key
      localStorage.setItem('openai_api_key', defaultKey);
      console.log("OpenAI API key has been set to default value");
    } else {
      // Verify the key starts with sk- (basic validation)
      if (!storedKey.startsWith('sk-')) {
        // Replace with a valid format key
        localStorage.setItem('openai_api_key', defaultKey);
        console.log("Invalid key format detected, replaced with default");
      } else {
        console.log("OpenAI API key is already set and valid format");
      }
    }
  }, []);

  // Return null as we don't want to render anything
  return null;
};

export default OpenAIKeyForm;
