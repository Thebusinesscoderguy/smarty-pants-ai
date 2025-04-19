
import { useState, useEffect } from 'react';
import { Check, Edit2, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const OpenAIKeyForm = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [keyExists, setKeyExists] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkOpenAIKey();
  }, []);

  const checkOpenAIKey = async () => {
    try {
      setIsLoading(true);
      console.log("Checking OpenAI API key...");
      
      // More comprehensive test request
      const response = await supabase.functions.invoke('text-to-voice', {
        body: { 
          text: "System check for OpenAI API key functionality", 
          voice: 'alloy' 
        }
      });
      
      console.log("API key check response:", response);
      
      if (response.error) {
        console.error("OpenAI API key check failed:", response.error);
        
        if (response.error.message && response.error.message.includes('API key')) {
          setKeyExists(false);
          toast({
            title: "API Key Error",
            description: "OpenAI API key is not properly configured.",
            variant: "destructive"
          });
        }
      } else {
        setKeyExists(true);
        toast({
          title: "API Key Verified",
          description: "OpenAI API key is working correctly.",
        });
      }
    } catch (error) {
      console.error("Unexpected error checking OpenAI API key:", error);
      setKeyExists(false);
      toast({
        title: "Error",
        description: "Failed to verify OpenAI API key. " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "API key cannot be empty",
        variant: "destructive"
      });
      return;
    }

    // Validate API key format (should start with "sk-")
    if (!apiKey.startsWith('sk-')) {
      toast({
        title: "Error",
        description: "Invalid API key format. OpenAI API keys should start with 'sk-'",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Store in localStorage for debugging
      localStorage.setItem('openai_api_key', apiKey);
      
      // Attempt to verify the key
      const response = await supabase.functions.invoke('text-to-voice', {
        body: { 
          text: "Verifying new OpenAI API key", 
          voice: 'alloy' 
        }
      });

      console.log("New API key verification response:", response);

      if (response.error) {
        throw new Error(response.error.message || 'Failed to verify API key');
      }
      
      toast({
        title: "Success",
        description: "Your OpenAI API key has been saved and verified.",
      });
      
      setKeyExists(true);
      setIsEditing(false);
      
      // Re-check the key status after saving
      await checkOpenAIKey();
    } catch (error: any) {
      console.error("Failed to save API key:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save API key",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-4">
      {!isEditing ? (
        <div className="flex justify-between items-center">
          {isLoading ? (
            <div className="text-sm">Checking API key status...</div>
          ) : keyExists ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-green-900/20 border-green-500/30 text-green-400 hover:bg-green-900/30"
            >
              <Check className="h-4 w-4 mr-2" />
              OpenAI API Key Set
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-orange-900/20 border-orange-500/30 text-orange-400 hover:bg-orange-900/30"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              OpenAI API Key Not Set
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4 mr-1" />
            {keyExists ? "Change" : "Set"}
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            type="password"
            placeholder="Enter your OpenAI API key (starts with sk-)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={handleSaveKey}
            className="bg-green-600 hover:bg-green-700"
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsEditing(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      )}
      
      <div className="mt-2 text-xs text-white/60">
        <p>Note: Open AI keys should start with 'sk-'. For this demo, the key is stored in localStorage.</p>
        <p>In a production app, keys should be securely saved server-side.</p>
      </div>
    </div>
  );
};

export default OpenAIKeyForm;
