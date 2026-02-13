import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const VOICE_OPTIONS = [
  { value: 'alloy', label: 'Alloy' },
  { value: 'echo', label: 'Echo' },
  { value: 'fable', label: 'Fable' },
  { value: 'onyx', label: 'Onyx' },
  { value: 'nova', label: 'Nova' },
  { value: 'shimmer', label: 'Shimmer' },
];

interface TTSSettingsBarProps {
  voice: string;
  onVoiceChange: (voice: string) => void;
}

export const TTSSettingsBar = ({ voice, onVoiceChange }: TTSSettingsBarProps) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
      <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {isArabic ? 'صوت القراءة:' : 'Voice:'}
      </span>
      <Select value={voice} onValueChange={onVoiceChange}>
        <SelectTrigger className="h-7 w-[110px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {VOICE_OPTIONS.map((v) => (
            <SelectItem key={v.value} value={v.value} className="text-xs">
              {v.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
