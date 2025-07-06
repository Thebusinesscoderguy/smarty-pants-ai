
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';

interface VoiceRecordingButtonProps {
  isRecording: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const VoiceRecordingButton = ({
  isRecording,
  recordingTime,
  onStartRecording,
  onStopRecording
}: VoiceRecordingButtonProps) => {
  return (
    <div className="flex items-center space-x-2">
      {isRecording ? (
        <>
          <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-xs text-red-400 font-mono">{recordingTime}s</span>
          <Button 
            variant="ghost"
            size="icon"
            onClick={onStopRecording}
            className="w-8 h-8 hover:bg-red-500/10"
          >
            <Square className="h-4 w-4 text-red-500" />
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          size="icon"
          onClick={onStartRecording}
          className="w-8 h-8 bg-blue-900/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
        >
          <Mic className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default VoiceRecordingButton;
