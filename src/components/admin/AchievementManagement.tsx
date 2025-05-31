
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trophy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  type: 'milestone' | 'streak' | 'completion' | 'mastery' | 'challenge';
  criteria: any;
  created_at: string;
}

const iconOptions = [
  '🎯', '⚡', '🧮', '📚', '🏆', '⭐', '🚀', '💎', '🔥', '🎖️',
  '🥇', '🥈', '🥉', '🎨', '🔬', '📖', '✍️', '🧪', '🎭', '🎵'
];

const typeOptions = [
  { value: 'milestone', label: 'Milestone' },
  { value: 'streak', label: 'Streak' },
  { value: 'completion', label: 'Completion' },
  { value: 'mastery', label: 'Mastery' },
  { value: 'challenge', label: 'Challenge' }
];

export const AchievementManagement = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newAchievement, setNewAchievement] = useState({
    name: '',
    description: '',
    icon: '🏆',
    type: 'milestone' as Achievement['type'],
    criteria: ''
  });

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
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

  const createAchievement = async () => {
    if (!newAchievement.name.trim() || !newAchievement.description.trim()) return;

    try {
      setIsCreating(true);
      
      // Parse criteria as JSON
      let criteria = {};
      if (newAchievement.criteria.trim()) {
        try {
          criteria = JSON.parse(newAchievement.criteria);
        } catch (e) {
          toast({
            title: "Invalid Criteria",
            description: "Please enter valid JSON criteria",
            variant: "destructive"
          });
          return;
        }
      }

      const { data, error } = await supabase
        .from('achievements')
        .insert({
          name: newAchievement.name,
          description: newAchievement.description,
          icon: newAchievement.icon,
          type: newAchievement.type,
          criteria: criteria
        })
        .select()
        .single();

      if (error) throw error;

      setAchievements([data, ...achievements]);
      setNewAchievement({
        name: '',
        description: '',
        icon: '🏆',
        type: 'milestone',
        criteria: ''
      });
      
      toast({
        title: "Achievement Created",
        description: `"${newAchievement.name}" has been created successfully`,
      });
    } catch (error: any) {
      console.error('Error creating achievement:', error);
      toast({
        title: "Error",
        description: "Failed to create achievement",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading achievements...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Achievement Management</h2>
          <p className="text-gray-400">Create and manage achievements to motivate students</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-yellow-600 hover:bg-yellow-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Achievement
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Achievement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white">Achievement Name *</Label>
                <Input
                  id="name"
                  value={newAchievement.name}
                  onChange={(e) => setNewAchievement({ ...newAchievement, name: e.target.value })}
                  placeholder="First Steps"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-white">Description *</Label>
                <Textarea
                  id="description"
                  value={newAchievement.description}
                  onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                  placeholder="Completed your first lesson"
                  className="bg-white/10 border-white/20 text-white"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon" className="text-white">Icon</Label>
                  <Select value={newAchievement.icon} onValueChange={(value) => setNewAchievement({ ...newAchievement, icon: value })}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          {icon} {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type" className="text-white">Type</Label>
                  <Select value={newAchievement.type} onValueChange={(value: Achievement['type']) => setNewAchievement({ ...newAchievement, type: value })}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="criteria" className="text-white">Criteria (JSON)</Label>
                <Textarea
                  id="criteria"
                  value={newAchievement.criteria}
                  onChange={(e) => setNewAchievement({ ...newAchievement, criteria: e.target.value })}
                  placeholder='{"lessons_completed": 1}'
                  className="bg-white/10 border-white/20 text-white font-mono text-xs"
                  rows={3}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Example: {"{"}"lessons_completed": 5, "subject": "Math"{"}"}
                </p>
              </div>

              <Button 
                onClick={createAchievement}
                disabled={isCreating || !newAchievement.name.trim() || !newAchievement.description.trim()}
                className="w-full"
              >
                {isCreating ? 'Creating...' : 'Create Achievement'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Achievements list */}
      <div className="grid gap-4">
        {achievements.length === 0 ? (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-6 text-center">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">No achievements created yet.</p>
              <p className="text-gray-400 text-sm mt-2">
                Create achievements to motivate and reward students.
              </p>
            </CardContent>
          </Card>
        ) : (
          achievements.map((achievement) => (
            <Card key={achievement.id} className="bg-white/10 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium text-white">{achievement.name}</h3>
                      <Badge variant="outline">
                        {achievement.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{achievement.description}</p>
                    <div className="text-xs text-gray-400">
                      <p>Criteria: {JSON.stringify(achievement.criteria)}</p>
                      <p>Created: {new Date(achievement.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
