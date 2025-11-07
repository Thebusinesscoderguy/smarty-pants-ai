
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

      // Fetch invitation stats
      const { data: invitations } = await supabase
        .from('student_invitations')
        .select('used');

      // Fetch quest stats
      const { data: quests } = await supabase
        .from('quests')
        .select('is_active');

      // Fetch achievement count - removed (achievements system disabled)
      const achievements: any[] = [];

      // Fetch subject count
      const { data: subjects } = await supabase
        .from('subjects')
        .select('id');

      setStats({
        totalInvitations: invitations?.length || 0,
        activeInvitations: invitations?.filter(inv => !inv.used).length || 0,
        totalQuests: quests?.length || 0,
        activeQuests: quests?.filter(quest => quest.is_active).length || 0,
        totalAchievements: 0, // Achievements system removed
        totalSubjects: subjects?.length || 0
      });
    } catch (error) {
      console.error('Error fetching overview stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">{t('adminOverview.loadingOverview')}</div>;
  }

  const statCards = [
    {
      title: t('adminOverview.studentInvitations'),
      value: stats.totalInvitations,
      subtitle: `${stats.activeInvitations} ${t('adminOverview.pending')}`,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: t('adminOverview.activeQuests'),
      value: stats.activeQuests,
      subtitle: `${stats.totalQuests} ${t('adminOverview.totalCreated')}`,
      icon: Target,
      color: 'bg-purple-500'
    },
    {
      title: t('adminOverview.achievements'),
      value: 0,
      subtitle: t('adminOverview.systemDisabled'),
      icon: Trophy,
      color: 'bg-gray-500'
    },
    {
      title: t('adminOverview.subjects'),
      value: stats.totalSubjects,
      subtitle: t('adminOverview.learningAreas'),
      icon: BookOpen,
      color: 'bg-green-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('adminOverview.title')}</h2>
        <p className="text-gray-400">{t('adminOverview.subtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Card key={index} className="bg-white/10 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${card.color}/20`}>
                  <card.icon className={`h-6 w-6 ${card.color.replace('bg-', 'text-')}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">{card.title}</p>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                  <p className="text-xs text-gray-500">{card.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-gray-300">System initialized</span>
                <Badge variant="secondary">Today</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-gray-300">Default quests created</span>
                <Badge variant="secondary">Today</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-300">Achievement system ready</span>
                <Badge variant="secondary">Today</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">Set up school profile</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-300">Invite first students</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-300">Create custom quests</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span className="text-gray-300">Monitor student progress</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
