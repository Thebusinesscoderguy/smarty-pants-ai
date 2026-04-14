import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StudentQuestDisplay } from '@/components/student/StudentQuestDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Target, BookOpen, MessageCircle, Plus, List, BarChart3 } from 'lucide-react';
import { StreakDisplay } from '@/components/gamification/StreakDisplay';
import { ShareableProgressCard } from '@/components/gamification/ShareableProgressCard';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useQuestManagement } from '@/hooks/useQuestManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useViewingMode } from '@/contexts/ViewingModeContext';

const QuestsAchievements = () => {
  const { user } = useAuth();
  const { userRole, loading } = useUserRole();
  const { viewingMode } = useViewingMode();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { createQuest } = useQuestManagement();

  // Redirect only if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isParentView = !loading && userRole === 'parent' && viewingMode.mode === 'parent';

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    // Only parents (in parent view) can deep-link into creating quests.
    if (isParentView && params.get('create') === 'new') {
      setIsCreateDialogOpen(true);
    }
  }, [location.search, isParentView]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'daily',
    difficulty: 'medium',
    target_value: 1,
  });

  const [expirationValue, setExpirationValue] = useState<number>(1);
  const [expirationUnit, setExpirationUnit] = useState<'days' | 'weeks'>('days');

  // Assignment state
  const [assignMode, setAssignMode] = useState<'all' | 'specific'>('all');
  const [children, setChildren] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!user) return;
      try {
        const { data: rels } = await supabase
          .from('parent_child_relationships')
          .select('child_id')
          .eq('parent_id', user.id);

        const childIds = (rels || []).map((r: any) => r.child_id).filter(Boolean);

        if (childIds.length === 0) {
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
        } catch {
          mapped = childIds.map((id: string) => ({ id, name: 'Child' }));
        }
        setChildren(mapped);
      } catch (err: any) {
        console.error('Error fetching children:', err);
        setChildren([]);
      }
    };
    fetchChildren();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isParentView) {
      toast({
        title: 'Not allowed',
        description: 'Only parents can create quests.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (assignMode === 'specific' && selectedChildren.length === 0) {
        toast({
          title: 'Select children',
          description: 'Choose at least one child to assign this quest.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const now = new Date();
      const daysToAdd = expirationUnit === 'days' ? expirationValue : expirationValue * 7;
      const expiresAt = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();

      await createQuest({
        ...formData,
        target_value: Number(formData.target_value),
        rewards: { xp: formData.difficulty === 'easy' ? 10 : formData.difficulty === 'medium' ? 25 : 50 },
        requirements: {},
        assigned_children: assignMode === 'specific' ? selectedChildren : null,
        expires_at: expiresAt,
      });

      setIsCreateDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        type: 'daily',
        difficulty: 'medium',
        target_value: 1,
      });
      setExpirationValue(1);
      setExpirationUnit('days');
      setAssignMode('all');
      setSelectedChildren([]);
    } catch (error) {
      console.error('Error creating quest:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderNavigation = () => (
    <div className="flex justify-center mb-8">
      <div className="flex gap-2 bg-muted/50 backdrop-blur-xl p-2 rounded-lg border border-border">
        <Button onClick={() => navigate('/quiz-generator')} variant="ghost" size="sm" className="text-foreground hover:bg-muted">
          <BookOpen className="mr-2 h-4 w-4" />
          {t('quests.nav.studyTools')}
        </Button>
        <Button onClick={() => navigate('/chat')} variant="ghost" size="sm" className="text-foreground hover:bg-muted">
          <MessageCircle className="mr-2 h-4 w-4" />
          {t('quests.nav.chat')}
        </Button>
        <Button variant="ghost" size="sm" className="text-foreground bg-muted" disabled>
          <Trophy className="mr-2 h-4 w-4" />
          {t('quests.nav.quests')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Navigation */}
          {renderNavigation()}

          {/* Streak & Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StreakDisplay />
            <ShareableProgressCard />
          </div>

          {/* Page Header - Always consistent */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">{t('quests.nav.quests')}</h1>
            <p className="text-xl text-foreground">{t('quests.subtitle')}</p>
          </div>

          {/* Quest Actions - Only for Parents (and only in Parent view) */}
          {isParentView && (
            <div className="flex justify-center gap-4">
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                {t('quests.madeByMe')}
              </Button>
              <Button onClick={() => navigate('/quests/ai-generate')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Target className="mr-2 h-4 w-4" />
                {t('quests.madeByAI')}
              </Button>
              <Button onClick={() => navigate('/quests/made-by-me')} variant="outline" className="border-border text-foreground hover:bg-muted">
                <List className="mr-2 h-4 w-4" />
                {t('quests.viewMyQuests')}
              </Button>
            </div>
          )}

          {/* Create Quest Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('quests.createNew')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('quests.questTitle')}</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t('quests.questTitle')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('quests.description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('quests.description')}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">{t('quests.type')}</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">{t('quests.daily')}</SelectItem>
                        <SelectItem value="weekly">{t('quests.weekly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">{t('quests.difficulty')}</Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">{t('quests.easy')}</SelectItem>
                        <SelectItem value="medium">{t('quests.medium')}</SelectItem>
                        <SelectItem value="hard">{t('quests.hard')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_value">{t('quests.targetValue')}</Label>
                  <Input
                    id="target_value"
                    type="number"
                    min="1"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('quests.expirationQuestion')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={expirationValue.toString()} onValueChange={(value) => setExpirationValue(Number(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={expirationUnit} onValueChange={(value: 'days' | 'weeks') => setExpirationUnit(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">{t('quests.days')}</SelectItem>
                        <SelectItem value="weeks">{t('quests.weeks')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>{t('quests.assignTo')}</Label>
                  <RadioGroup
                    value={assignMode}
                    onValueChange={(v) => setAssignMode(v as 'all' | 'specific')}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="assign-all" />
                      <Label htmlFor="assign-all">{t('quests.allChildren')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="specific" id="assign-specific" />
                      <Label htmlFor="assign-specific">{t('quests.selectSpecific')}</Label>
                    </div>
                  </RadioGroup>

                  {assignMode === 'specific' &&
                    (children.length === 0 ? (
                      <p className="text-muted-foreground text-sm">{t('quests.noChildren')}</p>
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
                              <Label htmlFor={`child-${child.id}`}>{child.name}</Label>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? t('quests.creating') : t('quests.create')}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    {t('quests.cancel')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Quests Section */}
          <Card className="bg-card border-border backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground font-semibold">
                <Target className="h-6 w-6 text-primary" />
                {isParentView ? t('quests.assignedQuests') : t('quests.myQuests')}
              </CardTitle>
              <p className="text-foreground mt-2">{isParentView ? t('quests.viewManageDesc') : t('quests.completeToEarn')}</p>
            </CardHeader>
            <CardContent>
              <StudentQuestDisplay />
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default QuestsAchievements;
