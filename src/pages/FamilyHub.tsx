import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Award, 
  FileQuestion, 
  Calendar,
  Star,
  Brain,
  Target,
  Zap,
  Clock,
  PlayCircle,
  CheckCircle,
  Heart,
  Sparkles
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

interface StudentOverview {
  id: string;
  name: string;
  avatar?: string;
  currentStreak: number;
  weeklyGoal: number;
  weeklyProgress: number;
  recentAchievements: string[];
  activeQuests: number;
  completedLessons: number;
  totalLessons: number;
  strongSubjects: string[];
  improvementAreas: string[];
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  action: () => void;
}

const FamilyHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [students, setStudents] = useState<StudentOverview[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // Demo data for now
  useEffect(() => {
    const demoStudents: StudentOverview[] = [
      {
        id: '1',
        name: 'Emma',
        currentStreak: 5,
        weeklyGoal: 7,
        weeklyProgress: 5,
        recentAchievements: ['Math Champion', 'Reading Star'],
        activeQuests: 3,
        completedLessons: 12,
        totalLessons: 20,
        strongSubjects: ['Mathematics', 'Science'],
        improvementAreas: ['Writing', 'History']
      },
      {
        id: '2',
        name: 'Alex',
        currentStreak: 3,
        weeklyGoal: 5,
        weeklyProgress: 3,
        recentAchievements: ['Science Explorer'],
        activeQuests: 2,
        completedLessons: 8,
        totalLessons: 15,
        strongSubjects: ['Science', 'Art'],
        improvementAreas: ['Math', 'Reading']
      }
    ];
    setStudents(demoStudents);
    setSelectedStudent(demoStudents[0]?.id || null);
  }, []);

  const currentStudent = students.find(s => s.id === selectedStudent) || students[0];

  const quickActions: QuickAction[] = [
    {
      id: 'upload-quiz',
      title: 'Upload Quiz Results',
      description: 'Get personalized study plans from quiz mistakes',
      icon: FileQuestion,
      color: 'from-blue-500 to-purple-600',
      action: () => navigate('/quiz-generator', { state: { tab: 'study-plan' } })
    },
    {
      id: 'create-quiz',
      title: 'Generate Practice Quiz',
      description: 'AI creates quizzes based on weak areas',
      icon: Brain,
      color: 'from-green-500 to-emerald-600',
      action: () => navigate('/quiz-generator', { state: { tab: 'generate' } })
    },
    {
      id: 'voice-chat',
      title: 'Voice Learning Session',
      description: 'Interactive AI tutoring with voice',
      icon: PlayCircle,
      color: 'from-purple-500 to-pink-600',
      action: () => navigate('/chat')
    },
    {
      id: 'progress-review',
      title: 'Review Progress',
      description: 'Detailed analytics and insights',
      icon: TrendingUp,
      color: 'from-violet-500 to-red-600',
      action: () => navigate('/progress')
    }
  ];

  const renderStudentSelector = () => (
    <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="h-5 w-5" />
          Family Learning Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 mb-4">
          {students.map((student) => (
            <Button
              key={student.id}
              variant={selectedStudent === student.id ? 'default' : 'outline'}
              onClick={() => setSelectedStudent(student.id)}
              className={`${
                selectedStudent === student.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'border-white/20 text-white hover:bg-white/10'
              } transition-all duration-200`}
            >
              {student.name}
            </Button>
          ))}
        </div>
        
        {currentStudent && (
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">{currentStudent.name}'s Learning Journey</h3>
              <Badge className="bg-yellow-500/20 text-yellow-400">
                🔥 {currentStudent.currentStreak} day streak
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/70 text-sm mb-1">Weekly Progress</p>
                <Progress 
                  value={(currentStudent.weeklyProgress / currentStudent.weeklyGoal) * 100} 
                  className="h-2 mb-1"
                />
                <p className="text-white text-sm">{currentStudent.weeklyProgress}/{currentStudent.weeklyGoal} sessions</p>
              </div>
              <div>
                <p className="text-white/70 text-sm mb-1">Course Progress</p>
                <Progress 
                  value={(currentStudent.completedLessons / currentStudent.totalLessons) * 100} 
                  className="h-2 mb-1"
                />
                <p className="text-white text-sm">{currentStudent.completedLessons}/{currentStudent.totalLessons} lessons</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderQuickActions = () => (
    <Card className="bg-white/5 border-white/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          Quick Actions for Parents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <div
                key={action.id}
                onClick={action.action}
                className="group cursor-pointer p-4 rounded-xl bg-gradient-to-r hover:from-white/10 hover:to-white/5 border border-white/10 hover:border-white/20 transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color} group-hover:scale-110 transition-transform duration-200`}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-white/70 text-sm mt-1">{action.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderStudentInsights = () => {
    if (!currentStudent) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Achievements & Strengths */}
        <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-green-400" />
              Celebrating Success
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-medium mb-2">Recent Achievements</h4>
                <div className="flex flex-wrap gap-2">
                  {currentStudent.recentAchievements.map((achievement, index) => (
                    <Badge key={index} className="bg-green-400/20 text-green-300">
                      <Star className="h-3 w-3 mr-1" />
                      {achievement}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-2">Strong Subjects</h4>
                <div className="flex flex-wrap gap-2">
                  {currentStudent.strongSubjects.map((subject, index) => (
                    <Badge key={index} className="bg-blue-400/20 text-blue-300">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Growth Areas */}
        <Card className="bg-gradient-to-br from-violet-600/20 to-red-600/20 border-violet-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-violet-400" />
              Growth Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-medium mb-2">Focus Areas</h4>
                <div className="space-y-2">
                  {currentStudent.improvementAreas.map((area, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                      <span className="text-white">{area}</span>
                      <Button 
                        size="sm"
                        onClick={() => navigate('/quiz-generator', { state: { topic: area, tab: 'generate' } })}
                        className="bg-gradient-to-r from-violet-500 to-red-500 hover:from-violet-600 hover:to-red-600 text-white text-xs"
                      >
                        Practice
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-pink-400" />
                  <span className="text-white font-medium">Parent Tip</span>
                </div>
                <p className="text-white/80 text-sm">
                  Upload completed quizzes to get personalized study plans that target these specific areas!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderWelcomeMessage = () => (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Sparkles className="h-8 w-8 text-yellow-400" />
        <h1 className="text-4xl font-bold text-white">
          Welcome to Your Family Learning Hub
        </h1>
        <Sparkles className="h-8 w-8 text-yellow-400" />
      </div>
      <p className="text-xl text-white/80 max-w-3xl mx-auto">
        Support your children's learning journey with AI-powered insights, personalized study plans, and engaging activities. 
        Track progress, celebrate achievements, and help them reach their full potential.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {renderWelcomeMessage()}
        
        <div className="space-y-6">
          {renderStudentSelector()}
          {renderQuickActions()}
          {renderStudentInsights()}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default FamilyHub;