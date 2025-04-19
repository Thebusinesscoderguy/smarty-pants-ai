
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
      // Test if OpenAI key is valid with a simple request
      const response = await supabase.functions.invoke('text-to-voice', {
        body: { text: "Test", voice: 'alloy' }
      });
      
      if (response.error && response.error.message && response.error.message.includes('API key')) {
        setKeyExists(false);
      } else {
        setKeyExists(true);
      }
    } catch (error) {
      setKeyExists(false);
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
      
      // Here we would typically send the key to the server to be stored securely
      // For this demo, we'll store it in localStorage (not recommended for production)
      localStorage.setItem('openai_api_key', apiKey);
      
      // Call a function to set the key in Supabase secrets (this would be handled by backend code)
      toast({
        title: "Information",
        description: "Your API key has been saved locally. In a production environment, this would be securely stored on the server.",
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

  const handleEditClick = () => {
    setIsEditing(true);
    // Clear the masked key when editing
    setApiKey('');
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
            onClick={handleEditClick}
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
        <p>Note: For this demo, API keys are stored in localStorage. In a production app, keys should be securely saved server-side.</p>
        <p>For the full functionality to work properly, the Supabase administrator needs to add the OpenAI API key to the Supabase secrets.</p>
      </div>
    </div>
  );
};

export default OpenAIKeyForm;
