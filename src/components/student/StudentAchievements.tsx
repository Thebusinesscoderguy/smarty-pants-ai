import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Award, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
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
  const { userRole } = useUserRole();
  
  // Get effective role (session role or stored role)
  const sessionRole = typeof window !== 'undefined' 
    ? (localStorage.getItem('sessionRole') as 'student' | 'parent' | 'teacher' | null)
    : null;
  const effectiveRole = sessionRole ?? userRole;

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
      
      console.log('DEBUG: Fetching achievements for user:', user.id, 'effectiveRole:', effectiveRole);

      // Determine which users to fetch achievements for
      let targetUserIds = [user.id];
      
      if (effectiveRole === 'parent') {
        // Fetch children IDs for parent
        const { data: childrenData } = await supabase
          .from('parent_child_relationships')
          .select('child_id')
          .eq('parent_id', user.id);
        
        console.log('DEBUG: Parent children data:', childrenData);
        
        if (childrenData && childrenData.length > 0) {
          targetUserIds = childrenData.map(child => child.child_id);
          console.log('DEBUG: Fetching achievements for children:', targetUserIds);
        } else {
          console.log('DEBUG: No children found for parent, showing empty state');
          setAchievements([]);
          setIsLoading(false);
          return;
        }
      }

      // Simplified approach: Just fetch ALL achievements and filter in memory
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('created_at', { ascending: false });

      if (achievementsError) {
        console.error('Error fetching achievements:', achievementsError);
        throw achievementsError;
      }

      console.log('DEBUG: All achievements from database:', allAchievements);

      // For each target user, get their relationships and filter achievements
      const allUserAchievements: Achievement[] = [];
      
      for (const userId of targetUserIds) {
        // Get user's parent relationship
        const { data: parentRelation } = await supabase
          .from('parent_child_relationships')
          .select('parent_id')
          .eq('child_id', userId)
          .maybeSingle();

        console.log('DEBUG: Parent relationship for user', userId, ':', parentRelation);

        // Get user's school relationship
        const { data: schoolRelation } = await supabase
          .from('school_student_relationships')
          .select('school_id')
          .eq('student_id', userId)
          .eq('is_active', true)
          .maybeSingle();

        console.log('DEBUG: School relationship for user', userId, ':', schoolRelation);

        // Filter achievements that user can see
        const accessibleAchievements = allAchievements?.filter(achievement => {
          // Global achievements (no creator and no school)
          if (!achievement.creator_id && !achievement.school_id) {
            return true;
          }
          
          // Achievements created by user's parent
          if (achievement.creator_id === parentRelation?.parent_id) {
            return true;
          }
          
          // Achievements from user's school
          if (achievement.school_id === schoolRelation?.school_id) {
            return true;
          }
          
          return false;
        }) || [];

        console.log('DEBUG: Accessible achievements after filtering for user', userId, ':', accessibleAchievements);

        // Fetch user's earned achievements
        const { data: userAchievements } = await supabase
          .from('user_achievements')
          .select('achievement_id, earned_at')
          .eq('user_id', userId);

        console.log('DEBUG: User earned achievements for user', userId, ':', userAchievements);

        // Combine data for this user
        const earnedAchievementIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
        const earnedAchievementsMap = new Map(
          userAchievements?.map(ua => [ua.achievement_id, ua.earned_at]) || []
        );

        const userAchievementsWithStatus: Achievement[] = accessibleAchievements.map(achievement => ({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description || '',
          icon: achievement.icon || '🏆',
          type: achievement.type,
          earned: earnedAchievementIds.has(achievement.id),
          earned_at: earnedAchievementsMap.get(achievement.id) || null
        }));

        allUserAchievements.push(...userAchievementsWithStatus);
      }

      // Remove duplicates and set achievements
      const uniqueAchievements = allUserAchievements.filter((achievement, index, self) => 
        index === self.findIndex(a => a.id === achievement.id)
      );

      console.log('DEBUG: Final unique achievements with status:', uniqueAchievements);
      setAchievements(uniqueAchievements);
      
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
          <h2 className="text-2xl font-bold text-white mb-2">
            {effectiveRole === 'parent' ? 'Children\'s Achievements' : 'Your Achievements'}
          </h2>
          <p className="text-gray-400">
            {effectiveRole === 'parent' 
              ? 'Track your children\'s achievements and milestones'
              : 'Unlock achievements by completing quests and reaching milestones'
            }
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
