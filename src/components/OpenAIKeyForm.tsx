
import { useState, useEffect } from 'react';
import { Check, Edit2, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

const OpenAIKeyForm = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [keyExists, setKeyExists] = useState(false);

  useEffect(() => {
    // Check if API key exists in localStorage
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setKeyExists(true);
      // Only show first few characters for security
      setApiKey(savedKey.substring(0, 5) + "..." + savedKey.substring(savedKey.length - 4));
    }
  }, []);

  const handleSaveKey = () => {
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

    // Save to localStorage
    localStorage.setItem('openai_api_key', apiKey);
    setKeyExists(true);
    setIsEditing(false);
    
    toast({
      title: "Success",
      description: "OpenAI API key has been saved",
    });
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
          {keyExists ? (
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
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default OpenAIKeyForm;
