
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { ProgressDisplay } from '@/components/gamification/ProgressDisplay';
import { AchievementsList } from '@/components/gamification/AchievementsList';
import { StudentDashboard } from '@/components/monitoring/StudentDashboard';
import { GameSettings } from '@/components/gamification/GameSettings';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const Progress = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-400">Please log in to view your progress.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      
      <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Learning Progress</h1>
            <p className="text-gray-400">
              Track your achievements, monitor progress, and customize your learning experience.
            </p>
          </div>

          <Tabs defaultValue="progress" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/10">
              <TabsTrigger value="progress" className="data-[state=active]:bg-white/20">
                Progress
              </TabsTrigger>
              <TabsTrigger value="achievements" className="data-[state=active]:bg-white/20">
                Achievements
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="data-[state=active]:bg-white/20">
                Monitoring
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-white/20">
                Settings
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="progress" className="space-y-6">
                <ProgressDisplay />
              </TabsContent>

              <TabsContent value="achievements" className="space-y-6">
                <AchievementsList />
              </TabsContent>

              <TabsContent value="monitoring" className="space-y-6">
                <StudentDashboard />
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <GameSettings />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Progress;
