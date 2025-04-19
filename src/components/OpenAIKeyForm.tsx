
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { KeyRound, Save, Check } from 'lucide-react';

const OpenAIKeyForm = () => {
  const [apiKey, setApiKey] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown');

  useEffect(() => {
    // Check if API key exists in localStorage
    const storedKey = localStorage.getItem('openai_api_key');
    
    if (storedKey) {
      setApiKey(storedKey);
      setKeyStatus('unknown'); // We'll verify on save/test
    } else {
      setShowForm(true); // Show the form if no key exists
    }
  }, []);

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid OpenAI API key",
        variant: "destructive"
      });
      return;
    }

    // Basic validation - API key should start with "sk-"
    if (!apiKey.startsWith('sk-')) {
      toast({
        title: "Warning",
        description: "API key should start with 'sk-'. Are you sure this is correct?",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('openai_api_key', apiKey);
    toast({
      title: "Success",
      description: "OpenAI API key saved successfully",
      variant: "default"
    });
    setShowForm(false);
    setKeyStatus('valid');
  };

  const testApiKey = async () => {
    try {
      toast({
        title: "Testing",
        description: "Verifying your OpenAI API key...",
      });

      // Simple test to check if the API key works
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        setKeyStatus('valid');
        toast({
          title: "Success",
          description: "Your OpenAI API key is valid!",
        });
      } else {
        setKeyStatus('invalid');
        toast({
          title: "Error",
          description: "Your OpenAI API key appears to be invalid",
          variant: "destructive"
        });
      }
    } catch (error) {
      setKeyStatus('invalid');
      toast({
        title: "Error",
        description: "Failed to test API key: Network error",
        variant: "destructive"
      });
    }
  };

  if (!showForm && keyStatus === 'valid') {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="mb-4 bg-green-900/20 border-green-500/30 text-green-400 hover:bg-green-900/30"
        onClick={() => setShowForm(true)}
      >
        <Check className="h-4 w-4 mr-2" />
        OpenAI API Key Set
      </Button>
    );
  }

  return (
    <Card className="p-4 mb-6 border-white/20 bg-white/5">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-medium">OpenAI API Key Setup</h3>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="api-key">Your OpenAI API Key</Label>
          <div className="flex gap-2">
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 bg-white/5 border-white/20"
            />
          </div>
        </div>
        
        <div className="flex justify-between gap-2">
          <Button 
            variant="default" 
            onClick={saveApiKey}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Key
          </Button>
          
          <Button 
            variant="outline" 
            onClick={testApiKey}
            className="border-white/30 hover:bg-white/10"
          >
            Test Key
          </Button>
        </div>
        
        <p className="text-xs text-white/60">
          Your API key is stored securely in your browser's local storage and is only sent directly to OpenAI's servers.
        </p>
      </div>
    </Card>
  );
};

export default OpenAIKeyForm;
