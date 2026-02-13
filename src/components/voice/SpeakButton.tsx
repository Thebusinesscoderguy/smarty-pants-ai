import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Square, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SpeakButtonProps {
  text: string;
  voice?: string;
  size?: 'sm' | 'default' | 'icon';
  variant?: 'ghost' | 'outline' | 'default';
  className?: string;
  label?: string;
}

export const SpeakButton = ({
  text,
  voice = 'alloy',
  size = 'icon',
  variant = 'ghost',
  className,
  label,
}: SpeakButtonProps) => {
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setState('idle');
  };

  const speak = async () => {
    if (state === 'playing') {
      stop();
      return;
    }
    if (!text.trim()) return;

    setState('loading');
    try {
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: { text: text.slice(0, 300), voice },
      });

      if (error || !data?.audioContent) {
        throw new Error(error?.message || 'No audio returned');
      }

      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => setState('idle');
      audio.onerror = () => setState('idle');

      await audio.play();
      setState('playing');
    } catch (e) {
      console.error('TTS error:', e);
      setState('idle');
    }
  };

  const icon =
    state === 'loading' ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : state === 'playing' ? (
      <Square className="h-3.5 w-3.5" />
    ) : (
      <Volume2 className="h-4 w-4" />
    );

  return (
    <Button
      variant={variant}
      size={size}
      onClick={speak}
      disabled={state === 'loading'}
      className={cn('shrink-0', className)}
      title={state === 'playing' ? 'Stop' : 'Listen'}
    >
      {icon}
      {label && <span className="ml-1.5">{label}</span>}
    </Button>
  );
};
