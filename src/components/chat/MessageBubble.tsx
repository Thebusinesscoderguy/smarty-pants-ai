
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, Volume2, Copy, ThumbsUp, ThumbsDown, RotateCcw, Lightbulb, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

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
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';
  const [eli5Text, setEli5Text] = useState<string | null>(null);
  const [eli5Loading, setEli5Loading] = useState(false);

  const handleELI5 = async () => {
    if (eli5Text) { setEli5Text(null); return; }
    setEli5Loading(true);
    try {
      const { data, error } = await supabase.functions.invoke('eli5-explain', {
        body: { text: message.content }
      });
      if (error) throw error;
      setEli5Text(data?.text || 'Could not simplify.');
    } catch (e: any) {
      toast.error('Failed to simplify: ' + (e.message || 'Unknown error'));
    } finally {
      setEli5Loading(false);
    }
  };

  return (
    <div className={`flex gap-4 ${message.is_from_user ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {!message.is_from_user && (
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-semibold text-primary-foreground flex-shrink-0">
          AI
        </div>
      )}
      
      <div className={`max-w-[80%] ${message.is_from_user ? 'order-first' : ''}`}>
        <div className={`p-4 rounded-2xl ${
          message.is_from_user 
            ? `bg-primary text-primary-foreground ${isRTL ? 'mr-auto' : 'ml-auto'}` 
            : 'bg-card text-foreground border border-border'
        }`}>
          <p className="whitespace-pre-wrap leading-relaxed">{eli5Text || message.content}</p>
          
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
        
        <div className={`flex items-center gap-2 mt-2 text-xs text-muted-foreground`}>
          <span>{new Date(message.created_at).toLocaleTimeString(isRTL ? 'ar-SA' : undefined)}</span>
          {!message.is_from_user && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleELI5}
                disabled={eli5Loading}
                className="p-1 h-6 hover:bg-primary/10 text-primary gap-1 rounded-lg transition-colors"
                title="Explain Like I'm 5"
              >
                {eli5Loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3 text-primary" />}
                <span className="text-[10px]">{eli5Text ? t('eli5.original') : t('eli5.label')}</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onCopyMessage?.(message.content)}
                className="p-1 h-6 w-6 hover:bg-muted text-muted-foreground"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="p-1 h-6 w-6 hover:bg-muted text-muted-foreground">
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="p-1 h-6 w-6 hover:bg-muted text-muted-foreground">
                <ThumbsDown className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="p-1 h-6 w-6 hover:bg-muted text-muted-foreground">
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {message.is_from_user && (
        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};
