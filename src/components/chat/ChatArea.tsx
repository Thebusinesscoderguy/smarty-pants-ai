
import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageList } from '@/components/MessageList';
import { VoiceMessageInput } from '@/components/VoiceMessageInput';
import { useMessageHandler } from '@/hooks/useMessageHandler';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Mic, MicOff } from 'lucide-react';

export const ChatArea = () => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const { messages, sendMessage, isLoading } = useMessageHandler();
  const { isRecording, startRecording, stopRecording } = useVoiceRecorder();
  const { settings } = useVoiceSettings();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (input.trim() && !isLoading) {
      await sendMessage(input);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <MessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t border-white/20 p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your studies..."
            className="flex-1 bg-white/10 border-white/20 text-white placeholder-white/50"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-white text-black hover:bg-gray-200"
          >
            <Send className="h-4 w-4" />
          </Button>
          <VoiceMessageInput />
        </div>
      </div>
    </div>
  );
};
