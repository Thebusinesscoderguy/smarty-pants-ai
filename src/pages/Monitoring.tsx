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
    <div className="flex items-center justify-center space-x-2 bg-white/5 rounded-2xl p-2 backdrop-blur-xl border border-white/10 mb-8">
      <Button
        variant={currentPage === 'monitoring' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentPage('monitoring')}
        className={`${currentPage === 'monitoring' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-white hover:bg-white/10'} transition-all duration-200 rounded-xl px-6 py-3`}
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        {t('monitoring.nav.monitoring')}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <Header />
      
      <main className="px-6 py-12 max-w-7xl mx-auto">
        {/* Navigation */}
        {renderNavigation()}
        
        <div className="mb-12">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center">
            <BarChart3 className="mr-6 h-16 w-16 text-purple-400" />
            {t('monitoring.title')}
          </h1>
          <p className="text-white/70 text-2xl">
            {t('monitoring.subtitle')}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">


          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm font-medium">{t('monitoring.metrics.studyTime')}</p>
                  <p className="text-white text-3xl font-bold">{overviewStats.totalStudyTime}h</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Clock className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/30 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-200 text-sm font-medium">{t('monitoring.metrics.avgCompletion')}</p>
                  <p className="text-white text-3xl font-bold">{overviewStats.avgCompletion}%</p>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <Target className="h-6 w-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>


          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/30 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-200 text-sm font-medium">{t('monitoring.metrics.quests')}</p>
                  <p className="text-white text-3xl font-bold">{overviewStats.totalQuests}</p>
                </div>
                <div className="p-3 bg-yellow-500/20 rounded-xl">
                  <Target className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>


          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/30 backdrop-blur-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-200 text-sm font-medium">{t('monitoring.metrics.lessonsCompleted')}</p>
                  <p className="text-white text-3xl font-bold">{overviewStats.totalLessonsCompleted}</p>
                </div>
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <Book className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-sm rounded-xl p-2 mb-8 border border-white/20">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('monitoring.tabs.overview')}
            </TabsTrigger>
            <TabsTrigger 
              value="children" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center font-semibold"
            >
              <Users className="h-4 w-4 mr-2" />
              {t('monitoring.tabs.children')}
            </TabsTrigger>
            <TabsTrigger 
              value="quests" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center font-semibold"
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
