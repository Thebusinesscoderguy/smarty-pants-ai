
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import VoiceSystemStatus from './VoiceSystemStatus';
import VoiceQuickTest from './VoiceQuickTest';
import { testVoiceSystem } from './VoiceTestingUtils';

const VOICE_OPTIONS = [
  { value: 'alloy', label: 'Alloy', description: 'Balanced and neutral' },
  { value: 'echo', label: 'Echo', description: 'Warm and expressive' },
  { value: 'fable', label: 'Fable', description: 'Storytelling voice' },
  { value: 'onyx', label: 'Onyx', description: 'Strong and confident' },
  { value: 'nova', label: 'Nova', description: 'Bright and energetic' },
  { value: 'shimmer', label: 'Shimmer', description: 'Gentle and soothing' }
];

const VoiceTester: React.FC = () => {
  const [selectedVoice, setSelectedVoice] = React.useState('alloy');
  const { toast } = useToast();
  const [isTestingVoice, setIsTestingVoice] = React.useState(false);

  const handleVoiceTest = async () => {
    setIsTestingVoice(true);
    try {
      await testVoiceSystem(selectedVoice, true);
    } finally {
      setIsTestingVoice(false);
    }
  };

  const handleVoiceChange = async (voice: string) => {
    console.log('🔄 Voice selection changed to:', voice);
    setSelectedVoice(voice);
    
    // Automatically test the new voice when selected
    await testVoiceSystem(voice, false);
    
    toast({
      title: "Voice changed",
      description: `Now using ${VOICE_OPTIONS.find(v => v.value === voice)?.label} voice`,
      duration: 2000,
    });
  };

  const selectedVoiceInfo = VOICE_OPTIONS.find(v => v.value === selectedVoice);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-purple-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl bg-gray-800/90 backdrop-blur-sm border-gray-700 p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <Volume2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">AI Voice System Tester</h1>
            <p className="text-gray-300 text-sm">Test and configure your AI assistant's voice</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* System Status */}
          <div>
            <h2 className="text-white font-medium mb-3">System Status</h2>
            <VoiceSystemStatus />
          </div>

          {/* Quick Test */}
          <div className="flex justify-center">
            <VoiceQuickTest />
          </div>

          {/* Voice Selection */}
          <div>
            <label className="text-white font-medium mb-3 block">Select Voice Profile</label>
            <Select value={selectedVoice} onValueChange={handleVoiceChange} disabled={isTestingVoice}>
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

          {/* Test Selected Voice */}
          <Button 
            onClick={handleVoiceTest}
            disabled={isTestingVoice}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-4 rounded-full transition-all duration-200 text-lg"
          >
            {isTestingVoice ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Testing {selectedVoiceInfo?.label} Voice...
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5 mr-2" />
                Test {selectedVoiceInfo?.label} Voice
              </>
            )}
          </Button>

          {/* Info */}
          <div className="bg-blue-900/50 rounded-lg p-4 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <div className="text-blue-200 text-sm">
              <p>✅ Voice tests use the OpenAI text-to-speech API</p>
              <p>✅ Audio will auto-play or show manual controls</p>
              <p>✅ All voice settings are instantly applied</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VoiceTester;
