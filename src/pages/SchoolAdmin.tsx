
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StudentManagement } from '@/components/admin/StudentManagement';
import { QuestManagement } from '@/components/admin/QuestManagement';
import { AchievementManagement } from '@/components/admin/AchievementManagement';
import { SchoolOverview } from '@/components/admin/SchoolOverview';
import { CurriculumManagement } from '@/components/admin/CurriculumManagement';
import { PaymentManagement } from '@/components/admin/PaymentManagement';
import { EnhancedAnalytics } from '@/components/admin/EnhancedAnalytics';
import { Users, Target, Trophy, BarChart3, BookOpen, CreditCard, TrendingUp } from 'lucide-react';

const SchoolAdmin = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      
      <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">School Administration</h1>
            <p className="text-gray-400">
              Complete school management platform with curriculum, payments, and analytics
            </p>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-7 bg-white/10">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white/20">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="students" className="data-[state=active]:bg-white/20">
                <Users className="h-4 w-4 mr-2" />
                Students
              </TabsTrigger>
              <TabsTrigger value="curriculum" className="data-[state=active]:bg-white/20">
                <BookOpen className="h-4 w-4 mr-2" />
                Curriculum
              </TabsTrigger>
              <TabsTrigger value="quests" className="data-[state=active]:bg-white/20">
                <Target className="h-4 w-4 mr-2" />
                Quests
              </TabsTrigger>
              <TabsTrigger value="achievements" className="data-[state=active]:bg-white/20">
                <Trophy className="h-4 w-4 mr-2" />
                Achievements
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-white/20">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="billing" className="data-[state=active]:bg-white/20">
                <CreditCard className="h-4 w-4 mr-2" />
                Billing
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

              <TabsContent value="achievements" className="space-y-6">
                <AchievementManagement />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <EnhancedAnalytics />
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
