import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StudentQuestDisplay } from '@/components/student/StudentQuestDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Target, BookOpen, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';

const QuestsAchievements = () => {
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Get effective role (session role or stored role)
  const sessionRole = typeof window !== 'undefined' 
    ? (localStorage.getItem('sessionRole') as 'student' | 'parent' | 'teacher' | null)
    : null;
  const effectiveRole = sessionRole ?? userRole;

  // Redirect only if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const renderNavigation = () => (
    <div className="flex justify-center mb-8">
      <div className="flex gap-2 bg-white/10 backdrop-blur-xl p-2 rounded-lg border border-white/20">
        <Button
          onClick={() => navigate('/quiz-generator')}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
        >
          <BookOpen className="mr-2 h-4 w-4" />
            Study Tools
        </Button>
        <Button
          onClick={() => navigate('/chat')}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
            Chat
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-white bg-white/20"
          disabled
        >
          <Trophy className="mr-2 h-4 w-4" />
            Quests
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Navigation */}
          {renderNavigation()}
          
          {/* Page Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-white">Quests</h1>
            <p className="text-xl text-white/80">Complete quests to earn rewards and track your progress</p>
          </div>

          {/* Quests Section */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Target className="h-6 w-6 text-purple-400" />
                Quests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StudentQuestDisplay />
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default QuestsAchievements;