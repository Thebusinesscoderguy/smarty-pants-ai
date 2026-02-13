import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X, GraduationCap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SpeakButton } from '@/components/voice/SpeakButton';
import { TTSSettingsBar } from '@/components/voice/TTSSettingsBar';

export interface Slide {
  title: string;
  bullets: string[];
  type: 'title' | 'content' | 'quiz' | 'summary';
  icon: string;
}

interface SlideViewerProps {
  slides: Slide[];
  title: string;
  topic?: string;
  onClose?: () => void;
}

const TYPE_GRADIENTS: Record<string, string> = {
  title: 'from-primary/20 via-accent/10 to-background',
  content: 'from-background to-muted/30',
  quiz: 'from-destructive/10 via-background to-muted/20',
  summary: 'from-primary/10 via-muted/20 to-background',
};

export const SlideViewer = ({ slides, title, topic, onClose }: SlideViewerProps) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isArabic = language === 'ar';
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ttsVoice, setTtsVoice] = useState('alloy');

  const isLastSlide = current === slides.length - 1;

  const slide = slides[current];

  const prev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent((c) => Math.min(slides.length - 1, c + 1)), [slides.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, isFullscreen]);

  const toggleFullscreen = () => setIsFullscreen((f) => !f);

  return (
    <div
      className={cn(
        'flex flex-col',
        isFullscreen
          ? 'fixed inset-0 z-50 bg-background'
          : 'rounded-xl border border-border overflow-hidden'
      )}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
        <span className="text-sm font-medium text-muted-foreground truncate max-w-[60%]">
          {title}
        </span>
        <div className="flex items-center gap-2">
          <TTSSettingsBar voice={ttsVoice} onVoiceChange={setTtsVoice} />
          <span className="text-xs text-muted-foreground px-2">
            {current + 1} / {slides.length}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Slide area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 min-h-[400px] relative overflow-hidden">
        {/* Background gradient */}
        <div className={cn('absolute inset-0 bg-gradient-to-br', TYPE_GRADIENTS[slide.type] || TYPE_GRADIENTS.content)} />

        <div className="relative z-10 w-full max-w-3xl mx-auto animate-fade-in" key={current}>
          {/* Icon */}
          <div className="text-5xl sm:text-6xl mb-6 text-center">{slide.icon}</div>

          {/* Title */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <h2
              className={cn(
                'font-bold text-center',
                slide.type === 'title'
                  ? 'text-3xl sm:text-4xl lg:text-5xl text-foreground'
                  : 'text-2xl sm:text-3xl text-foreground'
              )}
            >
              {slide.title}
            </h2>
            <SpeakButton
              text={`${slide.title}. ${slide.bullets.join('. ')}`}
              voice={ttsVoice}
              size="sm"
              variant="outline"
              className="rounded-full h-8 w-8 p-0"
            />
          </div>

          {/* Bullets */}
          <ul className="space-y-4 max-w-2xl mx-auto">
            {slide.bullets.map((bullet, i) => (
              <li
                key={i}
                className={cn(
                  'flex items-start gap-3 text-base sm:text-lg text-foreground/90',
                  slide.type === 'title' && i === 0 && 'text-center justify-center text-muted-foreground text-xl'
                )}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {!(slide.type === 'title' && i === 0) && (
                  <span className="shrink-0 mt-1 w-2 h-2 rounded-full bg-primary" />
                )}
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          {isLastSlide && topic && (
            <div className="flex justify-center mt-8">
              <Button
                size="lg"
                className="gap-2"
                onClick={() => navigate(`/quiz-generator?auto=quiz&type=topic&input=${encodeURIComponent(topic)}&method=topic`)}
              >
                <GraduationCap className="h-5 w-5" />
                {isArabic ? 'ابدأ اختباراً حول هذا الموضوع' : 'Take a Quiz on This Topic'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card/80 backdrop-blur-sm shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={prev}
          disabled={current === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          {isArabic ? 'السابق' : 'Previous'}
        </Button>

        {/* Dots */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[60%] px-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'shrink-0 rounded-full transition-all duration-200',
                i === current
                  ? 'w-6 h-2.5 bg-primary'
                  : 'w-2.5 h-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={next}
          disabled={current === slides.length - 1}
          className="gap-1"
        >
          {isArabic ? 'التالي' : 'Next'}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
