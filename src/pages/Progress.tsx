
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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      
      <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Learning Progress</h1>
            <p className="text-gray-400">
              {user ? 
                "Track your achievements, monitor progress, and customize your learning experience." :
                "Demo: See how you can track achievements, monitor progress, and customize your learning experience."
              }
            </p>
            {!user && (
              <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-200 text-sm">
                  🚀 This is a demo showing sample progress data. Sign up to track your actual learning progress!
                </p>
              </div>
            )}
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
