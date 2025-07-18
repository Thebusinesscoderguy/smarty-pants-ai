
import React from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Volume, VolumeX } from 'lucide-react';
import TokenUsageDisplay from '@/components/voice/TokenUsageDisplay';

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
  const testVoice = async (voice: string) => {
    try {
      const response = await fetch('https://twfzlbockonxopuindaw.supabase.co/functions/v1/text-to-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: "Hello! This is how I sound. Nice to meet you!",
          voice: voice
        })
      });

      if (response.ok) {
        const data = await response.json();
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audio.play();
      }
    } catch (error) {
      console.log('Voice test failed:', error);
    }
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
            console.log('Voice selection changed to:', value);
            setSelectedVoice(value);
            // Always test the new voice with a sample phrase
            testVoice(value);
          }} 
          disabled={isTokenLimitReached || !isVoiceEnabled}
        >
          <SelectTrigger 
            id="voice-select" 
            className={`w-[140px] bg-white/5 border-white/20 ${!isVoiceEnabled ? 'opacity-50' : ''}`}
          >
            <SelectValue placeholder="Choose voice" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 z-50">
            {OPENAI_VOICES.map(voice => (
              <SelectItem key={voice.value} value={voice.value}>
                {voice.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedVoice && isVoiceEnabled && (
          <span className="text-xs text-green-400">✓ {OPENAI_VOICES.find(v => v.value === selectedVoice)?.label}</span>
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
