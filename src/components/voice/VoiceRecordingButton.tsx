
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';

interface VoiceRecordingButtonProps {
  isRecording: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const VoiceRecordingButton = ({
  isRecording,
  recordingTime,
  onStartRecording,
  onStopRecording
}: VoiceRecordingButtonProps) => {
  return (
    <div className="flex items-center space-x-3">
      {isRecording ? (
        <>
          <div className="flex items-center space-x-2 bg-red-500/20 px-3 py-1 rounded-full">
            <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-sm text-red-400 font-mono">{recordingTime}s</span>
          </div>
          <Button 
            variant="ghost"
            size="sm"
            onClick={onStopRecording}
            className="h-12 w-12 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30"
          >
            <Square className="h-5 w-5 text-red-400" />
          </Button>
        </>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={onStartRecording}
          className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border border-purple-500/30"
        >
          <Mic className="h-5 w-5 text-purple-300" />
        </Button>
      )}
    </div>
  );
};
