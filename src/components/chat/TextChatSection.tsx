
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Volume } from 'lucide-react';
import type { Message } from '@/types/message';

interface TextChatSectionProps {
  messages: Message[];
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onVoiceResponse: () => void;
}

export const TextChatSection = ({
  messages,
  input,
  onInputChange,
  onSendMessage,
  onKeyDown,
  onVoiceResponse
}: TextChatSectionProps) => {
  return (
    <div className="mt-8 bg-white/5 border border-white/10 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Text Chat</h2>
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
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <Card className={`max-w-[80%] p-3 ${message.role === 'user' ? 'bg-white/10 text-white border-white/20' : 'bg-white/5 text-white border-white/20'}`}>
              <p className="whitespace-pre-wrap">{message.content}</p>
              <div className="text-xs text-white/50 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </Card>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <Input 
          value={input} 
          onChange={(e) => onInputChange(e.target.value)} 
          onKeyDown={onKeyDown} 
          placeholder="Type your message..." 
          className="flex-1 bg-transparent border-white/30 focus-visible:ring-white" 
        />
        <Button onClick={onSendMessage} className="bg-white text-black hover:bg-gray-200">
          Send
        </Button>
      </div>
    </div>
  );
};
