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
import { useLanguage } from '@/contexts/LanguageContext';

const QUEST_TYPE_KEY: Record<string, string> = { daily: 'quest.daily', weekly: 'quest.weekly' };
const QUEST_DIFF_KEY: Record<string, string> = { basic: 'quest.basic', intermediate: 'quest.intermediate', hard: 'quest.hard' };

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
  const { t } = useLanguage();
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
      title: t('quest.modeSelected'),
      description: m === 'manual' ? t('quest.madeByMe') : m === 'ai' ? t('quest.madeByAi') : t('quest.both'),
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
        title: t('quest.error'),
        description: t('quest.failedLoad'),
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
      
      // Remove duplicates by name
      const uniqueSubjects = data ? data.filter((subject, index, self) =>
        index === self.findIndex((s) => s.name === subject.name)
      ) : [];
      
      setSubjects(uniqueSubjects);
      
      // If no subjects exist, create some default ones
      if (!data || data.length === 0) {
        console.log('No subjects found, creating default subjects...');
        await createDefaultSubjects();
      }
    } catch (error: any) {
      console.error('Error in fetchSubjects:', error);
      toast({
        title: t('quest.info'),
        description: t('quest.creatingDefaults'),
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
        title: t('quest.subjectsCreated'),
        description: t('quest.subjectsCreatedDesc'),
      });
    } catch (error: any) {
      console.error('Error creating default subjects:', error);
      toast({
        title: t('quest.error'),
        description: t('quest.failedDefaults'),
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
        title: t('quest.error'),
        description: t('quest.selectSubjectErr'),
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      console.log('[QuestManagement] Calling generate-quests with:', {
        subject: selectedSubject.name,
        gradeLevel: aiQuestParams.grade_level || 'middle school',
        difficulty: aiQuestParams.difficulty,
        questType: aiQuestParams.type,
        count: aiQuestParams.count
      });

      const { data, error } = await supabase.functions.invoke('generate-quests', {
        body: {
          subject: selectedSubject.name,
          gradeLevel: aiQuestParams.grade_level || 'middle school',
          difficulty: aiQuestParams.difficulty,
          questType: aiQuestParams.type,
          count: aiQuestParams.count
        }
      });

      console.log('[QuestManagement] generate-quests response:', { data, error });

      if (error) {
        console.error('[QuestManagement] Edge function error:', error);
        // Try to extract more details from the error
        const errorMessage = error.message || 'Edge function failed';
        const errorDetails = error.context?.body ? JSON.stringify(error.context.body) : '';
        throw new Error(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`);
      }

      // Check if data contains an error (function returned 200 but with error payload)
      if (data?.error) {
        console.error('[QuestManagement] Function returned error:', data.error, data.details);
        throw new Error(data.error + (data.details ? `: ${data.details}` : ''));
      }

      if (!data?.quests || data.quests.length === 0) {
        throw new Error(t('quest.noQuestsGenerated'));
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
        title: t('quest.questsGenerated'),
        description: `${data.quests.length} ${t('quest.questsGeneratedDescSuffix')}`,
      });

    } catch (error: any) {
      console.error('[QuestManagement] Error generating quests:', error);
      toast({
        title: t('quest.genFailed'),
        description: error.message || t('quest.genFailedFallback'),
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const createQuest = async () => {
    if (!newQuest.title.trim() || !newQuest.description.trim()) {
      toast({
        title: t('quest.error'),
        description: t('quest.fillTitleDesc'),
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
      
      const subjectName = data.subjects?.name || t('quest.allSubjects');
      toast({
        title: t('quest.created'),
        description: `"${newQuest.title}" ${t('quest.createdForPre')} ${subjectName}`,
      });
    } catch (error: any) {
      console.error('Error creating quest:', error);
      toast({
        title: t('quest.error'),
        description: t('quest.failedCreate'),
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
        title: t('quest.updated'),
        description: !currentStatus ? t('quest.questActivated') : t('quest.questDeactivated'),
      });
    } catch (error: any) {
      console.error('Error updating quest:', error);
      toast({
        title: t('quest.error'),
        description: t('quest.failedUpdate'),
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse text-foreground">{t('quest.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('quest.title')}</h2>
          <p className="text-muted-foreground">
            {t('quest.subtitle')}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setCreationMethod(null);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              {t('quest.createQuest')}
            </Button>
          </DialogTrigger>
          <DialogContent ref={dialogContentRef} className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">{t('quest.createNew')}</DialogTitle>
              {creationMethod && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t('quest.modePrefix')} {creationMethod === 'manual' ? t('quest.madeByMe') : creationMethod === 'ai' ? t('quest.madeByAi') : t('quest.both')}
                </p>
              )}
            </DialogHeader>
            {!creationMethod ? (
              <div className="space-y-4 py-6">
                <p className="text-foreground/70 text-center mb-6">{t('quest.chooseHow')}</p>
                <div className="grid grid-cols-1 gap-4">
                  <Button
                    type="button"
                    onClick={() => selectCreationMethod('manual')}
                    className="h-auto py-6 bg-primary text-primary-foreground shadow-button hover:bg-primary/90 hover:shadow-button-hover flex flex-col items-center gap-2"
                  >
                    <Plus className="h-8 w-8" />
                    <span className="text-lg font-semibold">{t('quest.madeByMe')}</span>
                    <span className="text-sm opacity-80">{t('quest.madeByMeDesc')}</span>
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={() => selectCreationMethod('ai')}
                    className="h-auto py-6 bg-primary text-primary-foreground shadow-button hover:bg-primary/90 hover:shadow-button-hover flex flex-col items-center gap-2"
                  >
                    <Sparkles className="h-8 w-8" />
                    <span className="text-lg font-semibold">{t('quest.madeByAi')}</span>
                    <span className="text-sm opacity-80">{t('quest.madeByAiDesc')}</span>
                  </Button>
                </div>
              </div>
            ) : creationMethod === 'manual' ? (
              <div className="space-y-4 pr-2 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <Button variant="outline" size="sm" onClick={() => setCreationMethod(null)} className="text-foreground border-border hover:bg-muted">{t('quest.back')}</Button>
                </div>
                <div>
                  <Label htmlFor="title" className="text-foreground">{t('quest.questTitle')}</Label>
                  <Input
                    id="title"
                    value={newQuest.title}
                    onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
                    placeholder={t('quest.titlePlaceholder')}
                    className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-foreground">{t('quest.description')}</Label>
                  <Textarea
                    id="description"
                    value={newQuest.description}
                    onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })}
                    placeholder={t('quest.descPlaceholder')}
                    className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type" className="text-foreground">{t('quest.type')}</Label>
                    <Select value={newQuest.type} onValueChange={(value: 'daily' | 'weekly') => setNewQuest({ ...newQuest, type: value })}>
                      <SelectTrigger className="bg-background border-input text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="daily">{t('quest.daily')}</SelectItem>
                        <SelectItem value="weekly">{t('quest.weekly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="difficulty" className="text-foreground">{t('quest.difficulty')}</Label>
                    <Select value={newQuest.difficulty} onValueChange={(value: 'basic' | 'intermediate' | 'hard') => setNewQuest({ ...newQuest, difficulty: value })}>
                      <SelectTrigger className="bg-background border-input text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="basic">{t('quest.basic')}</SelectItem>
                        <SelectItem value="intermediate">{t('quest.intermediate')}</SelectItem>
                        <SelectItem value="hard">{t('quest.hard')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="targetValue" className="text-foreground">{t('quest.targetValue')}</Label>
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
                      className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject" className="text-foreground">{t('quest.subject')}</Label>
                    <Select value={newQuest.subject_id} onValueChange={(value) => setNewQuest({ ...newQuest, subject_id: value })}>
                      <SelectTrigger className="bg-background border-input text-foreground">
                        <SelectValue placeholder={t('quest.selectSubject')} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="">{t('quest.allSubjects')}</SelectItem>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-foreground mb-2 block">{isSchoolAdmin ? t('quest.assignToStudents') : t('quest.assignToChildren')}</Label>
                  <div className="space-y-2 p-3 bg-muted/30 rounded-md border border-border">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="all-children"
                        checked={newQuest.assigned_children.length === 0}
                        onCheckedChange={(checked) => {
                          setNewQuest({ 
                            ...newQuest, 
                            assigned_children: checked ? [] : (children.length > 0 ? [children[0].id] : [])
                          });
                        }}
                      />
                      <label htmlFor="all-children" className="text-sm text-foreground cursor-pointer">
                        {isSchoolAdmin ? t('quest.allStudents') : t('quest.allChildren')}
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
                          <label htmlFor={`child-${child.id}`} className="text-sm text-foreground cursor-pointer">
                            {child.first_name} {child.last_name}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {isSchoolAdmin ? t('quest.noStudentsLinked') : t('quest.noChildrenLinked')}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  onClick={createQuest}
                  disabled={isCreating || !newQuest.title.trim() || !newQuest.description.trim()}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-button hover:shadow-button-hover"
                >
                  {isCreating ? t('quest.creating') : t('quest.createQuest')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 pr-2 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <Button variant="outline" size="sm" onClick={() => setCreationMethod(null)} className="text-foreground border-border hover:bg-muted">{t('quest.back')}</Button>
                </div>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-foreground font-medium mb-1">{t('quest.aiGenTitle')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('quest.aiGenDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="ai-subject" className="text-foreground">{t('quest.subjectReq')}</Label>
                  <Select value={aiQuestParams.subject_id} onValueChange={(value) => setAiQuestParams({ ...aiQuestParams, subject_id: value })}>
                    <SelectTrigger className="bg-background border-input text-foreground">
                      <SelectValue placeholder={t('quest.selectSubject')} />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="grade-level" className="text-foreground">{t('quest.gradeLevel')}</Label>
                  <Input
                    id="grade-level"
                    value={aiQuestParams.grade_level}
                    onChange={(e) => setAiQuestParams({ ...aiQuestParams, grade_level: e.target.value })}
                    placeholder={t('quest.gradePlaceholder')}
                    className="bg-background border-input text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="ai-type" className="text-foreground">{t('quest.type')}</Label>
                    <Select value={aiQuestParams.type} onValueChange={(value: 'daily' | 'weekly') => setAiQuestParams({ ...aiQuestParams, type: value })}>
                      <SelectTrigger className="bg-background border-input text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="daily">{t('quest.daily')}</SelectItem>
                        <SelectItem value="weekly">{t('quest.weekly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ai-difficulty" className="text-foreground">{t('quest.difficulty')}</Label>
                    <Select value={aiQuestParams.difficulty} onValueChange={(value: 'basic' | 'intermediate' | 'hard') => setAiQuestParams({ ...aiQuestParams, difficulty: value })}>
                      <SelectTrigger className="bg-background border-input text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="basic">{t('quest.basic')}</SelectItem>
                        <SelectItem value="intermediate">{t('quest.intermediate')}</SelectItem>
                        <SelectItem value="hard">{t('quest.hard')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quest-count" className="text-foreground">{t('quest.count')}</Label>
                    <Input
                      id="quest-count"
                      type="number"
                      min="1"
                      max="10"
                      value={aiQuestParams.count}
                      onChange={(e) => setAiQuestParams({ ...aiQuestParams, count: parseInt(e.target.value) || 3 })}
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-foreground mb-2 block">{isSchoolAdmin ? t('quest.assignToStudents') : t('quest.assignToChildren')}</Label>
                  <div className="space-y-2 p-3 bg-muted/30 rounded-md border border-border max-h-40 overflow-y-auto">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ai-all-children"
                        checked={aiQuestParams.assigned_children.length === 0}
                        onCheckedChange={(checked) => {
                          setAiQuestParams({ 
                            ...aiQuestParams, 
                            assigned_children: checked ? [] : (children.length > 0 ? [children[0].id] : [])
                          });
                        }}
                      />
                      <label htmlFor="ai-all-children" className="text-sm text-foreground cursor-pointer">
                        {isSchoolAdmin ? t('quest.allStudents') : t('quest.allChildren')}
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
                        <label htmlFor={`ai-child-${child.id}`} className="text-sm text-foreground cursor-pointer">
                          {child.first_name} {child.last_name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={generateAIQuests} disabled={isGenerating} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('quest.generating')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {t('quest.generatePre')} {aiQuestParams.count} {aiQuestParams.count > 1 ? t('quest.questsWord') : t('quest.questWord')}
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
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">{t('quest.availableSubjects')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <Badge key={subject.id} variant="secondary">
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
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('quest.empty')}</p>
              <p className="text-muted-foreground text-sm mt-2">
                {t('quest.emptyHint')}
              </p>
            </CardContent>
          </Card>
        ) : (
          quests.map((quest) => (
            <Card key={quest.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium text-foreground">{quest.title}</h3>
                      <Badge variant={quest.type === 'daily' ? 'default' : 'secondary'}>
                        {t(QUEST_TYPE_KEY[quest.type] || 'quest.daily')}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {t(QUEST_DIFF_KEY[quest.difficulty] || 'quest.basic')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{quest.description}</p>
                    
                    {/* Progress */}
                    <div className="bg-muted rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-2 gap-4 mb-2">
                        <div className="text-center">
                          <div className="text-sm font-semibold text-primary">
                            {Number(quest.progress_stats?.average_progress ?? 0).toFixed(1)}/{quest.target_value}
                          </div>
                          <div className="text-xs text-muted-foreground">{t('quest.avgProgress')}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {quest.progress_stats ? `${quest.progress_stats.completion_rate}%` : '0%'}
                          </div>
                          <div className="text-xs text-muted-foreground">{t('quest.completionRate')}</div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{t('quest.overallProgress')}</span>
                          <span>{quest.progress_stats ? `${quest.progress_stats.active_users} ${t('quest.activeUsersSuffix')}` : t('quest.noParticipants')}</span>
                        </div>
                        <Progress 
                          value={((quest.progress_stats?.average_progress ?? 0) / quest.target_value) * 100} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>{t('quest.targetPrefix')} {quest.target_value}</span>
                      {quest.subjects && <span>{t('quest.subjectPrefix')} {quest.subjects.name}</span>}
                      <span>{t('quest.createdPrefix')} {new Date(quest.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Badge variant={quest.is_active ? 'default' : 'secondary'}>
                      {quest.is_active ? t('quest.active') : t('quest.inactive')}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleQuestStatus(quest.id, quest.is_active)}
                      className="text-foreground border-border hover:bg-muted"
                    >
                      {quest.is_active ? t('quest.deactivate') : t('quest.activate')}
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
