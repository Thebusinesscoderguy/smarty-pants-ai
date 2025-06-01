
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { QuestDisplay } from '@/components/quests/QuestDisplay';
import { AchievementsList } from '@/components/gamification/AchievementsList';
import { StudentDashboard } from '@/components/monitoring/StudentDashboard';
import { ParentDashboard } from '@/components/monitoring/ParentDashboard';
import { GameSettings } from '@/components/gamification/GameSettings';
import { SubjectProgress } from '@/components/subjects/SubjectProgress';
import { StrengthsWeaknesses } from '@/components/analytics/StrengthsWeaknesses';
import { StudentQuestDisplay } from '@/components/student/StudentQuestDisplay';
import { StudentAchievements } from '@/components/student/StudentAchievements';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Progress = () => {
  const { user, isSchoolAdmin } = useAuth();
  const [userRole, setUserRole] = useState<'student' | 'parent' | 'teacher' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      // Override role if user is school admin
      setUserRole(isSchoolAdmin ? 'teacher' : data.role);
    } catch (error: any) {
      console.error('Error fetching user role:', error);
      setUserRole('student'); // Default fallback
    } finally {
      setIsLoading(false);
    }
  };

  const renderMonitoringTab = () => {
    if (userRole === 'parent') {
      return <ParentDashboard />;
    } else if (userRole === 'teacher' || isSchoolAdmin) {
      return <StudentDashboard />;
    } else {
      return (
        <div className="text-center py-8">
          <p className="text-gray-400">Monitoring dashboard not available for students.</p>
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      
      <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Learning Dashboard</h1>
            <p className="text-gray-400">
              {user ? 
                "Track your quests, monitor progress, and see your learning analytics." :
                "Demo: See how you can track quests, monitor progress, and analyze your learning."
              }
            </p>
            {!user && (
              <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-200 text-sm">
                  🚀 This is a demo showing sample learning data. Sign up to track your actual progress!
                </p>
              </div>
            )}
          </div>

          <Tabs defaultValue="quests" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-white/10">
              <TabsTrigger value="quests" className="data-[state=active]:bg-white/20">
                Quests
              </TabsTrigger>
              <TabsTrigger value="achievements" className="data-[state=active]:bg-white/20">
                Achievements
              </TabsTrigger>
              <TabsTrigger value="subjects" className="data-[state=active]:bg-white/20">
                Subjects
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-white/20">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="data-[state=active]:bg-white/20">
                {userRole === 'parent' ? 'Child Progress' : 'Monitoring'}
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="quests" className="space-y-6">
                {user ? <StudentQuestDisplay /> : <QuestDisplay />}
              </TabsContent>

              <TabsContent value="achievements" className="space-y-6">
                {user ? <StudentAchievements /> : <AchievementsList />}
              </TabsContent>

              <TabsContent value="subjects" className="space-y-6">
                <SubjectProgress />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <StrengthsWeaknesses />
              </TabsContent>

              <TabsContent value="monitoring" className="space-y-6">
                {renderMonitoringTab()}
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
