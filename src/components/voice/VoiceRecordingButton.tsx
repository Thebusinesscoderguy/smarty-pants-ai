
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
    <>
      {isRecording ? (
        <div className="flex items-center gap-2">
          <div className="animate-pulse w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-red-400">Recording... {recordingTime}s</span>
          <Button 
            variant="destructive"
            size="sm"
            onClick={onStopRecording}
          >
            <Square className="h-4 w-4 mr-1" />
            Stop
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={onStartRecording}
          className="bg-blue-900/20 border-blue-500/30 text-blue-400 hover:bg-blue-900/30"
        >
          <Mic className="h-4 w-4 mr-1" />
          Record Voice
        </Button>
      )}
    </>
  );
};

export default VoiceRecordingButton;
