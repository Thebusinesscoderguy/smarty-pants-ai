
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Calendar, Clock, BookOpen } from 'lucide-react';
import { useQuests } from '@/hooks/useQuests';
import { useAuth } from '@/contexts/AuthContext';

export const QuestDisplay = () => {
  const { user } = useAuth();
  const { dailyQuests, weeklyQuests, isLoading } = useQuests();

  if (!user) {
    // Demo data for non-logged in users to show the concept
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
          created_by: 'ai' as const,
          expires_at: new Date().toISOString()
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
          created_by: 'ai' as const,
          expires_at: new Date().toISOString()
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
          created_by: 'ai' as const,
          expires_at: new Date().toISOString()
        }
      ]
    };

    return (
      <div className="space-y-6">
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Calendar className="h-5 w-5 text-blue-500" />
              Daily Quests (Demo)
            </CardTitle>
            <p className="text-sm text-gray-400">
              Sign in to get personalized quests based on your learning progress
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demoQuests.daily.map((quest) => (
                <div key={quest.id} className="space-y-3 p-4 border border-white/20 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🤖</span>
                        <h3 className="font-semibold text-white">{quest.title}</h3>
                        {quest.completed && (
                          <Badge variant="default" className="bg-green-500">
                            ✓ Completed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{quest.description}</p>
                    </div>
                    <Badge className="bg-green-500 text-white">
                      {quest.difficulty}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Progress</span>
                      <span className="text-white">{quest.current_value}/{quest.target_value}</span>
                    </div>
                    <Progress 
                      value={(quest.current_value / quest.target_value) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="h-5 w-5 text-purple-500" />
              Weekly Quests (Demo)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demoQuests.weekly.map((quest) => (
                <div key={quest.id} className="space-y-3 p-4 border border-white/20 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🤖</span>
                        <h3 className="font-semibold text-white">{quest.title}</h3>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{quest.description}</p>
                    </div>
                    <Badge className="bg-yellow-500 text-white">
                      {quest.difficulty}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Progress</span>
                      <span className="text-white">{quest.current_value}/{quest.target_value}</span>
                    </div>
                    <Progress 
                      value={(quest.current_value / quest.target_value) * 100} 
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
  }

  if (isLoading) {
    return <div className="animate-pulse text-white">Loading quests...</div>;
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
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-blue-500" />
            Daily Quests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyQuests.length > 0 ? (
            <div className="space-y-4">
              {dailyQuests.map((quest) => (
                <div key={quest.id} className="space-y-3 p-4 border border-white/20 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getCreatorIcon('ai')}</span>
                        <h3 className="font-semibold text-white">{quest.title}</h3>
                        {quest.completed && (
                          <Badge variant="default" className="bg-green-500">
                            ✓ Completed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{quest.description}</p>
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
                      <span className="text-gray-300">Progress</span>
                      <span className="text-white">{quest.current_value || 0}/{quest.target_value}</span>
                    </div>
                    <Progress 
                      value={((quest.current_value || 0) / quest.target_value) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 mb-2">No daily quests available</p>
              <p className="text-gray-400 text-sm">
                Start learning and new quests will be generated based on your progress!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Quests */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5 text-purple-500" />
            Weekly Quests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyQuests.length > 0 ? (
            <div className="space-y-4">
              {weeklyQuests.map((quest) => (
                <div key={quest.id} className="space-y-3 p-4 border border-white/20 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getCreatorIcon('ai')}</span>
                        <h3 className="font-semibold text-white">{quest.title}</h3>
                        {quest.completed && (
                          <Badge variant="default" className="bg-green-500">
                            ✓ Completed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{quest.description}</p>
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
                      <span className="text-gray-300">Progress</span>
                      <span className="text-white">{quest.current_value || 0}/{quest.target_value}</span>
                    </div>
                    <Progress 
                      value={((quest.current_value || 0) / quest.target_value) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 mb-2">No weekly quests available</p>
              <p className="text-gray-400 text-sm">
                Complete daily activities to unlock weekly challenges!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
