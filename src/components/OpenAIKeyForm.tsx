
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Check, AlertCircle } from 'lucide-react';

const OpenAIKeyForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');
  
  // Default OpenAI API key - replace with your actual key
  const defaultApiKey = 'sk-yourActualOpenAIKeyGoesHere';
  
  useEffect(() => {
    // Store the default API key in local storage on component mount
    if (!localStorage.getItem('openai_api_key')) {
      localStorage.setItem('openai_api_key', defaultApiKey);
      toast({
        title: "API Key Set",
        description: "Default OpenAI API key has been set automatically.",
      });
    }
  }, []);

  const testAPIKey = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const storedKey = localStorage.getItem('openai_api_key');
      if (!storedKey) {
        throw new Error('No API key found. Please refresh the page.');
      }
      
      // Test the API key with a simple text-to-speech request
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${storedKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: 'This is a test of the OpenAI API key.',
          voice: 'alloy',
          response_format: 'mp3',
        }),
      });
      
      if (response.ok) {
        setTestResult('success');
        setTestMessage('API key is valid! Text-to-speech is working correctly.');
        
        // Create audio and play it to confirm it works
        const arrayBuffer = await response.arrayBuffer();
        const audioBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
        const audioURL = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioURL);
        audio.play();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API responded with status ${response.status}`);
      }
    } catch (error: any) {
      setTestResult('error');
      setTestMessage(error.message || 'Failed to test API key');
      
      toast({
        title: "API Test Failed",
        description: error.message || "Failed to test API key",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getLocalOpenAIKey = () => {
    return localStorage.getItem('openai_api_key') || '';
  };

  return (
    <Card className="p-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-white/10 text-white mb-8 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">OpenAI API Configuration</h2>
        {getLocalOpenAIKey() ? (
          <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-medium">
            ✓ API Key Set
          </span>
        ) : (
          <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-xs font-medium">
            ✗ No API Key Found
          </span>
        )}
      </div>
      
      <p className="text-sm text-white/80 mb-4">
        A default API key has been set for you. You can test the connection to make sure it's working properly.
      </p>
      
      <div className="flex space-x-4">
        <Button 
          onClick={testAPIKey} 
          disabled={isLoading || !getLocalOpenAIKey()}
          className="bg-white text-black hover:bg-gray-200"
        >
          {isLoading ? "Testing..." : "Test Connection"}
        </Button>
      </div>
      
      {testResult && (
        <div className={`mt-4 p-3 rounded ${testResult === 'success' ? 'bg-green-900/30 border border-green-500/30' : 'bg-red-900/30 border border-red-500/30'}`}>
          <div className="flex items-start">
            {testResult === 'success' ? (
              <Check className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            )}
            <div>
              <p className={`font-medium ${testResult === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {testResult === 'success' ? 'Success!' : 'Error'}
              </p>
              <p className="text-sm text-white/80">{testMessage}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default OpenAIKeyForm;
