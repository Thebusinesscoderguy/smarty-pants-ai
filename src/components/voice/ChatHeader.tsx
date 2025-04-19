
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
    <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-gray-900/50">
      <h1 className="text-lg font-semibold text-white">Voice Assistant</h1>
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
