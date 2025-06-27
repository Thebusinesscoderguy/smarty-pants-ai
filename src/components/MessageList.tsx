
import { UserCircle2, Paperclip, Play, Pause, User } from 'lucide-react';
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
    <div className="space-y-6 py-4">
      {messages.map((message, index) => (
        <div 
          key={message.id || index}
          className={`flex w-full ${message.isFromUser ? 'justify-start' : 'justify-end'}`}
        >
          <div className={`flex items-start gap-3 max-w-[80%] ${message.isFromUser ? 'flex-row' : 'flex-row-reverse'}`}>
            {/* Avatar */}
            <div className="flex-shrink-0">
              {message.isFromUser ? (
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-300" />
                </div>
              ) : (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  AI
                </div>
              )}
            </div>
            
            {/* Message Content */}
            <div className={`flex flex-col ${message.isFromUser ? 'items-start' : 'items-end'}`}>
              <div 
                className={`p-4 rounded-2xl max-w-full ${
                  message.isFromUser 
                    ? 'bg-gray-700 text-white rounded-tl-sm' 
                    : 'bg-blue-600 text-white rounded-tr-sm'
                }`}
              >
                <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                  {message.text}
                </p>
                
                {message.type === 'file' && message.fileUrl && (
                  <div className="bg-black/10 p-3 rounded-lg mt-3">
                    <a 
                      href={message.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-200 hover:text-blue-100 hover:underline flex items-center gap-2"
                    >
                      <Paperclip className="h-4 w-4" />
                      {message.fileName || 'Attachment'}
                    </a>
                  </div>
                )}
              </div>
              
              {/* Message Footer */}
              <div className={`flex items-center gap-3 mt-2 px-1 ${message.isFromUser ? 'flex-row' : 'flex-row-reverse'}`}>
                {message.audioUrl && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 px-3 hover:bg-gray-700/50 text-gray-400 hover:text-white"
                    onClick={() => message.isPlaying 
                      ? onPauseAudio(message.id!)
                      : onPlayAudio(message.id!)
                    }
                  >
                    {message.isPlaying ? (
                      <>
                        <Pause className="h-3 w-3 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Play
                      </>
                    )}
                  </Button>
                )}
                
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {!message.isFromUser && (
                    <span>({message.tokenCount || 0} tokens)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
