import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StudentQuestDisplay } from '@/components/student/StudentQuestDisplay';
import { StudentAchievements } from '@/components/student/StudentAchievements';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

const QuestsAchievements = () => {
  const { user } = useAuth();
  const { userRole } = useUserRole();
  
  // Get effective role (session role or stored role)
  const sessionRole = typeof window !== 'undefined' 
    ? (localStorage.getItem('sessionRole') as 'student' | 'parent' | 'teacher' | null)
    : null;
  const effectiveRole = sessionRole ?? userRole;

  // Redirect only if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-white">
              {effectiveRole === 'parent' ? 'Children\'s Quests & Achievements' : 'Quests & Achievements'}
            </h1>
            <p className="text-xl text-white/80">
              {effectiveRole === 'parent' 
                ? 'Monitor your children\'s learning journey and celebrate their progress'
                : 'Track your learning journey and celebrate your progress'
              }
            </p>
          </div>

          {/* Quests Section */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Target className="h-6 w-6 text-purple-400" />
                {effectiveRole === 'parent' ? 'Children\'s Quests' : 'Your Quests'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StudentQuestDisplay />
            </CardContent>
          </Card>

          {/* Achievements Section */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Trophy className="h-6 w-6 text-yellow-400" />
                {effectiveRole === 'parent' ? 'Children\'s Achievements' : 'Your Achievements'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StudentAchievements />
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default QuestsAchievements;