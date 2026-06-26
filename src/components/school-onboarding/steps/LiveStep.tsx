import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Users, GraduationCap, BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  schoolName: string;
  studentsImported: number;
  teachersInvited: number;
  frameworkChosen: boolean;
  onFinish: () => Promise<void>;
}

export const LiveStep = ({ schoolName, studentsImported, teachersInvited, frameworkChosen, onFinish }: Props) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [finishing, setFinishing] = useState(false);

  const handleFinish = async (target: string) => {
    setFinishing(true);
    await onFinish();
    navigate(target);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/15 to-transparent border-primary/30 text-center">
        <div className="flex justify-center mb-3">
          <div className="p-3 rounded-full bg-primary/20">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-2">{schoolName} {t('ls2.isLive')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('ls2.setupReady')}
        </p>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="p-3 rounded-lg bg-card border">
            <Users className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{studentsImported}</p>
            <p className="text-xs text-muted-foreground">{t('ls2.students')}</p>
          </div>
          <div className="p-3 rounded-lg bg-card border">
            <GraduationCap className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{teachersInvited}</p>
            <p className="text-xs text-muted-foreground">{t('ls2.teachers')}</p>
          </div>
          <div className="p-3 rounded-lg bg-card border">
            <BookOpen className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{frameworkChosen ? '✓' : '—'}</p>
            <p className="text-xs text-muted-foreground">{t('ls2.curriculum')}</p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <Sparkles className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h4 className="font-semibold">{t('ls2.howJoin')}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('ls2.howJoinDescPre')} <span className="font-mono">/auth</span> {t('ls2.howJoinDescPost')}
            </p>
          </div>
        </div>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <Badge variant="outline" className="shrink-0">1</Badge>
            <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" /><strong className="text-foreground">{t('ls2.studentsLabel')}</strong> {t('ls2.studentsStep')}</span>
          </li>
          <li className="flex gap-3">
            <Badge variant="outline" className="shrink-0">2</Badge>
            <span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5 text-primary" /><strong className="text-foreground">{t('ls2.teachersLabel')}</strong> {t('ls2.teachersStep')}</span>
          </li>
          <li className="flex gap-3">
            <Badge variant="outline" className="shrink-0">3</Badge>
            <span><strong className="text-foreground">{t('ls2.parentsLabel')}</strong> {t('ls2.parentsStep')}</span>
          </li>
        </ol>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          className="flex-1"
          disabled={finishing}
          onClick={() => handleFinish('/news')}
        >
          {t('ls2.sendWelcome')}
        </Button>
        <Button
          className="flex-1"
          disabled={finishing}
          onClick={() => handleFinish('/school-admin')}
        >
          {t('ls2.goToDashboard')} <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
