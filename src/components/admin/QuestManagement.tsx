import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Target, Calendar, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly';
  difficulty: 'basic' | 'intermediate' | 'hard';
  target_value: number;
  subject_id: string | null;
  created_by: string | null;
  is_active: boolean;
  created_at: string;
  subjects?: {
    name: string;
  };
  // Add progress tracking
  progress_stats?: {
    total_users: number;
    active_users: number;
    average_progress: number;
    completion_rate: number;
  };
}

interface Subject {
  id: string;
  name: string;
}

// Type guards for safe conversion
const isValidQuestType = (type: string): type is 'daily' | 'weekly' => {
  return type === 'daily' || type === 'weekly';
};

const isValidDifficulty = (difficulty: string): difficulty is 'basic' | 'intermediate' | 'hard' => {
  return difficulty === 'basic' || difficulty === 'intermediate' || difficulty === 'hard';
};

// Convert database quest to typed Quest
const convertDatabaseQuest = (dbQuest: any): Quest => {
  return {
    id: dbQuest.id,
    title: dbQuest.title,
    description: dbQuest.description,
    type: isValidQuestType(dbQuest.type) ? dbQuest.type : 'daily',
    difficulty: isValidDifficulty(dbQuest.difficulty) ? dbQuest.difficulty : 'basic',
    target_value: dbQuest.target_value,
    subject_id: dbQuest.subject_id,
    created_by: dbQuest.created_by,
    is_active: dbQuest.is_active,
    created_at: dbQuest.created_at,
    subjects: dbQuest.subjects
  };
};

