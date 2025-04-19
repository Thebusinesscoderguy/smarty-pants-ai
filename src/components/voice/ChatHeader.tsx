
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
    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
      <h1 className="text-2xl font-bold">Voice Assistant</h1>
      <div className="flex items-center space-x-4">
        <VoiceRecordingButton
          isRecording={isRecording}
          recordingTime={recordingTime}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
        />
      </div>
    </div>
  );
};

export default ChatHeader;
