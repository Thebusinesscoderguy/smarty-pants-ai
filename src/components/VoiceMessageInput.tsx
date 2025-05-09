
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal, Mic, Volume, FileInput, X } from 'lucide-react';

interface MessageInputProps {
  textMessage: string;
  setTextMessage: (text: string) => void;
  onSendText: () => void;
  onVoiceResponse: () => void;
  onFileUpload: () => void;
  file: File | null;
  setFile: (file: File | null) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
}

const VoiceMessageInput = ({
  textMessage,
  setTextMessage,
  onSendText,
  onVoiceResponse,
  onFileUpload,
  file,
  setFile,
  onKeyPress,
  disabled = false
}: MessageInputProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className={`relative ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className="flex items-end space-x-2">
        <div className="relative flex-1">
          <Textarea
            placeholder="Type your message..."
            value={textMessage}
            onChange={(e) => setTextMessage(e.target.value)}
            onKeyDown={onKeyPress}
            className="min-h-[80px] bg-white/5 border-white/30 resize-none pr-12"
            disabled={disabled}
          />

          {file && (
            <div className="absolute top-2 right-2">
              <Button
                variant="secondary"
                size="sm"
                className="h-6 px-2 py-1 text-xs"
                onClick={() => setFile(null)}
              >
                <X className="h-3 w-3 mr-1" />
                {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2">
          <Button 
            onClick={onSendText} 
            disabled={!textMessage.trim() || disabled}
            className="bg-white/10 hover:bg-white/20"
          >
            <SendHorizontal className="h-5 w-5" />
          </Button>
          
          <Button
            variant="outline"
            className="bg-white/5 border-white/20 hover:bg-white/10"
            onClick={onVoiceResponse}
            disabled={disabled}
          >
            <Volume className="h-5 w-5" />
          </Button>

          <div className="relative">
            <input
              type="file"
              id="file-upload"
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              disabled={disabled}
            />
            <Button
              variant="outline"
              className="bg-white/5 border-white/20 hover:bg-white/10"
              disabled={disabled}
            >
              <FileInput className="h-5 w-5" />
            </Button>
          </div>
          
          {file && (
            <Button 
              onClick={onFileUpload}
              disabled={disabled}
              className="bg-white/10 hover:bg-white/20"
            >
              Upload
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceMessageInput;
