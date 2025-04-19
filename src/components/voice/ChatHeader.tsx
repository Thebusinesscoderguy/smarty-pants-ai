
import React from 'react';
import VoiceRecordingButton from './VoiceRecordingButton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ChatHeaderProps {
  isRecording: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isOpenAIKeySet: boolean;
}

const ChatHeader = ({
  isRecording,
  recordingTime,
  onStartRecording,
  onStopRecording,
  isOpenAIKeySet
}: ChatHeaderProps) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gray-800/70 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <h1 className="text-lg font-semibold text-white tracking-wide">Voice Assistant</h1>
        </div>
        <VoiceRecordingButton
          isRecording={isRecording}
          recordingTime={recordingTime}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
        />
      </div>
      
      {!isOpenAIKeySet && (
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 m-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Please set your OpenAI API key in the form below to use voice features.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ChatHeader;
