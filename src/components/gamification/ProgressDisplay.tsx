
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Clock, BookOpen } from 'lucide-react';
import { useQuests } from '@/hooks/useQuests';
import { useAuth } from '@/contexts/AuthContext';

// Demo data for non-logged in users
const demoUserProgress = [
  {
    subject: "Mathematics",
    completion_percentage: 75,
    completed_lessons: 15,
    total_lessons: 20,
    time_spent: 240
  },
  {
    subject: "Science",
    completion_percentage: 60,
    completed_lessons: 12,
    total_lessons: 20,
    time_spent: 180
  },
  {
    subject: "English",
    completion_percentage: 85,
    completed_lessons: 17,
    total_lessons: 20,
    time_spent: 300
  }
];

const demoChallenges = [
  {
    id: '1',
    title: "Complete 3 Math Problems",
    description: "Practice algebra and geometry concepts",
    target_value: 3,
    current_value: 2,
    completed: false
  },
  {
    id: '2',
    title: "Study for 30 Minutes",
    description: "Focus on your weakest subject",
    target_value: 30,
    current_value: 30,
    completed: true
  },
  {
    id: '3',
    title: "Solve 10 Problems",
    description: "Practice problem-solving skills",
    target_value: 10,
    current_value: 7,
    completed: false
  }
];

const demoAchievements = [
  {
    id: '1',
    name: "First Steps",
    description: "Completed your first lesson",
    icon: "🎯",
    earned_at: "2024-01-15"
  },
  {
    id: '2',
    name: "Speed Learner",
    description: "Completed 5 lessons in one day",
    icon: "⚡",
    earned_at: "2024-01-20"
  },
  {
    id: '3',
    name: "Math Master",
    description: "Achieved 80% in mathematics",
    icon: "🧮",
    earned_at: "2024-01-25"
  },
  {
    id: '4',
    name: "Consistent Learner",
    description: "Studied for 7 days straight",
    icon: "📚",
    earned_at: "2024-01-30"
  }
];

export const ProgressDisplay = () => {
  const { user } = useAuth();
  const { dailyQuests, subjectAssignments, isLoading } = useQuests();

  // Use demo data if user is not logged in
  const displayProgress = user ? subjectAssignments : demoUserProgress;
  const displayChallenges = user ? dailyQuests : demoChallenges;
  const displayAchievements = user ? [] : demoAchievements;
  const displayLoading = user ? isLoading : false;

  if (displayLoading) {
    return <div className="animate-pulse">Loading progress...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Subject Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Subject Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayProgress.map((subject, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {subject.subjects?.name || subject.subject}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {subject.completion_percentage}%
                    </span>
                  </div>
                </div>
                <Progress value={subject.completion_percentage} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{subject.completed_lessons}/{subject.total_lessons} lessons</span>
                  <span>{subject.time_spent} min</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Quests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            Today's Quests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {displayChallenges.map((challenge) => (
              <div key={challenge.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{challenge.title}</span>
                  {challenge.completed && (
                    <Badge variant="default" className="bg-green-500">
                      ✓ Completed
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{challenge.description}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>{challenge.current_value || 0}/{challenge.target_value}</span>
                  </div>
                  <Progress 
                    value={((challenge.current_value || 0) / challenge.target_value) * 100} 
                    className="h-2" 
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {displayAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-purple-500" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayAchievements.slice(0, 4).map((achievement) => (
                <div 
                  key={achievement.id}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border"
                >
                  <div className="text-2xl">{achievement.icon}</div>
                  <div>
                    <div className="font-medium">{achievement.name}</div>
                    <div className="text-xs text-gray-600">{achievement.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
