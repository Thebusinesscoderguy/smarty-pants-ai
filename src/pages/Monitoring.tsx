import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, Users, TrendingUp, Clock, Activity, Target, Book, Award, Brain, Shield, Zap, Calendar, Trophy, AlertCircle, Wifi, Database, Heart, GraduationCap, Plus, MessageSquare, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserRole } from '@/hooks/useUserRole';
import { useUnifiedMonitoring } from '@/hooks/useUnifiedMonitoring';
import { ComprehensiveMonitoringDashboard } from '@/components/monitoring/ComprehensiveMonitoringDashboard';
import { QuestManagement } from '@/components/admin/QuestManagement';

import { useLanguage } from '@/contexts/LanguageContext';

import { ChildrenManagement } from '@/components/onboarding/ChildrenManagement';

import { QuizPerformanceAnalytics } from '@/components/monitoring/QuizPerformanceAnalytics';

const Monitoring = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState<'chat' | 'monitoring' | 'settings'>('monitoring');
  const { t } = useLanguage();
  
  // Demo mode - no authentication restrictions for demonstration purposes
  const { studentProgress, overviewStats, loading: dataLoading } = useUnifiedMonitoring();
  
  




  const renderNavigation = () => (
    <div className="flex items-center justify-center space-x-2 bg-muted/50 rounded-2xl p-2 border border-border mb-8">
      <Button
        variant={currentPage === 'monitoring' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentPage('monitoring')}
        className={`${currentPage === 'monitoring' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'} transition-all duration-200 rounded-xl px-6 py-3`}
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        {t('monitoring.nav.monitoring')}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="px-6 py-12 max-w-7xl mx-auto">
        {/* Navigation */}
        {renderNavigation()}
        
        <div className="mb-12">
          <h1 className="text-6xl font-bold mb-6 text-foreground flex items-center">
            <BarChart3 className="mr-6 h-16 w-16 text-primary" />
            {t('monitoring.title')}
          </h1>
          <p className="text-muted-foreground text-2xl">
            {t('monitoring.subtitle')}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">


          <Card className="bg-card border-border rounded-2xl hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{t('monitoring.metrics.studyTime')}</p>
                  <p className="text-foreground text-3xl font-bold">{overviewStats.totalStudyTime}h</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border rounded-2xl hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{t('monitoring.metrics.avgCompletion')}</p>
                  <p className="text-foreground text-3xl font-bold">{overviewStats.avgCompletion}%</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>


          <Card className="bg-card border-border rounded-2xl hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{t('monitoring.metrics.quests')}</p>
                  <p className="text-foreground text-3xl font-bold">{overviewStats.totalQuests}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>


          <Card className="bg-card border-border rounded-2xl hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{t('monitoring.metrics.lessonsCompleted')}</p>
                  <p className="text-foreground text-3xl font-bold">{overviewStats.totalLessonsCompleted}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Book className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 rounded-xl p-2 mb-8 border border-border">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('monitoring.tabs.overview')}
            </TabsTrigger>
            <TabsTrigger 
              value="children" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <Users className="h-4 w-4 mr-2" />
              {t('monitoring.tabs.children')}
            </TabsTrigger>
            <TabsTrigger 
              value="quests" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <Target className="h-4 w-4 mr-2" />
              {t('monitoring.tabs.quests')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <QuizPerformanceAnalytics studentProgress={studentProgress} />
          </TabsContent>

          <TabsContent value="children" className="space-y-6">
            <ChildrenManagement onComplete={() => navigate('/monitoring')} />
          </TabsContent>



          <TabsContent value="quests" className="space-y-8">
            <QuestManagement />
          </TabsContent>


        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Monitoring;
