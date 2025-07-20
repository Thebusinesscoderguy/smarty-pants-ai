
import React, { useState } from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Volume, VolumeX, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import TokenUsageDisplay from '@/components/voice/TokenUsageDisplay';
import { supabase } from '@/integrations/supabase/client';

const OPENAI_VOICES = [
  { label: 'Alloy (Default)', value: 'alloy' },
  { label: 'Echo', value: 'echo' },
  { label: 'Fable', value: 'fable' },
  { label: 'Onyx', value: 'onyx' },
  { label: 'Nova', value: 'nova' },
  { label: 'Shimmer', value: 'shimmer' },
];

interface VoiceSettingsProps {
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  isQuizMode: boolean;
  setIsQuizMode: (isQuizMode: boolean) => void;
  totalTokensUsed: number;
  monthlyLimit: number;
  inputTokens: number;
  outputTokens: number;
  isTokenLimitReached: boolean;
  isVoiceEnabled: boolean;
  onToggleVoice: () => void;
}

const VoiceSettings = ({
  selectedVoice,
  setSelectedVoice,
  isQuizMode,
  setIsQuizMode,
  totalTokensUsed,
  monthlyLimit,
  inputTokens,
  outputTokens,
  isTokenLimitReached,
  isVoiceEnabled,
  onToggleVoice
}: VoiceSettingsProps) => {
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [testingVoice, setTestingVoice] = useState<string | null>(null);
  const [voiceTestStatus, setVoiceTestStatus] = useState<{[key: string]: 'success' | 'error' | null}>({});
  const { toast } = useToast();

  const testVoice = async (voice: string, showToast: boolean = false) => {
    console.log('🎵 Starting voice test for:', voice);
    setIsTestingVoice(true);
    setTestingVoice(voice);
    setVoiceTestStatus(prev => ({ ...prev, [voice]: null }));

    if (showToast) {
      toast({
        title: "Testing Voice",
        description: `Testing ${OPENAI_VOICES.find(v => v.value === voice)?.label} voice...`,
      });
    }

    try {
      console.log('🌐 Making request to text-to-voice function...');
      
      const testText = `Hello! This is the ${OPENAI_VOICES.find(v => v.value === voice)?.label} voice. How do I sound?`;
      console.log('🎵 Test text being sent:', testText);
      
      const response = await supabase.functions.invoke('text-to-voice', {
        body: {
          text: testText,
          voice: voice
        }
      });

      console.log('📡 Response:', response);
      
      if (response.error) {
        console.error('❌ API Error:', response.error);
        throw new Error(`Voice test failed: ${response.error}`);
      }

      const data = response.data;
      console.log('✅ Voice test response received, audio data length:', data.audioContent?.length || 0);

      if (!data.audioContent) {
        throw new Error('No audio content received from server');
      }

      // Create and play audio
      console.log('🎵 Creating audio element...');
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      
      // Add event listeners for better debugging
      audio.addEventListener('loadstart', () => console.log('🎵 Audio loading started'));
      audio.addEventListener('canplay', () => console.log('🎵 Audio can play'));
      audio.addEventListener('playing', () => console.log('🎵 Audio is playing'));
      audio.addEventListener('ended', () => console.log('🎵 Audio ended'));
      audio.addEventListener('error', (e) => console.error('🎵 Audio error:', e));

      // Try to play the audio
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        console.log('🎵 Audio playback started successfully');
      }

      setVoiceTestStatus(prev => ({ ...prev, [voice]: 'success' }));
      
      if (showToast) {
        toast({
          title: "Voice Test Successful",
          description: `${OPENAI_VOICES.find(v => v.value === voice)?.label} voice is working perfectly!`,
        });
      }

    } catch (error: any) {
      console.error('❌ Voice test failed:', error);
      setVoiceTestStatus(prev => ({ ...prev, [voice]: 'error' }));
      
      let errorMessage = 'Unknown error occurred';
      
      if (error.message.includes('API key')) {
        errorMessage = 'OpenAI API key not configured properly';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Voice service is taking too long to respond';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network connection issue. Please check your internet.';
      } else if (error.message.includes('autoplay')) {
        errorMessage = 'Browser blocked audio playback. Try clicking to test manually.';
      } else {
        errorMessage = error.message || 'Voice test failed';
      }

      toast({
        title: "Voice Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsTestingVoice(false);
      setTestingVoice(null);
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setVoiceTestStatus(prev => ({ ...prev, [voice]: null }));
      }, 3000);
    }
  };

  const getVoiceStatusIcon = (voice: string) => {
    if (testingVoice === voice && isTestingVoice) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
    }
    
    const status = voiceTestStatus[voice];
    if (status === 'success') {
      return <CheckCircle className="h-4 w-4 text-green-400" />;
    } else if (status === 'error') {
      return <XCircle className="h-4 w-4 text-red-400" />;
    }
    
    return null;
  };

  return (
    <div className="flex flex-row items-center gap-4 mb-2">
      <TokenUsageDisplay
        totalTokensUsed={totalTokensUsed}
        monthlyLimit={monthlyLimit}
        inputTokens={inputTokens}
        outputTokens={outputTokens}
      />
      
      <div className="flex items-center gap-2">
        <label htmlFor="voice-toggle" className="text-sm font-medium text-white/80">Voice:</label>
        <Button
          id="voice-toggle"
          variant="outline"
          size="sm"
          onClick={onToggleVoice}
          className={`bg-white/5 border-white/20 hover:bg-white/10 ${isVoiceEnabled ? 'text-green-400' : 'text-red-400'}`}
          disabled={isTokenLimitReached}
        >
          {isVoiceEnabled ? <Volume className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          {isVoiceEnabled ? 'On' : 'Off'}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="voice-select" className="text-sm font-medium text-white/80">Voice Type:</label>
        <Select 
          value={selectedVoice} 
          onValueChange={(value) => {
            console.log('🔄 Voice selection changed to:', value);
            setSelectedVoice(value);
            // Auto-test the new voice when selected
            testVoice(value);
          }} 
          disabled={isTokenLimitReached || isTestingVoice}
        >
          <SelectTrigger 
            id="voice-select" 
            className={`w-[140px] bg-white/5 border-white/20 ${(!isVoiceEnabled || isTestingVoice) ? 'opacity-50' : ''}`}
          >
            <SelectValue placeholder="Choose voice" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 z-50">
            {OPENAI_VOICES.map(voice => (
              <SelectItem key={voice.value} value={voice.value} className="flex items-center justify-between">
                <span>{voice.label}</span>
                {getVoiceStatusIcon(voice.value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedVoice && (
          <div className="flex items-center gap-2">
            {isTestingVoice && testingVoice === selectedVoice ? (
              <span className="text-xs text-blue-400 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Testing...
              </span>
            ) : (
              <>
                {voiceTestStatus[selectedVoice] === 'success' && (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Ready
                  </span>
                )}
                {voiceTestStatus[selectedVoice] === 'error' && (
                  <span className="text-xs text-red-400 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Failed
                  </span>
                )}
                {!voiceTestStatus[selectedVoice] && (
                  <span className="text-xs text-green-400">
                    ✓ {OPENAI_VOICES.find(v => v.value === selectedVoice)?.label}
                  </span>
                )}
              </>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => testVoice(selectedVoice, true)}
              disabled={isTestingVoice || isTokenLimitReached}
              className="bg-white/5 border-white/20 hover:bg-white/10 text-white/80 px-2 py-1 text-xs"
            >
              {isTestingVoice && testingVoice === selectedVoice ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Test'
              )}
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <label htmlFor="quiz-mode" className="text-sm font-medium text-white/80">
          Quiz Mode:
        </label>
        <Select value={isQuizMode ? "on" : "off"} onValueChange={(value) => setIsQuizMode(value === "on")}>
          <SelectTrigger id="quiz-mode" className="w-[100px] bg-white/5 border-white/20">
            <SelectValue placeholder="Quiz Mode" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 z-50">
            <SelectItem value="on">On</SelectItem>
            <SelectItem value="off">Off</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default VoiceSettings;
