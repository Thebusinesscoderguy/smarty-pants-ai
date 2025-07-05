
import React from 'react';
import { VoiceRecordingButton } from '@/components/voice/VoiceRecordingButton';
import VoiceSettings from '@/components/voice/VoiceSettings';
import ApiKeyErrorAlert from '@/components/voice/ApiKeyErrorAlert';
import TokenLimitAlert from '@/components/voice/TokenLimitAlert';
import QuizModeAnalysis from '@/components/voice/QuizModeAnalysis';

interface VoiceControlPanelProps {
  isRecording: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  apiKeyError: boolean;
  isTokenLimitReached: boolean;
  monthlyLimit: number;
  selectedVoice: string;
  changeVoice: (voice: string) => void;
  isQuizMode: boolean;
  setIsQuizMode: (isQuizMode: boolean) => void;
  totalTokensUsed: number;
  inputTokens: number;
  outputTokens: number;
  isVoiceEnabled: boolean;
  toggleVoice: () => void;
  responseTimes: any[];
  userStrengths: string[];
  userWeaknesses: string[];
  getFastResponseTopics: () => string;
  getSlowResponseTopics: () => string;
}

export const VoiceControlPanel = ({
  isRecording,
  recordingTime,
  onStartRecording,
  onStopRecording,
  apiKeyError,
  isTokenLimitReached,
  monthlyLimit,
  selectedVoice,
  changeVoice,
  isQuizMode,
  setIsQuizMode,
  totalTokensUsed,
  inputTokens,
  outputTokens,
  isVoiceEnabled,
  toggleVoice,
  responseTimes,
  userStrengths,
  userWeaknesses,
  getFastResponseTopics,
  getSlowResponseTopics
}: VoiceControlPanelProps) => {
  return (
    <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center space-x-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            AI Voice Assistant
          </h1>
        </div>
        <VoiceRecordingButton
          isRecording={isRecording}
          recordingTime={recordingTime}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
        />
      </div>

      {/* Alerts */}
      <div className="px-6 py-2">
        <ApiKeyErrorAlert visible={apiKeyError} />
        <TokenLimitAlert isTokenLimitReached={isTokenLimitReached} monthlyLimit={monthlyLimit} />
      </div>

      {/* Settings */}
      <div className="px-6 py-4">
        <VoiceSettings 
          selectedVoice={selectedVoice}
          setSelectedVoice={changeVoice}
          isQuizMode={isQuizMode}
          setIsQuizMode={setIsQuizMode}
          totalTokensUsed={totalTokensUsed}
          monthlyLimit={monthlyLimit}
          inputTokens={inputTokens}
          outputTokens={outputTokens}
          isTokenLimitReached={isTokenLimitReached}
          isVoiceEnabled={isVoiceEnabled}
          onToggleVoice={toggleVoice}
        />
      </div>

      {/* Quiz Analysis */}
      <div className="px-6 pb-4">
        <QuizModeAnalysis 
          isQuizMode={isQuizMode}
          hasResponseData={responseTimes.length > 0}
          userStrengths={userStrengths}
          userWeaknesses={userWeaknesses}
          getFastResponseTopics={getFastResponseTopics}
          getSlowResponseTopics={getSlowResponseTopics}
        />
      </div>
    </div>
  );
};
