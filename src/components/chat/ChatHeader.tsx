
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatHeaderProps {
  activeCurriculum: any;
  onToggleSidebar: () => void;
}

export const ChatHeader = ({ activeCurriculum, onToggleSidebar }: ChatHeaderProps) => {
  const { t } = useLanguage();
  
  return (
    <div className="bg-card border-b border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="md:hidden p-2 hover:bg-muted rounded-lg text-muted-foreground"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">AI</span>
          </div>
          <h1 className="text-lg font-semibold text-foreground">{t('chatHeader.aiAssistant')}</h1>
        </div>
        {activeCurriculum && (
          <Badge className="bg-primary/10 text-primary border-primary/20">
            {activeCurriculum.subjects?.name || activeCurriculum.title}
          </Badge>
        )}
      </div>
    </div>
  );
};
