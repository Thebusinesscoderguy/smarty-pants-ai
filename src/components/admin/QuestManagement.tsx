
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  const { user } = useAuth();
  
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    type: 'daily' as 'daily' | 'weekly',
    difficulty: 'basic' as 'basic' | 'intermediate' | 'hard',
    target_value: 1,
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
      setQuests(convertedQuests);
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
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
    }
  };

  const createQuest = async () => {
    if (!newQuest.title.trim() || !newQuest.description.trim()) return;

    try {
      setIsCreating(true);
      const { data, error } = await supabase
        .from('quests')
        .insert({
          title: newQuest.title,
          description: newQuest.description,
          type: newQuest.type,
          difficulty: newQuest.difficulty,
          target_value: newQuest.target_value,
          subject_id: newQuest.subject_id || null,
          created_by: 'school',
          created_by_id: user?.id
        })
        .select(`
          *,
          subjects (name)
        `)
        .single();

      if (error) throw error;

      // Convert and add the new quest
      const convertedQuest = convertDatabaseQuest(data);
      setQuests([convertedQuest, ...quests]);
      setNewQuest({
        title: '',
        description: '',
        type: 'daily',
        difficulty: 'basic',
        target_value: 1,
        subject_id: ''
      });
      
      toast({
        title: "Quest Created",
        description: `"${newQuest.title}" has been created successfully`,
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
    return <div className="animate-pulse">Loading quests...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Quest Management</h2>
          <p className="text-gray-400">Create and manage daily and weekly quests for students</p>
        </div>
        
        <Dialog>
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
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-white">Description *</Label>
                <Textarea
                  id="description"
                  value={newQuest.description}
                  onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })}
                  placeholder="Practice arithmetic and problem-solving skills"
                  className="bg-white/10 border-white/20 text-white"
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
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="difficulty" className="text-white">Difficulty</Label>
                  <Select value={newQuest.difficulty} onValueChange={(value: 'basic' | 'intermediate' | 'hard') => setNewQuest({ ...newQuest, difficulty: value })}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetValue" className="text-white">Target Value</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    min="1"
                    value={newQuest.target_value}
                    onChange={(e) => setNewQuest({ ...newQuest, target_value: parseInt(e.target.value) || 1 })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="subject" className="text-white">Subject</Label>
                  <Select value={newQuest.subject_id} onValueChange={(value) => setNewQuest({ ...newQuest, subject_id: value })}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Subjects</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
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
                className="w-full"
              >
                {isCreating ? 'Creating...' : 'Create Quest'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
                    <p className="text-sm text-gray-300 mb-2">{quest.description}</p>
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
