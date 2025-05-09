
import React from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
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
  isTokenLimitReached
}: VoiceSettingsProps) => {
  return (
    <div className="flex flex-row items-center gap-4 mb-2">
      <TokenUsageDisplay
        totalTokensUsed={totalTokensUsed}
        monthlyLimit={monthlyLimit}
        inputTokens={inputTokens}
        outputTokens={outputTokens}
      />
      <div className="flex items-center gap-2">
        <label htmlFor="voice-select" className="text-sm font-medium text-white/80">Voice:</label>
        <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={isTokenLimitReached}>
          <SelectTrigger id="voice-select" className="w-[140px] bg-white/5 border-white/20">
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
