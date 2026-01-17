
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StudentManagement } from '@/components/admin/StudentManagement';
import { QuestManagement } from '@/components/admin/QuestManagement';
import { SchoolOverview } from '@/components/admin/SchoolOverview';
import { CurriculumManagement } from '@/components/admin/CurriculumManagement';
import { PaymentManagement } from '@/components/admin/PaymentManagement';
import { EnhancedAnalytics } from '@/components/admin/EnhancedAnalytics';
import { StudentAnalyticsView } from '@/components/admin/StudentAnalyticsView';
import { Users, Target, Trophy, BarChart3, BookOpen, CreditCard, TrendingUp, Brain } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const SchoolAdmin = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      
      <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('schoolAdmin.title')}</h1>
            <p className="text-muted-foreground">
              {t('schoolAdmin.subtitle')}
            </p>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-7 bg-muted">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart3 className="h-4 w-4 mr-2" />
                {t('schoolAdmin.tabs.overview')}
              </TabsTrigger>
              <TabsTrigger value="students" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="h-4 w-4 mr-2" />
                {t('schoolAdmin.tabs.students')}
              </TabsTrigger>
              <TabsTrigger value="curriculum" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BookOpen className="h-4 w-4 mr-2" />
                {t('schoolAdmin.tabs.curriculum')}
              </TabsTrigger>
              <TabsTrigger value="quests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Target className="h-4 w-4 mr-2" />
                {t('schoolAdmin.tabs.quests')}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <TrendingUp className="h-4 w-4 mr-2" />
                {t('schoolAdmin.tabs.analytics')}
              </TabsTrigger>
              <TabsTrigger value="student-analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Brain className="h-4 w-4 mr-2" />
                {t('schoolAdmin.tabs.studentAnalysis')}
              </TabsTrigger>
              <TabsTrigger value="billing" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <CreditCard className="h-4 w-4 mr-2" />
                {t('schoolAdmin.tabs.billing')}
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="overview" className="space-y-6">
                <SchoolOverview />
              </TabsContent>

              <TabsContent value="students" className="space-y-6">
                <StudentManagement />
              </TabsContent>

              <TabsContent value="curriculum" className="space-y-6">
                <CurriculumManagement />
              </TabsContent>

              <TabsContent value="quests" className="space-y-6">
                <QuestManagement />
              </TabsContent>


              <TabsContent value="analytics" className="space-y-6">
                <EnhancedAnalytics />
              </TabsContent>

              <TabsContent value="student-analytics" className="space-y-6">
                <StudentAnalyticsView />
              </TabsContent>

              <TabsContent value="billing" className="space-y-6">
                <PaymentManagement />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SchoolAdmin;
