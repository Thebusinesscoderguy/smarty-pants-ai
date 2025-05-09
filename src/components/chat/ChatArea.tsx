
import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { Chat } from '@/pages/Chat';
import { Card } from '@/components/ui/card';

interface ChatAreaProps {
  chat: Chat;
  inputMessage: string;
  setInputMessage: (message: string) => void;
  onSendMessage: () => void;
}

const ChatArea = ({ 
  chat, 
  inputMessage, 
  setInputMessage, 
  onSendMessage 
}: ChatAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    scrollToBottom();
  }, [chat.messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-800/50">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-xl font-bold">{chat.title}</h2>
        <div className="text-sm text-white/70">{chat.topic}</div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {chat.messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/50">
            <p>Start a conversation...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {chat.messages.map(message => (
              <div 
                key={message.id}
                className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}
              >
                <Card 
                  className={`max-w-3/4 p-4 ${
                    message.isFromUser 
                      ? 'bg-purple-600/30 border-purple-500/30 text-white'
                      : 'bg-white/10 border-white/20 text-white'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs text-white/50 mt-2 text-right">
                    {formatTime(message.timestamp)}
                  </div>
                </Card>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-white/10">
        <div className="flex items-end gap-2">
          <Textarea 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="min-h-[80px] bg-white/5 border-white/20 rounded-md resize-none"
          />
          <Button 
            onClick={onSendMessage} 
            disabled={!inputMessage.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
