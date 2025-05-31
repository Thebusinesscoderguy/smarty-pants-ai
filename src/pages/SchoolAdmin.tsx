
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StudentManagement } from '@/components/admin/StudentManagement';
import { QuestManagement } from '@/components/admin/QuestManagement';
import { AchievementManagement } from '@/components/admin/AchievementManagement';
import { SchoolOverview } from '@/components/admin/SchoolOverview';
import { Users, Target, Trophy, BarChart3 } from 'lucide-react';

const SchoolAdmin = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      
      <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">School Administration</h1>
            <p className="text-gray-400">
              Manage students, create quests, track achievements, and monitor progress
            </p>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/10">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white/20">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="students" className="data-[state=active]:bg-white/20">
                <Users className="h-4 w-4 mr-2" />
                Students
              </TabsTrigger>
              <TabsTrigger value="quests" className="data-[state=active]:bg-white/20">
                <Target className="h-4 w-4 mr-2" />
                Quests
              </TabsTrigger>
              <TabsTrigger value="achievements" className="data-[state=active]:bg-white/20">
                <Trophy className="h-4 w-4 mr-2" />
                Achievements
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="overview" className="space-y-6">
                <SchoolOverview />
              </TabsContent>

              <TabsContent value="students" className="space-y-6">
                <StudentManagement />
              </TabsContent>

              <TabsContent value="quests" className="space-y-6">
                <QuestManagement />
              </TabsContent>

              <TabsContent value="achievements" className="space-y-6">
                <AchievementManagement />
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
