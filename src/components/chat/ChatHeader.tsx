
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
    <div className="bg-gray-800 border-b border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="md:hidden p-2 hover:bg-gray-700 rounded-lg text-gray-300"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <h1 className="text-lg font-semibold text-white">{t('chatHeader.aiAssistant')}</h1>
        </div>
        {activeCurriculum && (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            {activeCurriculum.subjects?.name || activeCurriculum.title}
          </Badge>
        )}
      </div>
    </div>
  );
};
