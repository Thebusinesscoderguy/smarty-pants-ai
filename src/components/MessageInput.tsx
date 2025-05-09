import { useState, useRef } from 'react';
import { Send, Paperclip, Play, Volume, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface MessageInputProps {
  onSendText: () => void;
  onVoiceResponse: () => void;
  onFileUpload: () => void;
  textMessage: string;
  setTextMessage: (text: string) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isVoiceEnabled?: boolean;
  onToggleVoice?: () => void;
  disabled?: boolean; // Add the disabled prop
}

const MessageInput = ({
  onSendText,
  onVoiceResponse,
  onFileUpload,
  textMessage,
  setTextMessage,
  file,
  setFile,
  onKeyPress,
  isVoiceEnabled = true,
  onToggleVoice = () => {},
  disabled = false, // Add default value
}: MessageInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className={`border-t border-white/20 pt-4 space-y-4 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      {file && (
        <div className="flex items-center gap-2 bg-white/10 p-2 rounded">
          <Paperclip className="h-4 w-4" />
          <span className="flex-1 truncate">{file.name}</span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setFile(null)}
          >
            ×
          </Button>
        </div>
      )}
      
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Textarea 
            placeholder="Type your message here..."
            className="bg-white/5 border-white/20 resize-none min-h-[100px] text-lg"
            value={textMessage}
            onChange={(e) => setTextMessage(e.target.value)}
            onKeyDown={onKeyPress}
            disabled={disabled}
          />
          <div className="flex flex-col gap-2">
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={onVoiceResponse}
              title={isVoiceEnabled ? "Get voice response" : "Voice responses disabled"}
              disabled={!isVoiceEnabled || disabled}
            >
              <Volume className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="text-white/70 hover:text-white"
              onClick={onToggleVoice}
              title={isVoiceEnabled ? "Disable voice" : "Enable voice"}
              disabled={disabled}
            >
              {isVoiceEnabled ? <Volume className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            className="bg-white text-black hover:bg-gray-200 w-full font-bold"
            onClick={onSendText}
            disabled={!textMessage.trim() || disabled}
          >
            <Send className="h-4 w-4 mr-2" />
            Send Text
          </Button>
          
          <Input 
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={disabled}
          />
          
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="border-white/30 hover:bg-white/10 w-full"
            disabled={disabled}
          >
            <Paperclip className="h-4 w-4 mr-2" />
            {file ? 'Change File' : 'Attach File'}
          </Button>
          
          {file && (
            <Button
              onClick={onFileUpload}
              className="bg-purple-600 hover:bg-purple-700 w-full"
              disabled={disabled}
            >
              <Send className="h-4 w-4 mr-2" />
              Send File
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
