import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Trophy, Clock, CheckCircle, Calendar, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { isMockDataEnabled, mockQuests } from '@/utils/mockData';

interface Quest {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  target_value: number;
  current_value: number;
  progress: number;
  reward: string;
  expires_at?: string;
  completed_at?: string;
  subjects?: { name: string };
}

export const StudentQuestDisplay = () => {
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
  const [completedQuests, setCompletedQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (isMockDataEnabled()) {
      setIsLoading(true);
      setActiveQuests(mockQuests.active);
      setCompletedQuests(mockQuests.completed);
      setIsLoading(false);
      return;
    }

    if (user) {
      fetchQuests();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchQuests = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Get user's school
      const { data: schoolRelation } = await supabase
        .from('school_student_relationships')
        .select('school_id')
        .eq('student_id', user.id)
        .eq('is_active', true)
        .single();

      let questsQuery = supabase
        .from('quests')
        .select(`
          *,
          subjects (name),
          user_quest_progress!left (
            current_value,
            completed,
            created_at
          )
        `)
        .eq('is_active', true);

      // If user is part of a school, also get school quests
      if (schoolRelation) {
        questsQuery = questsQuery.or(`created_by.eq.system,created_by.eq.school`);
      } else {
        questsQuery = questsQuery.eq('created_by', 'system');
      }

      const { data: questsData, error } = await questsQuery;

      if (error) throw error;

      // Process quests with progress
      const questsWithProgress: Quest[] = questsData.map(quest => {
        const progress = quest.user_quest_progress?.[0];
        return {
          id: quest.id,
          title: quest.title,
          description: quest.description,
          type: quest.type,
          difficulty: quest.difficulty,
          target_value: quest.target_value,
          current_value: progress?.current_value || 0,
          progress: progress?.current_value || 0,
          reward: quest.reward,
          expires_at: quest.expires_at,
          completed_at: progress?.completed_at,
          subjects: quest.subjects
        };
      });

      setActiveQuests(questsWithProgress.filter(q => !q.completed));
      setCompletedQuests(questsWithProgress.filter(q => q.completed));
    } catch (error: any) {
      console.error('Error fetching quests:', error);
      toast({
        title: "Error",
        description: "Failed to load quests",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'daily' ? <Clock className="h-4 w-4" /> : <Target className="h-4 w-4" />;
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading quests...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Your Quests</h2>
        <p className="text-gray-400">Complete quests to earn rewards and track your progress</p>
      </div>

      {/* Active Quests */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-400" />
          Active Quests ({activeQuests.length})
        </h3>
        
        {activeQuests.length === 0 ? (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-6 text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">No active quests available.</p>
              <p className="text-gray-400 text-sm mt-2">
                Complete lessons and activities to unlock new quests!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activeQuests.map((quest) => (
              <Card key={quest.id} className="bg-white/10 border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-white">{quest.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {getTypeIcon(quest.type)}
                          <span className="ml-1">{quest.type}</span>
                        </Badge>
                        <div className={`w-2 h-2 rounded-full ${getDifficultyColor(quest.difficulty)}`} />
                      </div>
                      <p className="text-sm text-gray-300 mb-3">{quest.description}</p>
                      {quest.subjects && (
                        <Badge variant="secondary" className="text-xs">
                          {quest.subjects.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white">
                        {quest.current_value}/{quest.target_value}
                      </span>
                    </div>
                    <Progress 
                      value={(quest.current_value / quest.target_value) * 100} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completed Quests */}
      {completedQuests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Completed Quests ({completedQuests.length})
          </h3>
          
          <div className="grid gap-4">
            {completedQuests.slice(0, 5).map((quest) => (
              <Card key={quest.id} className="bg-white/10 border-white/20 opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <div>
                        <h4 className="font-medium text-white">{quest.title}</h4>
                        <p className="text-sm text-gray-400">{quest.description}</p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-500/20 text-green-300">
                      Completed
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
