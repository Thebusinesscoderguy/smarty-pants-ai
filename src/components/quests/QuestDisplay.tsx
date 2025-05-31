
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Calendar, Clock } from 'lucide-react';
import { useQuests } from '@/hooks/useQuests';
import { useAuth } from '@/contexts/AuthContext';

// Demo data for non-logged in users
const demoQuests = {
  daily: [
    {
      id: '1',
      title: 'Daily Math Practice',
      description: 'Complete 3 math problems',
      type: 'daily' as const,
      difficulty: 'basic' as const,
      target_value: 3,
      current_value: 2,
      completed: false,
      created_by: 'ai' as const
    },
    {
      id: '2',
      title: 'Reading Time',
      description: 'Read for 15 minutes',
      type: 'daily' as const,
      difficulty: 'basic' as const,
      target_value: 15,
      current_value: 15,
      completed: true,
      created_by: 'ai' as const
    }
  ],
  weekly: [
    {
      id: '3',
      title: 'Weekly Math Challenge',
      description: 'Complete 5 math lessons this week',
      type: 'weekly' as const,
      difficulty: 'intermediate' as const,
      target_value: 5,
      current_value: 3,
      completed: false,
      created_by: 'ai' as const
    },
    {
      id: '4',
      title: 'Writing Workshop',
      description: 'Write 3 essays this week',
      type: 'weekly' as const,
      difficulty: 'hard' as const,
      target_value: 3,
      current_value: 1,
      completed: false,
      created_by: 'parent' as const
    }
  ]
};

export const QuestDisplay = () => {
  const { user } = useAuth();
  const { dailyQuests, weeklyQuests, isLoading } = useQuests();

  // Use demo data if user is not logged in
  const displayDailyQuests = user ? dailyQuests : demoQuests.daily;
  const displayWeeklyQuests = user ? weeklyQuests : demoQuests.weekly;
  const displayLoading = user ? isLoading : false;

  if (displayLoading) {
    return <div className="animate-pulse">Loading quests...</div>;
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCreatorIcon = (creator: string) => {
    switch (creator) {
      case 'ai': return '🤖';
      case 'parent': return '👨‍👩‍👧‍👦';
      case 'school': return '🏫';
      default: return '📝';
    }
  };

  return (
    <div className="space-y-6">
      {/* Daily Quests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Daily Quests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayDailyQuests.map((quest) => (
              <div key={quest.id} className="space-y-3 p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getCreatorIcon(quest.created_by)}</span>
                      <h3 className="font-semibold">{quest.title}</h3>
                      {quest.completed && (
                        <Badge variant="default" className="bg-green-500">
                          ✓ Completed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{quest.description}</p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${getDifficultyColor(quest.difficulty)} text-white`}
                  >
                    {quest.difficulty}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{quest.current_value || 0}/{quest.target_value}</span>
                  </div>
                  <Progress 
                    value={((quest.current_value || 0) / quest.target_value) * 100} 
                    className="h-2" 
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Quests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            Weekly Quests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayWeeklyQuests.map((quest) => (
              <div key={quest.id} className="space-y-3 p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getCreatorIcon(quest.created_by)}</span>
                      <h3 className="font-semibold">{quest.title}</h3>
                      {quest.completed && (
                        <Badge variant="default" className="bg-green-500">
                          ✓ Completed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{quest.description}</p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${getDifficultyColor(quest.difficulty)} text-white`}
                  >
                    {quest.difficulty}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{quest.current_value || 0}/{quest.target_value}</span>
                  </div>
                  <Progress 
                    value={((quest.current_value || 0) / quest.target_value) * 100} 
                    className="h-2" 
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
