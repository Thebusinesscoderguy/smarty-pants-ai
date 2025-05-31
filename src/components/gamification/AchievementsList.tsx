
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/contexts/AuthContext';

// Demo data for non-logged in users
const demoAchievements = [
  {
    id: '1',
    name: "First Steps",
    description: "Complete your first lesson",
    icon: "🎯",
    type: "milestone"
  },
  {
    id: '2',
    name: "Speed Learner",
    description: "Complete 5 lessons in one day",
    icon: "⚡",
    type: "performance"
  },
  {
    id: '3',
    name: "Math Master",
    description: "Achieve 80% completion in mathematics",
    icon: "🧮",
    type: "subject"
  },
  {
    id: '4',
    name: "Consistent Learner",
    description: "Study for 7 days straight",
    icon: "📚",
    type: "habit"
  },
  {
    id: '5',
    name: "Problem Solver",
    description: "Solve 100 practice problems",
    icon: "🔍",
    type: "practice"
  },
  {
    id: '6',
    name: "Time Manager",
    description: "Study for 10 hours total",
    icon: "⏰",
    type: "time"
  },
  {
    id: '7',
    name: "Science Explorer",
    description: "Complete all science modules",
    icon: "🔬",
    type: "subject"
  },
  {
    id: '8',
    name: "Quiz Champion",
    description: "Score 100% on 5 quizzes",
    icon: "🏆",
    type: "performance"
  },
  {
    id: '9',
    name: "Night Owl",
    description: "Study after 10 PM for 3 days",
    icon: "🦉",
    type: "habit"
  }
];

const demoUserAchievements = [
  {
    id: '1',
    name: "First Steps",
    description: "Complete your first lesson",
    icon: "🎯",
    earned_at: "2024-01-15"
  },
  {
    id: '2',
    name: "Speed Learner",
    description: "Complete 5 lessons in one day",
    icon: "⚡",
    earned_at: "2024-01-20"
  },
  {
    id: '3',
    name: "Math Master",
    description: "Achieve 80% completion in mathematics",
    icon: "🧮",
    earned_at: "2024-01-25"
  },
  {
    id: '4',
    name: "Consistent Learner",
    description: "Study for 7 days straight",
    icon: "📚",
    earned_at: "2024-01-30"
  }
];

export const AchievementsList = () => {
  const { user } = useAuth();
  const { achievements, userAchievements, isLoading } = useGamification();

  // Use demo data if user is not logged in
  const displayAchievements = user ? achievements : demoAchievements;
  const displayUserAchievements = user ? userAchievements : demoUserAchievements;
  const displayLoading = user ? isLoading : false;

  if (displayLoading) {
    return <div className="animate-pulse">Loading achievements...</div>;
  }

  const isEarned = (achievementId: string) => {
    return displayUserAchievements.some(ua => ua.id === achievementId);
  };

  const getEarnedDate = (achievementId: string) => {
    const earned = displayUserAchievements.find(ua => ua.id === achievementId);
    return earned?.earned_at ? new Date(earned.earned_at).toLocaleDateString() : null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Achievements</CardTitle>
        {!user && (
          <p className="text-sm text-gray-400">
            Demo achievements - some are marked as earned to show the experience
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayAchievements.map((achievement) => {
            const earned = isEarned(achievement.id);
            const earnedDate = getEarnedDate(achievement.id);
            
            return (
              <div
                key={achievement.id}
                className={`p-4 border rounded-lg transition-all ${
                  earned 
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-2xl">{achievement.icon}</div>
                  {earned && (
                    <Badge variant="default" className="bg-yellow-500">
                      Earned
                    </Badge>
                  )}
                </div>
                
                <h3 className="font-semibold mb-1">{achievement.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                
                <div className="flex items-center justify-between text-xs">
                  <Badge variant="outline" className="capitalize">
                    {achievement.type}
                  </Badge>
                  {earnedDate && (
                    <span className="text-green-600 font-medium">
                      {earnedDate}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
