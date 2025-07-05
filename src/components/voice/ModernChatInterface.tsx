
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageList from '@/components/MessageList';
import { ModernMessageInput } from '@/components/voice/ModernMessageInput';
import { Message } from '@/types/message';

interface ModernChatInterfaceProps {
  messages: Message[];
  textMessage: string;
  setTextMessage: (text: string) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  onSendText: () => void;
  onFileUpload: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPlayAudio: (messageId: string) => void;
  onPauseAudio: (messageId: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  disabled?: boolean;
}

export const ModernChatInterface = ({
  messages,
  textMessage,
  setTextMessage,
  file,
  setFile,
  onSendText,
  onFileUpload,
  onKeyPress,
  onPlayAudio,
  onPauseAudio,
  messagesEndRef,
  disabled = false
}: ModernChatInterfaceProps) => {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-black/20 to-black/40 backdrop-blur-sm">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-6 py-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mb-6 animate-pulse">
                  <span className="text-2xl">🎤</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Welcome to Voice Assistant</h3>
                <p className="text-white/60 max-w-md">
                  Start a conversation by typing a message, uploading a file, or using voice recording. 
                  I'm here to help with your learning journey!
                </p>
              </div>
            ) : (
              <MessageList 
                messages={messages}
                onPlayAudio={onPlayAudio}
                onPauseAudio={onPauseAudio}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto p-6">
          <ModernMessageInput 
            textMessage={textMessage}
            setTextMessage={setTextMessage}
            file={file}
            setFile={setFile}
            onSendText={onSendText}
            onFileUpload={onFileUpload}
            onKeyPress={onKeyPress}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};
