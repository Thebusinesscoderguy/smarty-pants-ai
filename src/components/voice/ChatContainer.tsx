
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageList from '@/components/MessageList';
import MessageInput from '@/components/MessageInput';
import { Message } from '@/types/message';

interface ChatContainerProps {
  messages: Message[];
  textMessage: string;
  file: File | null;
  onSendText: () => void;
  onVoiceResponse: () => void;
  onFileUpload: () => void;
  setTextMessage: (text: string) => void;
  setFile: (file: File | null) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPlayAudio: (messageId: string) => void;
  onPauseAudio: (messageId: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatContainer = ({
  messages,
  textMessage,
  file,
  onSendText,
  onVoiceResponse,
  onFileUpload,
  setTextMessage,
  setFile,
  onKeyPress,
  onPlayAudio,
  onPauseAudio,
  messagesEndRef
}: ChatContainerProps) => {
  return (
    <div className="flex-1 flex flex-col space-y-4">
      <ScrollArea className="flex-1 pr-4">
        <MessageList 
          messages={messages}
          onPlayAudio={onPlayAudio}
          onPauseAudio={onPauseAudio}
        />
        <div ref={messagesEndRef} />
      </ScrollArea>

      <div className="pt-4 border-t border-white/10">
        <MessageInput 
          onSendText={onSendText}
          onVoiceResponse={onVoiceResponse}
          onFileUpload={onFileUpload}
          textMessage={textMessage}
          setTextMessage={setTextMessage}
          file={file}
          setFile={setFile}
          onKeyPress={onKeyPress}
        />
      </div>
    </div>
  );
};

export default ChatContainer;
