
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Play, Pause, Volume } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import type { VoiceMessage } from '@/types/voice';

interface VoiceMessageSectionProps {
  messages: VoiceMessage[];
  onPlayAudio: (messageId: string) => void;
  onPauseAudio: (messageId: string) => void;
  onVoiceResponse: () => void;
  isRecording: boolean;
  recordingTime: number;
  handleStartRecording: () => void;
  handleStopRecording: () => void;
}

export const VoiceMessageSection = ({
  messages,
  onPlayAudio,
  onPauseAudio,
  onVoiceResponse,
  isRecording,
  recordingTime,
  handleStartRecording,
  handleStopRecording
}: VoiceMessageSectionProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mt-8 bg-white/5 border border-white/10 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Voice Messages</h2>
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center space-x-2"
            onClick={onVoiceResponse}
          >
            <Volume className="h-4 w-4" />
            <span>Voice Response</span>
          </Button>
        </div>
      </div>
      
      <div className="space-y-4 max-h-[400px] overflow-y-auto mb-6">
        {messages.length > 0 ? messages.map((message) => (
          <Card key={message.id} className="p-4 bg-white/5 border-white/20">
            <p className="mb-2">{message.text}</p>
            <div className="flex items-center justify-between">
              {message.audioUrl && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-white/30 hover:bg-white/10" 
                  onClick={() => message.isPlaying ? onPauseAudio(message.id!) : onPlayAudio(message.id!)}
                >
                  {message.isPlaying ? (
                    <>
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Play
                    </>
                  )}
                </Button>
              )}
              <span className="text-xs text-white/50">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </Card>
        )) : (
          <p className="text-white/70 text-center py-4">No voice messages yet. Start recording to begin.</p>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="flex justify-center">
        {isRecording ? (
          <div className="flex flex-col items-center">
            <div className="mb-2 text-red-500 animate-pulse">
              Recording... {recordingTime}s
            </div>
            <Button onClick={handleStopRecording} variant="destructive" size="lg" className="rounded-full w-16 h-16 flex items-center justify-center">
              <Square className="h-6 w-6" />
            </Button>
          </div>
        ) : (
          <Button onClick={handleStartRecording} className="bg-white text-black hover:bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center">
            <Mic className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  );
};
