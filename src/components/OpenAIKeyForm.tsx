
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Key, Check, AlertCircle } from 'lucide-react';

const OpenAIKeyForm = () => {
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Store the API key in local storage for UI state
      localStorage.setItem('openai_api_key', apiKey);
      
      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been saved locally. You'll need to enter it again if you clear your browser data.",
      });
      
      // Reset form
      setApiKey('');
      setTestResult(null);
      setTestMessage('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save API key",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const testAPIKey = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      const storedKey = localStorage.getItem('openai_api_key');
      if (!storedKey) {
        throw new Error('No API key found. Please save your API key first.');
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
            ✓ API Key Stored Locally
          </span>
        ) : (
          <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-xs font-medium">
            ✗ No API Key Found
          </span>
        )}
      </div>
      
      <p className="text-sm text-white/80 mb-4">
        Your API key will be stored locally in your browser and used directly to communicate with OpenAI.
        This bypasses any server configuration issues. Your key never leaves your browser except to call the OpenAI API.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="apiKey" className="flex items-center text-sm font-medium">
            <Key className="h-4 w-4 mr-2" />
            OpenAI API Key
          </label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="bg-black/30 border-white/30 text-white"
          />
          <p className="text-xs text-white/60">
            Don't have an API key? Get one from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">OpenAI's website</a>
          </p>
        </div>
        
        <div className="flex space-x-4">
          <Button type="submit" disabled={isSubmitting || !apiKey} className="bg-white text-black hover:bg-gray-200">
            {isSubmitting ? "Saving..." : "Save API Key Locally"}
          </Button>
          
          <Button 
            type="button" 
            onClick={testAPIKey} 
            disabled={isLoading || !getLocalOpenAIKey()}
            className="border-white/30 bg-transparent text-white hover:bg-white/10"
          >
            {isLoading ? "Testing..." : "Test Connection"}
          </Button>
        </div>
      </form>
      
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
