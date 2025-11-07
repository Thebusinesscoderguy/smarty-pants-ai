
import { Button } from '@/components/ui/button';
import { User, Volume2, Copy, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';

interface DatabaseMessage {
  id: string;
  content: string;
  is_from_user: boolean;
  created_at: string;
  audioUrl?: string;
}

interface MessageBubbleProps {
  message: DatabaseMessage;
  onPlayAudio?: (audioUrl: string) => void;
  onCopyMessage?: (content: string) => void;
}

export const MessageBubble = ({ message, onPlayAudio, onCopyMessage }: MessageBubbleProps) => {
  return (
    <div className={`flex gap-4 ${message.is_from_user ? 'justify-end' : 'justify-start'}`}>
      {!message.is_from_user && (
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
          AI
        </div>
      )}
      
      <div className={`max-w-[80%] ${message.is_from_user ? 'order-first' : ''}`}>
        <div className={`p-4 rounded-2xl ${
          message.is_from_user 
            ? 'bg-primary text-primary-foreground ml-auto' 
            : 'bg-card text-foreground border border-border'
        }`}>
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          
          {message.audioUrl && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onPlayAudio?.(message.audioUrl!)}
              className="mt-2 p-1 hover:bg-muted text-muted-foreground"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <span>{new Date(message.created_at).toLocaleTimeString()}</span>
          {!message.is_from_user && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onCopyMessage?.(message.content)}
                className="p-1 h-6 w-6 hover:bg-gray-700 text-gray-400"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="p-1 h-6 w-6 hover:bg-gray-700 text-gray-400"
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="p-1 h-6 w-6 hover:bg-gray-700 text-gray-400"
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="p-1 h-6 w-6 hover:bg-gray-700 text-gray-400"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {message.is_from_user && (
        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-gray-300" />
        </div>
      )}
    </div>
  );
};
