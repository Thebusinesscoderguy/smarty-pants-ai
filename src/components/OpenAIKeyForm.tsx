
import { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Check, AlertCircle } from 'lucide-react';

const OpenAIKeyForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  useEffect(() => {
    // Get API key from local storage on component mount
    const storedKey = localStorage.getItem('openai_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const saveAPIKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem('openai_api_key', apiKey);
    toast({
      title: "API Key Saved",
      description: "Your OpenAI API key has been saved to local storage.",
    });
  };

  const testAPIKey = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const keyToTest = apiKey.trim();
      if (!keyToTest) {
        throw new Error('No API key provided. Please enter your API key.');
      }
      
      // Test the API key with a simple text-to-speech request
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${keyToTest}`,
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

        // Save the verified API key
        localStorage.setItem('openai_api_key', keyToTest);
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

  return (
    <Card className="p-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-white/10 text-white mb-8 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">OpenAI API Configuration</h2>
        {apiKey ? (
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
        Enter your OpenAI API key below. This key will be stored locally in your browser and used for voice functionality.
      </p>
      
      <div className="space-y-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="apiKey" className="text-white">OpenAI API Key</Label>
          <Input 
            id="apiKey"
            type="password"
            placeholder="sk-..." 
            value={apiKey} 
            onChange={handleKeyChange}
            className="bg-white/10 border-white/20 text-white"
          />
          <p className="text-xs text-white/60">
            Your API key will be saved in your browser's local storage.
          </p>
        </div>
      </div>
      
      <div className="flex space-x-4">
        <Button 
          onClick={saveAPIKey} 
          disabled={isLoading || !apiKey.trim()}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Save API Key
        </Button>
        <Button 
          onClick={testAPIKey} 
          disabled={isLoading || !apiKey.trim()}
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
