import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X, GraduationCap, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SpeakButton } from '@/components/voice/SpeakButton';
import { TTSSettingsBar } from '@/components/voice/TTSSettingsBar';

interface SlideVisualComparison {
  type: 'comparison';
  headers: string[];
  rows: string[][];
}

interface SlideVisualTimeline {
  type: 'timeline';
  events: { year: string; label: string }[];
}

interface SlideVisualDiagram {
  type: 'diagram';
  center: string;
  branches: string[];
}

interface SlideVisualStats {
  type: 'stats';
  items: { value: string; label: string }[];
}

interface SlideVisualSteps {
  type: 'steps';
  items: string[];
}

interface SlideVisualCauseEffect {
  type: 'cause-effect';
  items: { cause: string; effect: string }[];
}

interface SlideVisualLabeledDiagram {
  type: 'labeled-diagram';
  title: string;
  parts: { name: string; description: string }[];
}

type SlideVisual = SlideVisualComparison | SlideVisualTimeline | SlideVisualDiagram | SlideVisualStats | SlideVisualSteps | SlideVisualCauseEffect | SlideVisualLabeledDiagram;

export interface Slide {
  title: string;
  bullets: string[];
  type: 'title' | 'content' | 'quiz' | 'summary';
  icon: string;
  visual?: SlideVisual;
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

const VisualRenderer = ({ visual }: { visual: SlideVisual }) => {
  switch (visual.type) {
    case 'comparison':
      return (
        <div className="w-full max-w-xl mx-auto rounded-xl border border-border overflow-hidden bg-card/60 backdrop-blur-sm">
          <div className="grid grid-cols-2">
            {visual.headers.map((h, i) => (
              <div key={i} className={cn("px-4 py-2.5 font-semibold text-sm text-primary-foreground bg-primary/80", i === 0 && "border-r border-primary-foreground/20")}>
                {h}
              </div>
            ))}
          </div>
          {visual.rows.map((row, ri) => (
            <div key={ri} className={cn("grid grid-cols-2 border-t border-border", ri % 2 === 0 ? "bg-muted/20" : "bg-card/40")}>
              {row.map((cell, ci) => (
                <div key={ci} className={cn("px-4 py-2.5 text-sm text-foreground/80", ci === 0 && "border-r border-border")}>
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </div>
      );

    case 'timeline':
      return (
        <div className="w-full max-w-xl mx-auto flex flex-col gap-0 relative">
          <div className="absolute left-[52px] top-3 bottom-3 w-0.5 bg-primary/30" />
          {visual.events.map((event, i) => (
            <div key={i} className="flex items-start gap-4 relative py-2">
              <span className="shrink-0 w-[44px] text-right text-xs font-bold text-primary mt-0.5">{event.year}</span>
              <div className="shrink-0 w-4 h-4 rounded-full bg-primary border-2 border-background mt-0.5 z-10" />
              <span className="text-sm text-foreground/80 leading-snug">{event.label}</span>
            </div>
          ))}
        </div>
      );

    case 'diagram':
      return (
        <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-3">
          <div className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-md">
            {visual.center}
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-1">
            {visual.branches.map((branch, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-primary/40" />
                <div className="px-4 py-2 rounded-lg bg-accent/30 border border-accent/50 text-sm text-foreground/80 font-medium">
                  {branch}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'stats':
      return (
        <div className="w-full max-w-xl mx-auto grid grid-cols-2 gap-3">
          {visual.items.map((item, i) => (
            <div key={i} className="flex flex-col items-center p-4 rounded-xl bg-card/60 border border-border backdrop-blur-sm">
              <span className="text-2xl font-bold text-primary">{item.value}</span>
              <span className="text-xs text-muted-foreground mt-1 text-center">{item.label}</span>
            </div>
          ))}
        </div>
      );

    case 'steps':
      return (
        <div className="w-full max-w-xl mx-auto flex flex-col gap-2">
          {visual.items.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="shrink-0 w-7 h-7 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center text-xs font-bold">
                {i + 1}
              </div>
              <div className="flex-1 px-3 py-2 rounded-lg bg-muted/30 border border-border text-sm text-foreground/80">
                {step}
              </div>
              {i < visual.items.length - 1 && (
                <ArrowRight className="shrink-0 h-3 w-3 text-muted-foreground/40 hidden sm:block" />
              )}
            </div>
          ))}
        </div>
      );

    case 'cause-effect':
      return (
        <div className="w-full max-w-xl mx-auto flex flex-col gap-3">
          {visual.items.map((item, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="shrink-0 px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-sm font-medium text-foreground/90 flex-1">
                  ⚡ {item.cause}
                </div>
                <ArrowRight className="shrink-0 h-4 w-4 text-primary" />
                <div className="shrink-0 px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-sm font-medium text-foreground/90 flex-1">
                  🎯 {item.effect}
                </div>
              </div>
              {i < visual.items.length - 1 && (
                <div className="flex justify-center">
                  <div className="w-0.5 h-4 bg-muted-foreground/20" />
                </div>
              )}
            </div>
          ))}
        </div>
      );

    case 'labeled-diagram':
      return (
        <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-4">
          <div className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-md">
            {visual.title}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            {visual.parts.map((part, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-card/60 border border-border backdrop-blur-sm">
                <div className="shrink-0 w-7 h-7 rounded-full bg-accent/40 border border-accent/60 flex items-center justify-center text-xs font-bold text-foreground/80">
                  {i + 1}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground/90">{part.name}</span>
                  <span className="text-xs text-muted-foreground leading-snug">{part.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
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

  const hasVisual = slide.visual && slide.type === 'content';

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
        <div className={cn('absolute inset-0 bg-gradient-to-br', TYPE_GRADIENTS[slide.type] || TYPE_GRADIENTS.content)} />

        <div className="relative z-10 w-full max-w-4xl mx-auto animate-fade-in" key={current}>
          {/* Icon */}
          <div className="text-5xl sm:text-6xl mb-6 text-center">{slide.icon}</div>

          {/* Title */}
          <div className="flex items-center justify-center gap-2 mb-6">
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

          {/* Content layout: side-by-side when visual present */}
          <div className={cn(hasVisual ? 'grid grid-cols-1 md:grid-cols-2 gap-6 items-start' : '')}>
            {/* Bullets */}
            <ul className={cn("space-y-4", hasVisual ? "max-w-none" : "max-w-2xl mx-auto")}>
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

            {/* Visual */}
            {hasVisual && slide.visual && (
              <div className="flex items-center justify-center">
                <VisualRenderer visual={slide.visual} />
              </div>
            )}
          </div>

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
