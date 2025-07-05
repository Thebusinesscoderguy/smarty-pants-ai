
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, X } from 'lucide-react';

interface ModernMessageInputProps {
  textMessage: string;
  setTextMessage: (text: string) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  onSendText: () => void;
  onFileUpload: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
}

export const ModernMessageInput = ({
  textMessage,
  setTextMessage,
  file,
  setFile,
  onSendText,
  onFileUpload,
  onKeyPress,
  disabled = false
}: ModernMessageInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* File Preview */}
      {file && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/10 border border-white/20">
          <Paperclip className="h-4 w-4 text-purple-400" />
          <span className="text-sm text-white flex-1">{file.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveFile}
            className="h-6 w-6 p-0 hover:bg-red-500/20 text-red-400"
          >
            <X className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onFileUpload}
            className="text-purple-400 hover:bg-purple-500/20"
          >
            Upload
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="relative">
        <div className="flex items-end gap-3 p-4 rounded-2xl bg-white/5 border border-white/20 backdrop-blur-sm hover:bg-white/10 transition-all duration-200">
          {/* File Upload Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex-shrink-0 h-10 w-10 p-0 rounded-full hover:bg-purple-500/20 text-purple-400"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          />

          {/* Text Input */}
          <div className="flex-1">
            <Textarea
              value={textMessage}
              onChange={(e) => setTextMessage(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
              disabled={disabled}
              className="min-h-[60px] max-h-32 resize-none bg-transparent border-none focus:ring-0 text-white placeholder-white/50 text-base leading-relaxed"
              rows={1}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={onSendText}
            disabled={disabled || (!textMessage.trim() && !file)}
            size="sm"
            className="flex-shrink-0 h-10 w-10 p-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
