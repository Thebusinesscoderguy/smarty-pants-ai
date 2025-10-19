import React, { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useQuestManagement } from '@/hooks/useQuestManagement';
import { ArrowLeft } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const CreateQuest = () => {
  const navigate = useNavigate();
  const { createQuest } = useQuestManagement();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'daily',
    difficulty: 'medium',
    target_value: 1,
    expires_at: ''
  });

  // Assignment state
  const { user } = useAuth();
  const [assignMode, setAssignMode] = useState<'all' | 'specific'>('all');
  const [children, setChildren] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;
      try {
        console.log('CreateQuest: fetching children for parent', user.id);
        const { data: rels, error: relError } = await supabase
          .from('parent_child_relationships')
          .select('child_id')
          .eq('parent_id', user.id);

        console.log('CreateQuest: parent_child_relationships count', rels?.length, 'error', relError);

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

        let mapped: Array<{ id: string; name: string }> = [];
        try {
          const { data: profiles, error: profError } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', childIds);

          if (profError) throw profError;

          mapped = (profiles || []).map((p: any) => ({
            id: p.id as string,
            name: p.display_name || 'Child',
          }));
        } catch (profileErr) {
          console.warn('Profiles not accessible via RLS, falling back to IDs');
          mapped = childIds.map((id: string) => ({ id, name: 'Child' }));
        }
        setChildren(mapped);
      } catch (err: any) {
        console.error('Error fetching children:', err);
        toast({ title: 'Could not load children', description: err?.message || 'Please try again.', variant: 'destructive' });
        setChildren([]);
      }
    };
    fetchChildren();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate selection when assigning to specific children
      if (assignMode === 'specific' && selectedChildren.length === 0) {
        toast({ title: 'Select children', description: 'Choose at least one child to assign this quest.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }

      await createQuest({
        ...formData,
        target_value: Number(formData.target_value),
        rewards: { xp: formData.difficulty === 'easy' ? 10 : formData.difficulty === 'medium' ? 25 : 50 },
        requirements: {},
        assigned_children: assignMode === 'specific' ? selectedChildren : null
      });

      navigate('/quests/made-by-me');
    } catch (error) {
      console.error('Error creating quest:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/quests')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quests
          </Button>

          <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Create New Quest</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">Quest Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter quest title"
                    required
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the quest"
                    required
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-white">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty" className="text-white">Difficulty</Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_value" className="text-white">Target Value</Label>
                  <Input
                    id="target_value"
                    type="number"
                    min="1"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: parseInt(e.target.value) })}
                    required
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires_at" className="text-white">Expiration Date (Optional)</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-white">Assign to</Label>
                  <RadioGroup value={assignMode} onValueChange={(v) => setAssignMode(v as 'all' | 'specific')} className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="assign-all" />
                      <Label htmlFor="assign-all" className="text-white">All children</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="specific" id="assign-specific" />
                      <Label htmlFor="assign-specific" className="text-white">Select specific</Label>
                    </div>
                  </RadioGroup>

                  {assignMode === 'specific' && (
                    children.length === 0 ? (
                      <p className="text-white/70 text-sm">No children connected yet. Connect children to assign specifically.</p>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {children.map((child) => {
                          const checked = selectedChildren.includes(child.id);
                          return (
                            <div key={child.id} className="flex items-center space-x-2">
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
                              <Label htmlFor={`child-${child.id}`} className="text-white">{child.name}</Label>
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Quest'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/quests')}
                    className="border-white/20 text-white hover:bg-white/20"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreateQuest;
