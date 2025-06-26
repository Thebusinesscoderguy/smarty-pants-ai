
import { UserCircle2, Paperclip, Play, Pause } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Message } from '../types/message';

interface MessageListProps {
  messages: Message[];
  onPlayAudio: (messageId: string) => void;
  onPauseAudio: (messageId: string) => void;
}

const MessageList = ({ messages, onPlayAudio, onPauseAudio }: MessageListProps) => {
  return (
    <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
      {messages.map((message, index) => (
        <div 
          key={index}
          className={`flex w-full ${message.isFromUser ? 'justify-start' : 'justify-end'}`}
        >
          <Card 
            className={`p-4 rounded-xl border-transparent shadow-sm transition-all duration-300 max-w-[80%]
              ${message.isFromUser 
                ? 'bg-gray-100 text-gray-900' 
                : 'bg-blue-600 text-white'}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {message.isFromUser ? (
                  <UserCircle2 className="h-8 w-8 text-gray-600" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white font-medium">
                    AI
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="mb-2 text-lg font-medium">{message.text}</p>
                
                {message.type === 'file' && message.fileUrl && (
                  <div className="bg-black/10 p-2 rounded mb-2">
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
                      className={`${message.isFromUser 
                        ? 'border-gray-300 hover:bg-gray-200 text-gray-700' 
                        : 'border-white/30 hover:bg-white/10 text-white'
                      }`}
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
                    <span className={`text-xs ${message.isFromUser ? 'text-gray-500' : 'text-white/70'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`text-xs ${message.isFromUser ? 'text-gray-500' : 'text-white/70'}`}>
                      ({message.tokenCount || 0} tokens)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
