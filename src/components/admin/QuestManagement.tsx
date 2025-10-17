import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Target, Calendar, Users, Sparkles, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
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
  assigned_children?: string[] | null;
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

interface Child {
  id: string;
  first_name: string;
  last_name: string;
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
  const navigate = useNavigate();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [creationMethod, setCreationMethod] = useState<'manual' | 'ai' | 'both' | null>(null);
  const selectCreationMethod = (m: 'manual' | 'ai' | 'both') => {
    console.log('[QuestManagement] Select creation method:', m);
    setCreationMethod(m);
    toast({
      title: 'Creation mode selected',
      description: m === 'manual' ? 'Made by Me' : m === 'ai' ? 'Made by AI' : 'Both',
    });
  };
  const dialogContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (creationMethod) {
      requestAnimationFrame(() => {
        try {
          dialogContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          const firstField = dialogContentRef.current?.querySelector('input, textarea, select, button') as HTMLElement | null;
          firstField?.focus();
        } catch (e) {
          console.log('[QuestManagement] focus/scroll skipped:', e);
        }
      });
    }
  }, [creationMethod]);
const { user } = useAuth();
const { isSchoolAdmin } = useUserRole();
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    type: 'daily' as 'daily' | 'weekly',
    difficulty: 'basic' as 'basic' | 'intermediate' | 'hard',
    target_value: '',
    subject_id: '',
    assigned_children: [] as string[]
  });

  const [aiQuestParams, setAiQuestParams] = useState({
    subject_id: '',
    grade_level: '',
    difficulty: 'intermediate' as 'basic' | 'intermediate' | 'hard',
    type: 'daily' as 'daily' | 'weekly',
    count: 3,
    assigned_children: [] as string[]
  });

  useEffect(() => {
    fetchQuests();
    fetchSubjects();
    fetchChildren();
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

  const fetchChildren = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('parent_child_relationships')
        .select(`
          child_id,
          profiles!parent_child_relationships_child_id_fkey (
            id,
            display_name
          )
        `)
        .eq('parent_id', user.id);

      if (error) throw error;

      const childrenData = (data || []).map((rel: any) => ({
        id: rel.child_id,
        first_name: rel.profiles?.display_name?.split(' ')[0] || 'Child',
        last_name: rel.profiles?.display_name?.split(' ').slice(1).join(' ') || ''
      }));

      setChildren(childrenData);
    } catch (error: any) {
      console.error('Error fetching children:', error);
    }
  };

  const generateAIQuests = async () => {
    const selectedSubject = subjects.find(s => s.id === aiQuestParams.subject_id);
    
    if (!selectedSubject) {
      toast({
        title: "Error",
        description: "Please select a subject",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);

      const { data, error } = await supabase.functions.invoke('generate-quests', {
        body: {
          subject: selectedSubject.name,
          gradeLevel: aiQuestParams.grade_level || 'middle school',
          difficulty: aiQuestParams.difficulty,
          questType: aiQuestParams.type,
          count: aiQuestParams.count
        }
      });

      if (error) throw error;

      if (!data?.quests || data.quests.length === 0) {
        throw new Error('No quests were generated');
      }

      // Insert generated quests into database
      const questsToInsert = data.quests.map((quest: any) => ({
        ...quest,
        subject_id: aiQuestParams.subject_id || null,
        created_by_id: user?.id,
        created_by: 'school',
        assigned_children: aiQuestParams.assigned_children.length > 0 ? aiQuestParams.assigned_children : null
      }));

      const { data: insertedQuests, error: insertError } = await supabase
        .from('quests')
        .insert(questsToInsert)
        .select(`
          *,
          subjects (name)
        `);

      if (insertError) throw insertError;

      // Add to state
      const convertedQuests = (insertedQuests || []).map(convertDatabaseQuest);
      setQuests([...convertedQuests, ...quests]);

      // Reset form
      setAiQuestParams({
        subject_id: '',
        grade_level: '',
        difficulty: 'intermediate',
        type: 'daily',
        count: 3,
        assigned_children: []
      });

      setIsDialogOpen(false);

      toast({
        title: "Quests Generated",
        description: `${data.quests.length} AI-generated quests created successfully`,
      });

    } catch (error: any) {
      console.error('Error generating quests:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate quests",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
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
        created_by: 'school',
        assigned_children: newQuest.assigned_children.length > 0 ? newQuest.assigned_children : null
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
        subject_id: '',
        assigned_children: []
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
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setCreationMethod(null);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Quest
            </Button>
          </DialogTrigger>
          <DialogContent ref={dialogContentRef} className="bg-gray-900 border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Quest</DialogTitle>
              {creationMethod && (
                <p className="text-xs text-white/70 mt-1">
                  Mode: {creationMethod === 'manual' ? 'Made by Me' : creationMethod === 'ai' ? 'Made by AI' : 'Both'}
                </p>
              )}
            </DialogHeader>
            {!creationMethod ? (
              <div className="space-y-4 py-6">
                <p className="text-white/70 text-center mb-6">Choose how you'd like to create your quest</p>
                <div className="grid grid-cols-1 gap-4">
                  <Button
                    type="button"
                    onClick={() => { 
                      console.log('Made by Me clicked');
                      if (!user) {
                        toast({ title: 'Sign in required', description: 'Please sign in to create a quest.' });
                        setIsDialogOpen(false);
                        setTimeout(() => navigate('/auth'), 50);
                        return;
                      }
                      console.log('Navigating to /quests/create');
                      setIsDialogOpen(false);
                      setTimeout(() => navigate('/quests/create'), 50);
                    }}
                    className="h-auto py-6 bg-purple-600 hover:bg-purple-700 flex flex-col items-center gap-2"
                  >
                    <Plus className="h-8 w-8" />
                    <span className="text-lg font-semibold">Made by Me</span>
                    <span className="text-sm opacity-80">Create a custom quest manually</span>
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={() => selectCreationMethod('ai')}
                    className="h-auto py-6 bg-blue-600 hover:bg-blue-700 flex flex-col items-center gap-2"
                  >
                    <Sparkles className="h-8 w-8" />
                    <span className="text-lg font-semibold">Made by AI</span>
                    <span className="text-sm opacity-80">Let AI generate engaging quests</span>
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={() => selectCreationMethod('both')}
                    className="h-auto py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex flex-col items-center gap-2"
                  >
                    <div className="flex gap-2">
                      <Plus className="h-8 w-8" />
                      <Sparkles className="h-8 w-8" />
                    </div>
                    <span className="text-lg font-semibold">Both</span>
                    <span className="text-sm opacity-80">Use both manual and AI creation</span>
                  </Button>
                </div>
              </div>
            ) : creationMethod === 'both' ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <Button variant="outline" size="sm" onClick={() => setCreationMethod(null)} className="text-white border-white/20 hover:bg-white/10">← Back</Button>
                </div>
                <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/10">
                  <TabsTrigger value="manual" className="data-[state=active]:bg-purple-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Manual Creation
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="data-[state=active]:bg-purple-600">
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Generation
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4 pr-2 mt-4">
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

<div>
  <Label className="text-white mb-2 block">{isSchoolAdmin ? 'Assign to Students' : 'Assign to Children'}</Label>
  <div className="space-y-2 p-3 bg-white/5 rounded-md border border-white/10">
    <div className="flex items-center space-x-2">
      <Checkbox
        id="all-children"
        checked={newQuest.assigned_children.length === 0}
        onCheckedChange={(checked) => {
          if (checked) {
            setNewQuest({ ...newQuest, assigned_children: [] });
          }
        }}
      />
      <label htmlFor="all-children" className="text-sm text-white cursor-pointer">
        {isSchoolAdmin ? 'All Students' : 'All Children'}
      </label>
    </div>
    {children.length > 0 ? (
      children.map((child) => (
        <div key={child.id} className="flex items-center space-x-2">
          <Checkbox
            id={`child-${child.id}`}
            checked={newQuest.assigned_children.includes(child.id)}
            onCheckedChange={(checked) => {
              if (checked) {
                setNewQuest({
                  ...newQuest,
                  assigned_children: [...newQuest.assigned_children, child.id]
                });
              } else {
                setNewQuest({
                  ...newQuest,
                  assigned_children: newQuest.assigned_children.filter(id => id !== child.id)
                });
              }
            }}
          />
          <label htmlFor={`child-${child.id}`} className="text-sm text-white cursor-pointer">
            {child.first_name} {child.last_name}
          </label>
        </div>
      ))
    ) : (
      <p className="text-xs text-gray-400">
        {isSchoolAdmin ? 'No students linked to your school yet.' : 'No children linked yet.'}
      </p>
    )}
  </div>
</div>

              <Button
                onClick={createQuest}
                disabled={isCreating || !newQuest.title.trim() || !newQuest.description.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isCreating ? 'Creating...' : 'Create Quest'}
              </Button>
              </TabsContent>

              <TabsContent value="ai" className="space-y-4 pr-2 mt-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <Sparkles className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-medium mb-1">AI Quest Generation</h4>
                      <p className="text-sm text-white/70">
                        Generate multiple quests automatically based on subject, grade level, and difficulty. 
                        The AI will create engaging, curriculum-aligned quests for your students.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="ai-subject" className="text-white">Subject *</Label>
                  <Select value={aiQuestParams.subject_id} onValueChange={(value) => setAiQuestParams({ ...aiQuestParams, subject_id: value })}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id} className="text-white hover:bg-gray-700">
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="grade-level" className="text-white">Grade Level</Label>
                  <Input
                    id="grade-level"
                    value={aiQuestParams.grade_level}
                    onChange={(e) => setAiQuestParams({ ...aiQuestParams, grade_level: e.target.value })}
                    placeholder="e.g., 6th grade, high school"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="ai-type" className="text-white">Type</Label>
                    <Select value={aiQuestParams.type} onValueChange={(value: 'daily' | 'weekly') => setAiQuestParams({ ...aiQuestParams, type: value })}>
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
                    <Label htmlFor="ai-difficulty" className="text-white">Difficulty</Label>
                    <Select value={aiQuestParams.difficulty} onValueChange={(value: 'basic' | 'intermediate' | 'hard') => setAiQuestParams({ ...aiQuestParams, difficulty: value })}>
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

                  <div>
                    <Label htmlFor="quest-count" className="text-white">Count</Label>
                    <Input
                      id="quest-count"
                      type="number"
                      min="1"
                      max="10"
                      value={aiQuestParams.count}
                      onChange={(e) => setAiQuestParams({ ...aiQuestParams, count: parseInt(e.target.value) || 3 })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-2 block">{isSchoolAdmin ? 'Assign to Students' : 'Assign to Children'}</Label>
                  <div className="space-y-2 p-3 bg-white/5 rounded-md border border-white/10 max-h-40 overflow-y-auto">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ai-all-children"
                        checked={aiQuestParams.assigned_children.length === 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAiQuestParams({ ...aiQuestParams, assigned_children: [] });
                          }
                        }}
                      />
                      <label htmlFor="ai-all-children" className="text-sm text-white cursor-pointer">
                        {isSchoolAdmin ? 'All Students' : 'All Children'}
                      </label>
                    </div>
                    {children.map((child) => (
                      <div key={child.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`ai-child-${child.id}`}
                          checked={aiQuestParams.assigned_children.includes(child.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setAiQuestParams({
                                ...aiQuestParams,
                                assigned_children: [...aiQuestParams.assigned_children, child.id]
                              });
                            } else {
                              setAiQuestParams({
                                ...aiQuestParams,
                                assigned_children: aiQuestParams.assigned_children.filter(id => id !== child.id)
                              });
                            }
                          }}
                        />
                        <label htmlFor={`ai-child-${child.id}`} className="text-sm text-white cursor-pointer">
                          {child.first_name} {child.last_name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={generateAIQuests} disabled={isGenerating} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate {aiQuestParams.count} Quest{aiQuestParams.count > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </TabsContent>

                <TabsContent value="ai" className="space-y-4 pr-2 mt-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-3">
                      <Sparkles className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-white font-medium mb-1">AI Quest Generation</h4>
                        <p className="text-sm text-white/70">
                          Generate multiple quests automatically based on subject, grade level, and difficulty. 
                          The AI will create engaging, curriculum-aligned quests for your students.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ai-subject" className="text-white">Subject *</Label>
                    <Select value={aiQuestParams.subject_id} onValueChange={(value) => setAiQuestParams({ ...aiQuestParams, subject_id: value })}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id} className="text-white hover:bg-gray-700">
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="grade-level" className="text-white">Grade Level</Label>
                    <Input
                      id="grade-level"
                      value={aiQuestParams.grade_level}
                      onChange={(e) => setAiQuestParams({ ...aiQuestParams, grade_level: e.target.value })}
                      placeholder="e.g., 6th grade, high school"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="ai-type" className="text-white">Type</Label>
                      <Select value={aiQuestParams.type} onValueChange={(value: 'daily' | 'weekly') => setAiQuestParams({ ...aiQuestParams, type: value })}>
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
                      <Label htmlFor="ai-difficulty" className="text-white">Difficulty</Label>
                      <Select value={aiQuestParams.difficulty} onValueChange={(value: 'basic' | 'intermediate' | 'hard') => setAiQuestParams({ ...aiQuestParams, difficulty: value })}>
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

                    <div>
                      <Label htmlFor="quest-count" className="text-white">Count</Label>
                      <Input
                        id="quest-count"
                        type="number"
                        min="1"
                        max="10"
                        value={aiQuestParams.count}
                        onChange={(e) => setAiQuestParams({ ...aiQuestParams, count: parseInt(e.target.value) || 3 })}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white mb-2 block">{isSchoolAdmin ? 'Assign to Students' : 'Assign to Children'}</Label>
                    <div className="space-y-2 p-3 bg-white/5 rounded-md border border-white/10 max-h-40 overflow-y-auto">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="ai-all-children"
                          checked={aiQuestParams.assigned_children.length === 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setAiQuestParams({ ...aiQuestParams, assigned_children: [] });
                            }
                          }}
                        />
                        <label htmlFor="ai-all-children" className="text-sm text-white cursor-pointer">
                          {isSchoolAdmin ? 'All Students' : 'All Children'}
                        </label>
                      </div>
                      {children.map((child) => (
                        <div key={child.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`ai-child-${child.id}`}
                            checked={aiQuestParams.assigned_children.includes(child.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAiQuestParams({
                                  ...aiQuestParams,
                                  assigned_children: [...aiQuestParams.assigned_children, child.id]
                                });
                              } else {
                                setAiQuestParams({
                                  ...aiQuestParams,
                                  assigned_children: aiQuestParams.assigned_children.filter(id => id !== child.id)
                                });
                              }
                            }}
                          />
                          <label htmlFor={`ai-child-${child.id}`} className="text-sm text-white cursor-pointer">
                            {child.first_name} {child.last_name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={generateAIQuests} disabled={isGenerating} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate {aiQuestParams.count} Quest{aiQuestParams.count > 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
                </>
            ) : creationMethod === 'manual' ? (
              <div className="space-y-4 pr-2 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <Button variant="outline" size="sm" onClick={() => setCreationMethod(null)} className="text-white border-white/20 hover:bg-white/10">← Back</Button>
                </div>
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

                <div>
                  <Label className="text-white mb-2 block">{isSchoolAdmin ? 'Assign to Students' : 'Assign to Children'}</Label>
                  <div className="space-y-2 p-3 bg-white/5 rounded-md border border-white/10">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="all-children"
                        checked={newQuest.assigned_children.length === 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewQuest({ ...newQuest, assigned_children: [] });
                          }
                        }}
                      />
                      <label htmlFor="all-children" className="text-sm text-white cursor-pointer">
                        {isSchoolAdmin ? 'All Students' : 'All Children'}
                      </label>
                    </div>
                    {children.length > 0 ? (
                      children.map((child) => (
                        <div key={child.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`child-${child.id}`}
                            checked={newQuest.assigned_children.includes(child.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewQuest({
                                  ...newQuest,
                                  assigned_children: [...newQuest.assigned_children, child.id]
                                });
                              } else {
                                setNewQuest({
                                  ...newQuest,
                                  assigned_children: newQuest.assigned_children.filter(id => id !== child.id)
                                });
                              }
                            }}
                          />
                          <label htmlFor={`child-${child.id}`} className="text-sm text-white cursor-pointer">
                            {child.first_name} {child.last_name}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">
                        {isSchoolAdmin ? 'No students linked to your school yet.' : 'No children linked yet.'}
                      </p>
                    )}
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
            ) : (
              <div className="space-y-4 pr-2 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <Button variant="outline" size="sm" onClick={() => setCreationMethod(null)} className="text-white border-white/20 hover:bg-white/10">← Back</Button>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <Sparkles className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-medium mb-1">AI Quest Generation</h4>
                      <p className="text-sm text-white/70">
                        Generate multiple quests automatically based on subject, grade level, and difficulty. 
                        The AI will create engaging, curriculum-aligned quests for your students.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="ai-subject" className="text-white">Subject *</Label>
                  <Select value={aiQuestParams.subject_id} onValueChange={(value) => setAiQuestParams({ ...aiQuestParams, subject_id: value })}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id} className="text-white hover:bg-gray-700">
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="grade-level" className="text-white">Grade Level</Label>
                  <Input
                    id="grade-level"
                    value={aiQuestParams.grade_level}
                    onChange={(e) => setAiQuestParams({ ...aiQuestParams, grade_level: e.target.value })}
                    placeholder="e.g., 6th grade, high school"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="ai-type" className="text-white">Type</Label>
                    <Select value={aiQuestParams.type} onValueChange={(value: 'daily' | 'weekly') => setAiQuestParams({ ...aiQuestParams, type: value })}>
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
                    <Label htmlFor="ai-difficulty" className="text-white">Difficulty</Label>
                    <Select value={aiQuestParams.difficulty} onValueChange={(value: 'basic' | 'intermediate' | 'hard') => setAiQuestParams({ ...aiQuestParams, difficulty: value })}>
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

                  <div>
                    <Label htmlFor="quest-count" className="text-white">Count</Label>
                    <Input
                      id="quest-count"
                      type="number"
                      min="1"
                      max="10"
                      value={aiQuestParams.count}
                      onChange={(e) => setAiQuestParams({ ...aiQuestParams, count: parseInt(e.target.value) || 3 })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-2 block">{isSchoolAdmin ? 'Assign to Students' : 'Assign to Children'}</Label>
                  <div className="space-y-2 p-3 bg-white/5 rounded-md border border-white/10 max-h-40 overflow-y-auto">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ai-all-children"
                        checked={aiQuestParams.assigned_children.length === 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAiQuestParams({ ...aiQuestParams, assigned_children: [] });
                          }
                        }}
                      />
                      <label htmlFor="ai-all-children" className="text-sm text-white cursor-pointer">
                        {isSchoolAdmin ? 'All Students' : 'All Children'}
                      </label>
                    </div>
                    {children.map((child) => (
                      <div key={child.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`ai-child-${child.id}`}
                          checked={aiQuestParams.assigned_children.includes(child.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setAiQuestParams({
                                ...aiQuestParams,
                                assigned_children: [...aiQuestParams.assigned_children, child.id]
                              });
                            } else {
                              setAiQuestParams({
                                ...aiQuestParams,
                                assigned_children: aiQuestParams.assigned_children.filter(id => id !== child.id)
                              });
                            }
                          }}
                        />
                        <label htmlFor={`ai-child-${child.id}`} className="text-sm text-white cursor-pointer">
                          {child.first_name} {child.last_name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={generateAIQuests} disabled={isGenerating} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate {aiQuestParams.count} Quest{aiQuestParams.count > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            )}
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
                    
                    {/* Progress */}
                    <div className="bg-white/5 rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-2 gap-4 mb-2">
                        <div className="text-center">
                          <div className="text-sm font-semibold text-blue-400">
                            {Number(quest.progress_stats?.average_progress ?? 0).toFixed(1)}/{quest.target_value}
                          </div>
                          <div className="text-xs text-gray-400">Avg Progress</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-green-400">
                            {quest.progress_stats ? `${quest.progress_stats.completion_rate}%` : '0%'}
                          </div>
                          <div className="text-xs text-gray-400">Completion Rate</div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Overall Progress</span>
                          <span>{quest.progress_stats ? `${quest.progress_stats.active_users} active users` : 'No participants yet'}</span>
                        </div>
                        <Progress 
                          value={((quest.progress_stats?.average_progress ?? 0) / quest.target_value) * 100} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                    
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
