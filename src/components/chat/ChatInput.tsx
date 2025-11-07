
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Upload, Mic, MicOff, Volume2 } from 'lucide-react';

interface ChatInputProps {
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
  isAnalyzing: boolean;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isVoiceResponse: boolean;
  onToggleVoiceResponse: () => void;
  onFileUpload: () => void;
}

export const ChatInput = ({
  currentMessage,
  setCurrentMessage,
  onSendMessage,
  isLoading,
  isAnalyzing,
  selectedFile,
  setSelectedFile,
  isRecording,
  onStartRecording,
  onStopRecording,
  isVoiceResponse,
  onToggleVoiceResponse,
  onFileUpload
}: ChatInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="border-t border-border bg-card p-4">
      <div className="max-w-4xl mx-auto">
        {selectedFile && (
          <div className="mb-3 p-3 bg-primary/10 rounded-lg flex items-center justify-between border border-primary/20">
            <span className="text-sm text-foreground">Selected: {selectedFile.name}</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={onFileUpload} className="bg-primary hover:bg-primary/90">
                Upload
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedFile(null)} className="border-border text-foreground hover:bg-muted">
                Remove
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <Input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Message AI Learning Assistant..."
              onKeyPress={handleKeyPress}
              className="min-h-[48px] py-3 pl-4 pr-32 text-base bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              disabled={isLoading || isAnalyzing}
            />
            
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              />
              
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="ghost"
                size="sm"
                className="p-2 h-8 w-8 text-gray-400 hover:text-gray-300 hover:bg-gray-600"
                disabled={isLoading || isAnalyzing}
              >
                <Upload className="h-4 w-4" />
              </Button>
              
              <Button 
                onClick={isRecording ? onStopRecording : onStartRecording}
                variant="ghost"
                size="sm"
                className={`p-2 h-8 w-8 ${isRecording ? 'text-red-400 hover:text-red-300' : 'text-gray-400 hover:text-gray-300'} hover:bg-gray-600`}
                disabled={isLoading || isAnalyzing}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              
              <Button 
                onClick={onToggleVoiceResponse}
                variant="ghost"
                size="sm"
                className={`p-2 h-8 w-8 ${isVoiceResponse ? 'text-purple-400 hover:text-purple-300' : 'text-gray-400 hover:text-gray-300'} hover:bg-gray-600`}
                disabled={isLoading || isAnalyzing}
                title={isVoiceResponse ? 'Voice responses enabled' : 'Voice responses disabled'}
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Button 
            onClick={onSendMessage} 
            disabled={!currentMessage.trim() || isLoading || isAnalyzing}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl min-h-[48px] disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
