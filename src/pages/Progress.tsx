
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
import { DemoParentDashboard } from '@/components/demo/DemoParentDashboard';
import { DemoQuestDisplay } from '@/components/demo/DemoQuestDisplay';
import { DemoAchievements } from '@/components/demo/DemoAchievements';
import { DemoSubjectProgress } from '@/components/demo/DemoSubjectProgress';
import { DemoAnalytics } from '@/components/demo/DemoAnalytics';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Progress = () => {
  const { user, isSchoolAdmin, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<'student' | 'parent' | 'teacher' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Progress: Component mounted with auth state:', {
      hasUser: !!user,
      authLoading,
      userId: user?.id,
      isSchoolAdmin
    });

    if (!authLoading) {
      if (user) {
        fetchUserRole();
      } else {
        console.log('Progress: No user found, using demo data');
        setUserRole('parent'); // Default to parent for demo
        setIsLoading(false);
      }
    }
  }, [user, authLoading, isSchoolAdmin]);

  const fetchUserRole = async () => {
    try {
      console.log('Progress: Fetching user role for user:', user?.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Progress: Error fetching user role:', error);
        throw error;
      }
      
      const finalRole = isSchoolAdmin ? 'teacher' : data?.role || 'student';
      console.log('Progress: User role determined:', finalRole);
      setUserRole(finalRole);
    } catch (error: any) {
      console.error('Error fetching user role:', error);
      setUserRole('student'); // Default fallback
    } finally {
      setIsLoading(false);
    }
  };

  const renderMonitoringTab = () => {
    if (!user) {
      // Demo version - show parent dashboard
      return <DemoParentDashboard />;
    }
    
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

  // Show loading while auth is loading or we're fetching user role
  if (authLoading || isLoading) {
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
            <h1 className="text-3xl font-bold mb-2">
              {user ? 'Learning Dashboard' : 'Parent Dashboard Demo'}
            </h1>
            <p className="text-gray-400">
              {user ? 
                "Track your quests, monitor progress, and see your learning analytics." :
                "See how you can monitor your child's learning progress, quests, and achievements."
              }
            </p>
            {!user && (
              <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-200 text-sm">
                  📊 This is a demo showing Emma Johnson's learning progress. Sign up to track your child's actual progress!
                </p>
              </div>
            )}
          </div>

          <Tabs defaultValue="monitoring" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-white/10">
              <TabsTrigger value="monitoring" className="data-[state=active]:bg-white/20">
                {!user ? 'Overview' : (userRole === 'parent' ? 'Child Progress' : 'Monitoring')}
              </TabsTrigger>
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
            </TabsList>

            <div className="mt-6">
              <TabsContent value="monitoring" className="space-y-6">
                {renderMonitoringTab()}
              </TabsContent>

              <TabsContent value="quests" className="space-y-6">
                {user ? (
                  <StudentQuestDisplay />
                ) : (
                  <DemoQuestDisplay />
                )}
              </TabsContent>

              <TabsContent value="achievements" className="space-y-6">
                {user ? (
                  <StudentAchievements />
                ) : (
                  <DemoAchievements />
                )}
              </TabsContent>

              <TabsContent value="subjects" className="space-y-6">
                {user ? (
                  <SubjectProgress />
                ) : (
                  <DemoSubjectProgress />
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                {user ? (
                  <StrengthsWeaknesses />
                ) : (
                  <DemoAnalytics />
                )}
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
