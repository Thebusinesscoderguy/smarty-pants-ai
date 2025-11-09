import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Play, BookOpen, Calendar, Target, List } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import StudyPlanDaySelector from './StudyPlanDaySelector';
import { useLanguage } from '@/contexts/LanguageContext';

interface StudyPlan {
  id: string;
  title: string;
  description: string;
  daily_lessons: any[];
  estimated_duration: number;
  difficulty_level: string;
  grade_level: string;
  region: string;
  status: string;
  created_at: string;
  started_at: string | null;
}

export const StudyPlanLibrary = () => {
  const { t } = useLanguage();
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudyPlan, setSelectedStudyPlan] = useState<StudyPlan | null>(null);
  const [showDaySelector, setShowDaySelector] = useState(false);
  const navigate = useNavigate();

  const fetchStudyPlans = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        toast({
          title: t('studyPlanLibrary.authRequired'),
          description: t('studyPlanLibrary.loginToView'),
          variant: 'destructive',
        });
        // Do not redirect; allow guests to remain on the page
        return;
      }

      const { data, error } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Type cast the data properly to handle the Json type
      const typedPlans: StudyPlan[] = (data || []).map((plan) => ({
        ...plan,
        daily_lessons: Array.isArray(plan.daily_lessons) ? plan.daily_lessons : [],
      }));

      setStudyPlans(typedPlans);
    } catch (error: any) {
      console.error('Error fetching study plans:', error);
      toast({
        title: t('studyPlanLibrary.failedToLoad'),
        description: error.message || t('studyPlan.tryAgain'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudyPlans();
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStartStudyPlan = async (studyPlan: StudyPlan) => {
    // Allow viewing and selecting a day without auth; sign-in will be required when a day is selected
    setSelectedStudyPlan(studyPlan);
    setShowDaySelector(true);
  };

  const handleDeleteStudyPlan = async (planId: string) => {
    if (!confirm(t('studyPlanLibrary.deleteConfirm'))) {
      return;
    }

    try {
      const { error } = await supabase.from('study_plans').delete().eq('id', planId);

      if (error) throw error;

      toast({
        title: t('studyPlanLibrary.planDeleted'),
        description: t('studyPlanLibrary.failedToDelete'),
      });

      // Refresh the list
      fetchStudyPlans();
    } catch (error: any) {
      console.error('Error deleting study plan:', error);
      toast({
        title: t('studyPlanLibrary.failedToDelete'),
        description: error.message || t('studyPlan.tryAgain'),
        variant: 'destructive',
      });
    }
  };

  const handleOpenDaySelector = (studyPlan: StudyPlan) => {
    setSelectedStudyPlan(studyPlan);
    setShowDaySelector(true);
  };

  const handleSelectDay = async (day: number) => {
    if (!selectedStudyPlan) return;

    try {
      // Update study plan status to active if not already
      // Auth is enforced upstream in DaySelector when a day is clicked
      if (selectedStudyPlan.status !== 'active') {
        const { error } = await supabase
          .from('study_plans')
          .update({
            status: 'active',
            started_at: new Date().toISOString(),
          })
          .eq('id', selectedStudyPlan.id);

        if (error) throw error;
      }

      localStorage.setItem('active_study_plan_id', selectedStudyPlan.id);
      navigate(`/modules?day=${day}`);
    } catch (error: any) {
      console.error('Error starting study plan:', error);
      toast({
        title: 'Failed to start study plan',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleContinueStudyPlan = async (studyPlan: StudyPlan) => {
    try {
      // Check authentication first
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        toast({
          title: t('studyPlanLibrary.authRequired'),
          description: t('studyPlanLibrary.loginToView'),
          variant: 'destructive',
        });
        // Do not redirect; allow guests to remain on the page
        return;
      }

      localStorage.setItem('active_study_plan_id', studyPlan.id);

      // Determine next uncompleted day (fallback to 1)
      const lessons = Array.isArray(studyPlan.daily_lessons) ? studyPlan.daily_lessons : [];
      const nextUncompleted = lessons.find((l: any) => !l.completed);
      const nextDay = nextUncompleted ? nextUncompleted.day : 1;

      navigate(`/modules?day=${nextDay}`);
    } catch (error: any) {
      console.error('Error continuing study plan:', error);
      toast({
        title: 'Failed to continue study plan',
        description: 'Please try logging in again',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('parentDashboard.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  if (studyPlans.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">{t('studyPlanLibrary.noPlans')}</h3>
          <p className="text-muted-foreground">{t('studyPlanLibrary.noPlansDesc')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('studyPlanLibrary.title')}</h2>
        <Badge variant="outline">{t('studyPlanLibrary.plans').replace('{count}', studyPlans.length.toString())}</Badge>
      </div>

      <div className="grid gap-4">
        {studyPlans.map((plan) => {
          const dailyLessonsArray = Array.isArray(plan.daily_lessons) ? plan.daily_lessons : [];
          const isStarted = plan.status === 'active' || plan.started_at;
          const completedCount = dailyLessonsArray.filter((l: any) => l.completed).length;
          const progressPct = dailyLessonsArray.length ? Math.round((completedCount / dailyLessonsArray.length) * 100) : 0;

          return (
            <Card key={plan.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{plan.title}</CardTitle>
                    {plan.description && (
                      <CardDescription className="mt-1 line-clamp-2">{plan.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getDifficultyColor(plan.difficulty_level)}>
                      {plan.difficulty_level}
                    </Badge>
                    <Badge className={getStatusColor(plan.status)}>
                      {plan.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Plan Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{plan.estimated_duration} days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span>{dailyLessonsArray.length} lessons</span>
                    </div>
                    {plan.grade_level && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span>Grade {plan.grade_level}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    {isStarted ? (
                      <>
                        <Button onClick={() => handleContinueStudyPlan(plan)} className="flex-1">
                          <Play className="mr-2 h-4 w-4" />
                          {t('studyPlanLibrary.continuePlan')}
                        </Button>
                        <Button variant="outline" onClick={() => handleOpenDaySelector(plan)} className="px-3">
                          <List className="mr-2 h-4 w-4" />
                          {t('studyPlanLibrary.viewPlan')}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={() => handleStartStudyPlan(plan)} className="flex-1">
                          <Play className="mr-2 h-4 w-4" />
                          {t('studyPlanLibrary.startPlan')}
                        </Button>
                        <Button variant="outline" onClick={() => handleOpenDaySelector(plan)} className="px-3">
                          <List className="mr-2 h-4 w-4" />
                          {t('studyPlanLibrary.viewPlan')}
                        </Button>
                      </>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteStudyPlan(plan.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Study Plan Progress */}
                  {isStarted && (
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>
                          {completedCount}/{dailyLessonsArray.length} lessons completed
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <StudyPlanDaySelector
        studyPlan={selectedStudyPlan}
        isOpen={showDaySelector}
        onClose={() => setShowDaySelector(false)}
        onSelectDay={handleSelectDay}
      />
    </div>
  );
};
