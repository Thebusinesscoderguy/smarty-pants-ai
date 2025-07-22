import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, Sparkles } from 'lucide-react';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const VOICE_OPTIONS = [
  { value: 'alloy', label: 'Alloy', description: 'Balanced and neutral' },
  { value: 'echo', label: 'Echo', description: 'Warm and expressive' },
  { value: 'fable', label: 'Fable', description: 'Storytelling voice' },
  { value: 'onyx', label: 'Onyx', description: 'Strong and confident' },
  { value: 'nova', label: 'Nova', description: 'Bright and energetic' },
  { value: 'shimmer', label: 'Shimmer', description: 'Gentle and soothing' }
];

const VoiceTester: React.FC = () => {
  const { selectedVoice, setSelectedVoice } = useVoiceSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isTestingVoice, setIsTestingVoice] = React.useState(false);

  const testVoice = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in first to test voice functionality.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingVoice(true);

    try {
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: { 
          text: `Hello! This is the ${selectedVoice} voice. How do you like it?`,
          voice: selectedVoice 
        }
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audioBlob = new Blob([
          new Uint8Array(atob(data.audioContent).split('').map(c => c.charCodeAt(0)))
        ], { type: 'audio/mpeg' });
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        await audio.play();
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };

        toast({
          title: "Voice Test Complete",
          description: `Successfully tested ${selectedVoice} voice`,
        });
      }
    } catch (error: any) {
      console.error('Voice test error:', error);
      toast({
        title: "Voice Test Failed",
        description: error.message || "Failed to test voice",
        variant: "destructive",
      });
    } finally {
      setIsTestingVoice(false);
    }
  };

  const selectedVoiceInfo = VOICE_OPTIONS.find(v => v.value === selectedVoice);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-purple-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-gray-800/90 backdrop-blur-sm border-gray-700 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <Volume2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Chatbot Voice</h1>
            <p className="text-gray-300 text-sm">Choose the perfect voice for your AI learning assistant</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-white font-medium mb-3 block">Select Voice Profile</label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
                <SelectValue>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{selectedVoiceInfo?.label}</span>
                    <span className="text-sm text-gray-400">{selectedVoiceInfo?.description}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {VOICE_OPTIONS.map((voice) => (
                  <SelectItem key={voice.value} value={voice.value} className="text-white hover:bg-gray-600">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{voice.label}</span>
                      <span className="text-sm text-gray-400">{voice.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-900/50 rounded-lg p-4 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="text-blue-200 text-sm">Voice changes will apply to new conversations</span>
          </div>

          <Button 
            onClick={testVoice}
            disabled={isTestingVoice || !user}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-full transition-all duration-200"
          >
            {isTestingVoice ? 'Testing Voice...' : 'Test Voice'}
          </Button>

          {!user && (
            <p className="text-yellow-400 text-sm text-center">
              Please log in to test voice functionality
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default VoiceTester;