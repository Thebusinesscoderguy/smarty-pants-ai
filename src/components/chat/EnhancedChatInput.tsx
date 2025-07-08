import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal, Mic, MicOff, Upload, X, Volume2, VolumeX } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { toast } from '@/components/ui/use-toast';

interface EnhancedChatInputProps {
  textMessage: string;
  setTextMessage: (text: string) => void;
  onSendMessage: () => void;
  onSendVoiceMessage: (audioBlob: Blob) => void;
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  isVoiceResponse: boolean;
  setIsVoiceResponse: (enabled: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

const EnhancedChatInput = ({
  textMessage,
  setTextMessage,
  onSendMessage,
  onSendVoiceMessage,
  onFileSelect,
  selectedFile,
  setSelectedFile,
  isVoiceResponse,
  setIsVoiceResponse,
  disabled = false,
  placeholder = "Ask me anything about learning..."
}: EnhancedChatInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    isRecording,
    recordingTime,
    audioData,
    setAudioData,
    handleStartRecording,
    handleStopRecording
  } = useVoiceRecorder();

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      handleStopRecording();
      // Process the voice message when recording stops
      if (audioData) {
        onSendVoiceMessage(audioData);
        setAudioData(null);
      }
    } else {
      try {
        await handleStartRecording();
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not access microphone",
          variant: "destructive"
        });
      }
    }
  };

  // Handle voice recording completion
  const handleRecordingComplete = () => {
    handleStopRecording();
    if (audioData) {
      onSendVoiceMessage(audioData);
      setAudioData(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 border-t border-white/20">
      {/* File Preview */}
      {selectedFile && (
        <div className="mb-4 p-4 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <Upload className="h-5 w-5 text-blue-400" />
            <span className="text-white font-medium">{selectedFile.name}</span>
          </div>
          <Button
            onClick={() => setSelectedFile(null)}
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Recording Indicator */}
      {isRecording && (
        <div className="mb-4 flex items-center justify-center text-red-400 text-sm bg-red-500/10 p-3 rounded-2xl border border-red-500/20">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse mr-2"></div>
          Recording... {formatTime(recordingTime)}
          <Button
            onClick={handleRecordingComplete}
            variant="ghost"
            size="sm"
            className="ml-4 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl"
          >
            Stop & Send
          </Button>
        </div>
      )}
      
      {/* Input Area */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Textarea
            value={textMessage}
            onChange={(e) => setTextMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            className="min-h-[60px] bg-white/10 border border-white/30 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 text-lg backdrop-blur-sm pr-40 resize-none"
            disabled={disabled}
          />
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.mp3,.mp4,.wav"
          />
          
          {/* Input Controls */}
          <div className="absolute right-3 top-3 flex space-x-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="ghost"
              size="sm"
              className="p-2 h-10 w-10 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              title="Upload file"
              disabled={disabled}
            >
              <Upload className="h-5 w-5" />
            </Button>
            
            <Button
              onClick={handleVoiceToggle}
              variant="ghost"
              size="sm"
              className={`p-2 h-10 w-10 rounded-xl transition-all duration-200 ${
                isRecording 
                  ? 'text-red-400 hover:text-red-300 bg-red-500/20 hover:bg-red-500/30' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              title={isRecording ? 'Stop recording' : 'Start voice recording'}
              disabled={disabled}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            
            <Button
              onClick={() => setIsVoiceResponse(!isVoiceResponse)}
              variant="ghost"
              size="sm"
              className={`p-2 h-10 w-10 rounded-xl transition-all duration-200 ${
                isVoiceResponse 
                  ? 'text-purple-400 hover:text-purple-300 bg-purple-500/20 hover:bg-purple-500/30' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              title={isVoiceResponse ? 'Voice responses enabled' : 'Voice responses disabled'}
              disabled={disabled}
            >
              {isVoiceResponse ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        <Button
          onClick={onSendMessage}
          disabled={(!textMessage.trim() && !selectedFile) || disabled || isRecording}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-4 rounded-2xl font-semibold shadow-xl disabled:opacity-50"
        >
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default EnhancedChatInput;