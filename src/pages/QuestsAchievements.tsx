import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StudentQuestDisplay } from '@/components/student/StudentQuestDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Target, BookOpen, MessageCircle, Plus, List } from 'lucide-react';
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
      <div className="flex gap-2 bg-muted/50 backdrop-blur-xl p-2 rounded-lg border border-border">
        <Button
          onClick={() => navigate('/quiz-generator')}
          variant="ghost"
          size="sm"
          className="text-foreground hover:bg-muted"
        >
          <BookOpen className="mr-2 h-4 w-4" />
            Study Tools
        </Button>
        <Button
          onClick={() => navigate('/chat')}
          variant="ghost"
          size="sm"
          className="text-foreground hover:bg-muted"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
            Chat
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-foreground bg-muted"
          disabled
        >
          <Trophy className="mr-2 h-4 w-4" />
            Quests
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Navigation */}
          {renderNavigation()}
          
          {/* Page Header - Always consistent */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Quests</h1>
            <p className="text-xl text-muted-foreground">Complete quests to earn rewards and track your progress</p>
          </div>

          {/* Quest Actions */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => navigate('/quests/create')}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Made by Me
            </Button>
            <Button
              onClick={() => navigate('/quests/ai-generate')}
              className="bg-primary hover:bg-primary/90"
            >
              <Target className="mr-2 h-4 w-4" />
              Made by AI
            </Button>
            <Button
              onClick={() => navigate('/quests/made-by-me')}
              variant="outline"
              className="border-border text-foreground hover:bg-muted"
            >
              <List className="mr-2 h-4 w-4" />
              View My Quests
            </Button>
          </div>

          {/* Quests Section */}
          <Card className="bg-card border-border backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Target className="h-6 w-6 text-primary" />
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