export const QuestManagement = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    type: 'daily' as 'daily' | 'weekly',
    difficulty: 'basic' as 'basic' | 'intermediate' | 'hard',
    target_value: '',
    subject_id: ''
  });

  useEffect(() => {
    fetchQuests();
    fetchSubjects();
  }, []);

  const fetchQuests = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('quests')
        .select(`
          *,
          subjects (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Convert database results to typed Quest objects
      const convertedQuests = (data || []).map(convertDatabaseQuest);
      
      // Fetch progress statistics for each quest
      const questsWithProgress = await Promise.all(
        convertedQuests.map(async (quest) => {
          const { data: progressData, error: progressError } = await supabase
            .from('user_quest_progress')
            .select('user_id, current_value, completed, status')
            .eq('quest_id', quest.id);

          if (progressError) {
            console.error('Error fetching progress for quest:', quest.id, progressError);
            return quest;
          }

          const totalUsers = progressData?.length || 0;
          const activeUsers = progressData?.filter(p => p.status === 'active').length || 0;
          const completedUsers = progressData?.filter(p => p.completed).length || 0;
          const averageProgress = totalUsers > 0 
            ? progressData.reduce((sum, p) => sum + (p.current_value || 0), 0) / totalUsers 
            : 0;
          const completionRate = totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0;

          return {
            ...quest,
            progress_stats: {
              total_users: totalUsers,
              active_users: activeUsers,
              average_progress: Math.round(averageProgress * 10) / 10,
              completion_rate: Math.round(completionRate)
            }
          };
        })
      );
      
      setQuests(questsWithProgress);
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

  const fetchSubjects = async () => {
    try {
      console.log('Fetching subjects...');
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Error fetching subjects:', error);
        throw error;
      }
      
      console.log('Subjects fetched:', data);
      setSubjects(data || []);
      
      // If no subjects exist, create some default ones
      if (!data || data.length === 0) {
        console.log('No subjects found, creating default subjects...');
        await createDefaultSubjects();
      }
    } catch (error: any) {
      console.error('Error in fetchSubjects:', error);
      toast({
        title: "Info",
        description: "Creating default subjects for your school",
      });
      await createDefaultSubjects();
    }
  };

  const createDefaultSubjects = async () => {
    try {
      const defaultSubjects = [
        { name: 'Mathematics', description: 'Core mathematics curriculum including algebra, geometry, and calculus' },
        { name: 'Science', description: 'General science topics including physics, chemistry, and biology' },
        { name: 'English', description: 'Language arts including reading, writing, and literature' },
        { name: 'History', description: 'World history and social studies' },
        { name: 'Computer Science', description: 'Programming, algorithms, and computer literacy' }
      ];

      const { data, error } = await supabase
        .from('subjects')
        .insert(defaultSubjects)
        .select('id, name');

      if (error) throw error;
      
      console.log('Default subjects created:', data);
      setSubjects(data || []);
      
      toast({
        title: "Subjects Created",
        description: "Default subjects have been added to your school",
      });
    } catch (error: any) {
      console.error('Error creating default subjects:', error);
      toast({
        title: "Error",
        description: "Failed to create default subjects",
        variant: "destructive"
      });
    }
  };

  const createQuest = async () => {
    if (!newQuest.title.trim() || !newQuest.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in title and description",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreating(true);
      
      const questData = {
        title: newQuest.title,
        description: newQuest.description,
        type: newQuest.type,
        difficulty: newQuest.difficulty,
        target_value: parseInt(newQuest.target_value) || 1,
        subject_id: newQuest.subject_id || null,
        created_by_id: user?.id,
        created_by: 'school'
      };
      
      console.log('Creating quest with data:', questData);
      
      const { data, error } = await supabase
        .from('quests')
        .insert(questData)
        .select(`
          *,
          subjects (name)
        `)
        .single();

      if (error) throw error;

      // Convert and add the new quest
      const convertedQuest = convertDatabaseQuest(data);
      setQuests([convertedQuest, ...quests]);
      
      // Reset form
      setNewQuest({
        title: '',
        description: '',
        type: 'daily',
        difficulty: 'basic',
        target_value: '',
        subject_id: ''
      });
      
      setIsDialogOpen(false);
      
      const subjectName = data.subjects?.name || 'All Subjects';
      toast({
        title: "Quest Created",
        description: `"${newQuest.title}" created for ${subjectName}`,
      });
    } catch (error: any) {
      console.error('Error creating quest:', error);
      toast({
        title: "Error",
        description: "Failed to create quest",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleQuestStatus = async (questId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('quests')
        .update({ is_active: !currentStatus })
        .eq('id', questId);

      if (error) throw error;

      setQuests(quests.map(quest => 
        quest.id === questId 
          ? { ...quest, is_active: !currentStatus }
          : quest
      ));

      toast({
        title: "Quest Updated",
        description: `Quest ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error: any) {
      console.error('Error updating quest:', error);
      toast({
        title: "Error",
        description: "Failed to update quest",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse text-white">Loading quests...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Quest Management</h2>
          <p className="text-gray-400">
            Create and manage daily and weekly quests for students
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Quest
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Quest</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-white">Quest Title *</Label>
                <Input
                  id="title"
                  value={newQuest.title}
                  onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
                  placeholder="Complete 5 Math Problems"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-white">Description *</Label>
                <Textarea
                  id="description"
                  value={newQuest.description}
                  onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })}
                  placeholder="Practice arithmetic and problem-solving skills"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type" className="text-white">Type</Label>
                  <Select value={newQuest.type} onValueChange={(value: 'daily' | 'weekly') => setNewQuest({ ...newQuest, type: value })}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="daily" className="text-white hover:bg-gray-700">Daily</SelectItem>
                      <SelectItem value="weekly" className="text-white hover:bg-gray-700">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="difficulty" className="text-white">Difficulty</Label>
                  <Select value={newQuest.difficulty} onValueChange={(value: 'basic' | 'intermediate' | 'hard') => setNewQuest({ ...newQuest, difficulty: value })}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="basic" className="text-white hover:bg-gray-700">Basic</SelectItem>
                      <SelectItem value="intermediate" className="text-white hover:bg-gray-700">Intermediate</SelectItem>
                      <SelectItem value="hard" className="text-white hover:bg-gray-700">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetValue" className="text-white">Target Value</Label>
                  <Input
                    id="targetValue"
                    type="text"
                    value={newQuest.target_value}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numbers or empty string
                      if (value === '' || /^\d+$/.test(value)) {
                        setNewQuest({ ...newQuest, target_value: value });
                      }
                    }}
                    placeholder="1"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <Label htmlFor="subject" className="text-white">Subject</Label>
                  <Select value={newQuest.subject_id} onValueChange={(value) => setNewQuest({ ...newQuest, subject_id: value })}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="" className="text-white hover:bg-gray-700">All Subjects</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id} className="text-white hover:bg-gray-700">
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={createQuest}
                disabled={isCreating || !newQuest.title.trim() || !newQuest.description.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isCreating ? 'Creating...' : 'Create Quest'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Subject Summary */}
      {subjects.length > 0 && (
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-lg">Available Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <Badge key={subject.id} variant="secondary" className="bg-blue-600 text-white">
                  {subject.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quests list */}
      <div className="grid gap-4">
        {quests.length === 0 ? (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-6 text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">No quests created yet.</p>
              <p className="text-gray-400 text-sm mt-2">
                Start by creating engaging quests for your students.
              </p>
            </CardContent>
          </Card>
        ) : (
          quests.map((quest) => (
            <Card key={quest.id} className="bg-white/10 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium text-white">{quest.title}</h3>
                      <Badge variant={quest.type === 'daily' ? 'default' : 'secondary'}>
                        {quest.type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {quest.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-300 mb-3">{quest.description}</p>
                    
                    {/* Progress Statistics */}
                    {quest.progress_stats && quest.progress_stats.total_users > 0 && (
                      <div className="bg-white/5 rounded-lg p-3 mb-3">
                        <div className="grid grid-cols-2 gap-4 mb-2">
                          <div className="text-center">
                            <div className="text-sm font-semibold text-blue-400">
                              {quest.progress_stats.average_progress.toFixed(1)}/{quest.target_value}
                            </div>
                            <div className="text-xs text-gray-400">Avg Progress</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-semibold text-green-400">
                              {quest.progress_stats.completion_rate}%
                            </div>
                            <div className="text-xs text-gray-400">Completion Rate</div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Overall Progress</span>
                            <span>{quest.progress_stats.active_users} active users</span>
                          </div>
                          <Progress 
                            value={(quest.progress_stats.average_progress / quest.target_value) * 100} 
                            className="h-2" 
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span>Target: {quest.target_value}</span>
                      {quest.subjects && <span>Subject: {quest.subjects.name}</span>}
                      <span>Created: {new Date(quest.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Badge variant={quest.is_active ? 'default' : 'secondary'}>
                      {quest.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleQuestStatus(quest.id, quest.is_active)}
                      className="text-white border-white/30 hover:bg-white/10"
                    >
                      {quest.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
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
