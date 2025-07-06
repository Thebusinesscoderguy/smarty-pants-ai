
import React from 'react';
import VoiceRecordingButton from './VoiceRecordingButton';

interface ChatHeaderProps {
  isRecording: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const ChatHeader = ({
  isRecording,
  recordingTime,
  onStartRecording,
  onStopRecording
}: ChatHeaderProps) => {
  return (
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
  );
};

export default ChatHeader;
