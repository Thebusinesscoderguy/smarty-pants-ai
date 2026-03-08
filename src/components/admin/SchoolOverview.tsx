
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Target, Trophy, BookOpen, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface OverviewStats {
  totalInvitations: number;
  activeInvitations: number;
  totalQuests: number;
  activeQuests: number;
  totalAchievements: number;
  totalSubjects: number;
}

export const SchoolOverview = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<OverviewStats>({
    totalInvitations: 0,
    activeInvitations: 0,
    totalQuests: 0,
    activeQuests: 0,
    totalAchievements: 0,
    totalSubjects: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOverviewStats();
  }, []);

  const fetchOverviewStats = async () => {
    try {
      setIsLoading(true);

      const { data: invitations } = await supabase
        .from('student_invitations')
        .select('used');

      const { data: quests } = await supabase
        .from('quests')
        .select('is_active');

      const achievements: any[] = [];

      const { data: subjects } = await supabase
        .from('subjects')
        .select('id');

      setStats({
        totalInvitations: invitations?.length || 0,
        activeInvitations: invitations?.filter(inv => !inv.used).length || 0,
        totalQuests: quests?.length || 0,
        activeQuests: quests?.filter(quest => quest.is_active).length || 0,
        totalAchievements: 0,
        totalSubjects: subjects?.length || 0
      });
    } catch (error) {
      console.error('Error fetching overview stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">{t('adminOverview.loadingOverview')}</div>;
  }

  const statCards = [
    {
      title: t('adminOverview.studentInvitations'),
      value: stats.totalInvitations,
      subtitle: `${stats.activeInvitations} ${t('adminOverview.pending')}`,
      icon: Users,
    },
    {
      title: t('adminOverview.activeQuests'),
      value: stats.activeQuests,
      subtitle: `${stats.totalQuests} ${t('adminOverview.totalCreated')}`,
      icon: Target,
    },
    {
      title: t('adminOverview.achievements'),
      value: 0,
      subtitle: t('adminOverview.systemDisabled'),
      icon: Trophy,
    },
    {
      title: t('adminOverview.subjects'),
      value: stats.totalSubjects,
      subtitle: t('adminOverview.learningAreas'),
      icon: BookOpen,
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('adminOverview.title')}</h2>
        <p className="text-muted-foreground">{t('adminOverview.subtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Card key={index} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <card.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground/70">{card.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              {t('adminOverview.recentActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">{t('adminOverview.systemInitialized')}</span>
                <Badge variant="secondary">{t('adminOverview.today')}</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">{t('adminOverview.defaultQuestsCreated')}</span>
                <Badge variant="secondary">{t('adminOverview.today')}</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">{t('adminOverview.achievementSystemReady')}</span>
                <Badge variant="secondary">{t('adminOverview.today')}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              {t('adminOverview.gettingStarted')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">{t('adminOverview.setupSchoolProfile')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-muted-foreground">{t('adminOverview.inviteFirstStudents')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-muted-foreground">{t('adminOverview.createCustomQuests')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-muted-foreground/50 rounded-full"></div>
                <span className="text-muted-foreground">{t('adminOverview.monitorStudentProgress')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
