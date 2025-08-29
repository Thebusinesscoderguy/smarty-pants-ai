import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Award, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { isMockDataEnabled } from '@/utils/mockDataToggle';
import { mockAchievements } from '@/utils/mockData';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  earned: boolean;
  earned_at: string | null;
}

export const StudentAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (isMockDataEnabled()) {
      setIsLoading(true);
      // Map mock achievements to match the Achievement interface
      const mappedAchievements: Achievement[] = mockAchievements.map(achievement => ({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        type: achievement.type,
        earned: achievement.earned,
        earned_at: achievement.earned_at
      }));
      setAchievements(mappedAchievements);
      setIsLoading(false);
      return;
    }

    if (user) {
      fetchAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Get user's school relationship
      const { data: schoolRelation } = await supabase
        .from('school_student_relationships')
        .select('school_id')
        .eq('student_id', user.id)
        .eq('is_active', true)
        .single();

      // Get user's parent relationship
      const { data: parentRelation } = await supabase
        .from('parent_child_relationships')
        .select('parent_id')
        .eq('child_id', user.id)
        .single();

      console.log('Student relationships for achievements:', { schoolRelation, parentRelation });

      // Fetch all achievements that are accessible to this user
      let achievementsQuery = supabase
        .from('achievements')
        .select('*')
        .order('created_at', { ascending: false });

      // Build conditions for accessible achievements
      const conditions = [];
      
      // Include achievements created by the user's school
      if (schoolRelation) {
        conditions.push(`school_id.eq.${schoolRelation.school_id}`);
      }
      
      // Include achievements created by the user's parent
      if (parentRelation) {
        conditions.push(`creator_id.eq.${parentRelation.parent_id}`);
      }
      
      // Include global achievements (no school_id and no creator_id)
      conditions.push('and(school_id.is.null,creator_id.is.null)');

      if (conditions.length > 0) {
        achievementsQuery = achievementsQuery.or(conditions.join(','));
      }

      const { data: allAchievements, error: achievementsError } = await achievementsQuery;

      if (achievementsError) {
        console.error('Error fetching achievements:', achievementsError);
        throw achievementsError;
      }

      console.log('Fetched achievements:', allAchievements);

      // Fetch user's earned achievements
      let userAchievementsQuery = supabase
        .from('user_achievements')
        .select('achievement_id, earned_at')
        .eq('user_id', user.id);

      if (schoolRelation) {
        userAchievementsQuery = userAchievementsQuery.eq('school_id', schoolRelation.school_id);
      }

      const { data: userAchievements, error: userError } = await userAchievementsQuery;
      
      if (userError) {
        console.error('Error fetching user achievements:', userError);
        throw userError;
      }

      console.log('User earned achievements:', userAchievements);

      // Combine data
      const earnedAchievementIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
      const earnedAchievementsMap = new Map(
        userAchievements?.map(ua => [ua.achievement_id, ua.earned_at]) || []
      );

      const achievementsWithStatus: Achievement[] = (allAchievements || []).map(achievement => ({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description || '',
        icon: achievement.icon || '🏆',
        type: achievement.type,
        earned: earnedAchievementIds.has(achievement.id),
        earned_at: earnedAchievementsMap.get(achievement.id) || null
      }));

      setAchievements(achievementsWithStatus);
    } catch (error: any) {
      console.error('Error fetching achievements:', error);
      toast({
        title: "Error",
        description: "Failed to load achievements",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'milestone': return <Target className="h-4 w-4" />;
      case 'streak': return <Star className="h-4 w-4" />;
      case 'completion': return <Award className="h-4 w-4" />;
      case 'mastery': return <Trophy className="h-4 w-4" />;
      default: return <Trophy className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'milestone': return 'text-blue-400';
      case 'streak': return 'text-yellow-400';
      case 'completion': return 'text-green-400';
      case 'mastery': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading achievements...</div>;
  }

  const earnedAchievements = achievements.filter(a => a.earned);
  const availableAchievements = achievements.filter(a => !a.earned);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Your Achievements</h2>
          <p className="text-gray-400">
            Unlock achievements by completing quests and reaching milestones
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{earnedAchievements.length}</div>
          <div className="text-sm text-gray-400">Earned</div>
        </div>
      </div>

      {/* Earned Achievements */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Earned Achievements ({earnedAchievements.length})
        </h3>
        
        {earnedAchievements.length === 0 ? (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-6 text-center">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">No achievements earned yet.</p>
              <p className="text-gray-400 text-sm mt-2">
                Complete quests and activities to earn your first achievement!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {earnedAchievements.map((achievement) => (
              <Card key={achievement.id} className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white">{achievement.name}</h4>
                        <div className={getTypeColor(achievement.type)}>
                          {getTypeIcon(achievement.type)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{achievement.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="default" className="bg-yellow-500/20 text-yellow-300 text-xs">
                          {achievement.type}
                        </Badge>
                        {achievement.earned_at && (
                          <span className="text-xs text-gray-400">
                            {new Date(achievement.earned_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Available Achievements */}
      {availableAchievements.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-gray-400" />
            Available Achievements ({availableAchievements.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableAchievements.slice(0, 9).map((achievement) => (
              <Card key={achievement.id} className="bg-white/10 border-white/20 opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl grayscale">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-300">{achievement.name}</h4>
                        <div className="text-gray-500">
                          {getTypeIcon(achievement.type)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{achievement.description}</p>
                      <Badge variant="outline" className="text-xs">
                        {achievement.type}
                      </Badge>
                    </div>
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
