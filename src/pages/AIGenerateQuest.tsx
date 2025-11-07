import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQuestManagement } from '@/hooks/useQuestManagement';

const AIGenerateQuest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createQuest } = useQuestManagement();
  
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [type, setType] = useState('daily');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(3);
  const [assignToAll, setAssignToAll] = useState(true);
  const [children, setChildren] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;
      try {
        const { data: rels, error: relError } = await supabase
          .from('parent_child_relationships')
          .select('child_id')
          .eq('parent_id', user.id);

        if (relError) throw relError;

        const childIds = (rels || []).map((r: any) => r.child_id).filter(Boolean);

        if (childIds.length === 0) {
          // Fallback: legacy children table
          const { data: kids, error: kidsErr } = await supabase
            .from('children')
            .select('id, first_name, last_name')
            .eq('parent_id', user.id);
          if (!kidsErr && kids && kids.length > 0) {
            const mappedKids = kids.map((c: any) => ({
              id: c.id as string,
              name: [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Child',
            }));
            setChildren(mappedKids);
          } else {
            setChildren([]);
          }
          return;
        }

        const { data: profiles, error: profError } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', childIds);

        if (profError) throw profError;

        const mapped = (profiles || []).map((p: any) => ({
          id: p.id as string,
          name: p.display_name || 'Child',
        }));

        setChildren(mapped);
      } catch (err: any) {
        console.error('Error fetching children:', err);
      }
    };
    fetchChildren();
  }, [user]);

  // Ensure "All Children" stays selected when no children are linked
  useEffect(() => {
    if (children.length === 0 && !assignToAll) {
      setAssignToAll(true);
      setSelectedChildren([]);
    }
  }, [children.length, assignToAll]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject || !gradeLevel) {
      toast({ title: 'Missing fields', description: 'Please fill in subject and grade level.', variant: 'destructive' });
      return;
    }

    if (!assignToAll && selectedChildren.length === 0) {
      toast({ title: 'Select children', description: 'Choose at least one child or select "All Children".', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-quest', {
        body: { 
          subject,
          gradeLevel,
          type,
          difficulty,
          count,
          userId: user?.id 
        }
      });

      if (error) {
        console.error('Quest generation error:', error);
        throw new Error(error.message || 'Failed to generate quests');
      }

      if (data?.error) {
        console.error('Quest generation API error:', data.error);
        throw new Error(data.error);
      }

      if (data?.quests && Array.isArray(data.quests)) {
        const assignedChildren = assignToAll ? null : selectedChildren;
        
        for (const questData of data.quests) {
          await createQuest({
            title: questData.title,
            description: questData.description,
            type: questData.type || type,
            difficulty: questData.difficulty || difficulty,
            target_value: questData.target_value || 1,
            rewards: questData.rewards || { xp: difficulty === 'easy' ? 10 : difficulty === 'medium' ? 25 : 50 },
            requirements: questData.requirements || {},
            assigned_children: assignedChildren
          });
        }

        toast({ title: `${data.quests.length} quests created!`, description: 'Your AI-generated quests have been created.' });
        navigate('/quests/made-by-me');
      } else {
        throw new Error('No quest data returned');
      }
    } catch (error: any) {
      console.error('Error generating quests:', error);
      toast({ 
        title: 'Generation failed', 
        description: error.message || 'Could not generate quests. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/quests')}
            className="text-foreground hover:bg-muted"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quests
          </Button>

          <Card className="bg-card border-border backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                AI Quest Generation
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Generate multiple quests automatically based on subject, grade level, and difficulty. The AI will create engaging, curriculum-aligned quests for your students.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-foreground">Subject *</Label>
                  <Select value={subject} onValueChange={setSubject} required>
                    <SelectTrigger className="bg-background border-input">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mathematics">Mathematics</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="history">History</SelectItem>
                      <SelectItem value="geography">Geography</SelectItem>
                      <SelectItem value="art">Art</SelectItem>
                      <SelectItem value="music">Music</SelectItem>
                      <SelectItem value="physical_education">Physical Education</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gradeLevel" className="text-foreground">Grade Level</Label>
                  <Input
                    id="gradeLevel"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    placeholder="e.g., 6th grade, high school"
                    required
                    className="bg-background border-input"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Difficulty</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Intermediate</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="count" className="text-foreground">Count</Label>
                    <Input
                      id="count"
                      type="number"
                      min="1"
                      max="10"
                      value={count}
                      onChange={(e) => setCount(parseInt(e.target.value))}
                      required
                      className="bg-background border-input"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-foreground">Assign to Children</Label>
                  <div className="flex items-center justify-between bg-muted p-3 rounded-lg border border-border">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="assign-all"
                        checked={assignToAll}
                        disabled={children.length === 0}
                        onCheckedChange={(checked) => {
                          setAssignToAll(Boolean(checked));
                          if (checked) setSelectedChildren([]);
                        }}
                      />
                      <Label htmlFor="assign-all" className="text-foreground cursor-pointer">All Children</Label>
                    </div>
                    {children.length === 0 && (
                      <span className="text-xs text-muted-foreground">No children linked</span>
                    )}
                  </div>

                  {!assignToAll && children.length > 0 && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {children.map((child) => {
                        const checked = selectedChildren.includes(child.id);
                        return (
                          <div key={child.id} className="flex items-center space-x-2 bg-muted p-3 rounded-lg">
                            <Checkbox
                              id={`child-${child.id}`}
                              checked={checked}
                              onCheckedChange={(c) => {
                                const isChecked = Boolean(c);
                                setSelectedChildren((prev) =>
                                  isChecked ? [...prev, child.id] : prev.filter((id) => id !== child.id)
                                );
                              }}
                            />
                            <Label htmlFor={`child-${child.id}`} className="text-foreground cursor-pointer">{child.name}</Label>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {children.length === 0 && (
                    <Alert className="bg-primary/10 border-primary/20">
                      <AlertDescription className="flex items-center justify-between gap-4">
                        <span>No children connected yet. Connect children to assign specifically.</span>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => navigate('/monitoring')}
                          className="bg-muted hover:bg-muted/80 border-border"
                        >
                          Manage Children
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isGenerating ? 'Generating...' : `Generate ${count} Quest${count > 1 ? 's' : ''}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AIGenerateQuest;
