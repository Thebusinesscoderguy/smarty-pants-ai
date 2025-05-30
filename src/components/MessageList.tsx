
import { UserCircle2, Paperclip, Play, Pause } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Message } from '../types/message';
import { MathResultDisplay } from './chat/MathResultDisplay';

interface MessageListProps {
  messages: Message[];
  onPlayAudio: (messageId: string) => void;
  onPauseAudio: (messageId: string) => void;
}

const MessageList = ({ messages, onPlayAudio, onPauseAudio }: MessageListProps) => {
  return (
    <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
      {messages.map((message, index) => (
        <Card 
          key={index}
          className={`p-4 rounded-xl border-transparent shadow-sm transition-all duration-300 
            ${message.isFromUser 
              ? 'bg-gradient-to-br from-purple-900/30 to-blue-900/30' 
              : 'bg-white/5 hover:bg-white/10'}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {message.isFromUser ? (
                <UserCircle2 className="h-8 w-8 text-white/70" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                  AI
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="mb-2 text-lg font-medium">{message.text}</p>
              
              {message.mathResult && (
                <MathResultDisplay result={message.mathResult} />
              )}
              
              {message.type === 'file' && message.fileUrl && (
                <div className="bg-white/10 p-2 rounded mb-2">
                  <a 
                    href={message.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Paperclip className="h-4 w-4" />
                    {message.fileName || 'Attachment'}
                  </a>
                </div>
              )}
              <div className="flex items-center justify-between">
                {message.audioUrl && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-white/30 hover:bg-white/10"
                    onClick={() => message.isPlaying 
                      ? onPauseAudio(message.id!)
                      : onPlayAudio(message.id!)
                    }
                  >
                    {message.isPlaying ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Play
                      </>
                    )}
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  <span className="text-xs text-white/50">
                    ({message.tokenCount || 0} tokens)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default MessageList;
