
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, RefreshCw, Brain, Target, TrendingUp, Mail, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { StrengthsWeaknessesChart } from '@/components/analytics/StrengthsWeaknessesChart';
import { ProgressBrief } from '@/components/analytics/ProgressBrief';
import { ProgressBar } from '@/components/analytics/ProgressBar';
import { StudentClassificationManager } from '@/components/admin/StudentClassificationManager';
import { ContentAssignmentManager } from '@/components/admin/ContentAssignmentManager';
import { RealAnalyticsService, RealStudentAnalytics } from '@/services/realAnalyticsService';
import { useAISummaries } from '@/hooks/useAISummaries';
import { useLanguage } from '@/contexts/LanguageContext';

export const StudentAnalyticsView = () => {
  const { t } = useLanguage();
  const [students, setStudents] = useState<RealStudentAnalytics[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [insight, setInsight] = useState<string>('');
  const [pendingInvitations, setPendingInvitations] = useState<Array<{id: string; email: string; first_name: string | null; last_name: string | null; created_at: string | null}>>([]);
  const { user } = useAuth();
  const { summaries, generateAISummary, getSummaryForStudent } = useAISummaries();

  useEffect(() => {
    fetchStudentAnalytics();
  }, [user]);

  useEffect(() => {
    if (selectedStudent) {
      generateInsight(selectedStudent);
    }
  }, [selectedStudent]);

  const fetchStudentAnalytics = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Get school account
      const { data: schoolData, error: schoolError } = await supabase
        .from('school_accounts')
        .select('id')
        .eq('admin_user_id', user.id)
        .single();

      if (schoolError) throw schoolError;

      // Get real analytics data
      const realAnalytics = await RealAnalyticsService.getAllStudentsAnalytics(schoolData.id);
      
      setStudents(realAnalytics);
      if (realAnalytics.length > 0) {
        setSelectedStudent(realAnalytics[0].studentId);
      }

      // Get pending invitations
      const { data: invitations } = await supabase
        .from('student_invitations')
        .select('id, email, first_name, last_name, created_at')
        .eq('school_id', schoolData.id)
        .eq('used', false)
        .order('created_at', { ascending: false });

      setPendingInvitations(invitations || []);

    } catch (error: any) {
      console.error('Error fetching student analytics:', error);
      toast({
        title: t('sa.error'),
        description: t('sa.failedLoad'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateInsight = async (studentId: string) => {
    try {
      const personalizedInsight = await RealAnalyticsService.generatePersonalizedInsight(studentId);
      setInsight(personalizedInsight);
    } catch (error) {
      console.error('Error generating insight:', error);
      setInsight(t('sa.insightUnavailable'));
    }
  };

  const handleGenerateAISummary = async (studentId: string) => {
    try {
      await generateAISummary(studentId);
      toast({
        title: t('sa.success'),
        description: t('sa.summaryGenerated'),
      });
    } catch (error) {
      console.error('Error generating AI summary:', error);
    }
  };

  const selectedStudentData = students.find(s => s.studentId === selectedStudent);
  const selectedStudentSummary = selectedStudent ? getSummaryForStudent(selectedStudent) : null;

  if (isLoading) {
    return <div className="animate-pulse">{t('sa.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('sa.title')}</h2>
          <p className="text-muted-foreground">{t('sa.subtitle')}</p>
        </div>

        <div className="flex gap-4">
          <Button onClick={fetchStudentAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('sa.refresh')}
          </Button>

          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('sa.selectStudent')} />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.studentId} value={student.studentId}>
                  {student.studentName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            {t('sa.tabAiAnalytics')}
          </TabsTrigger>
          <TabsTrigger value="classifications" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            {t('sa.tabClassifications')}
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('sa.tabAssignments')}
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('sa.tabOverview')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          {students.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground font-medium">{t('sa.noStudents')}</p>
                <p className="text-muted-foreground text-sm mt-2">
                  {t('sa.noStudentsHint')}
                </p>
                {pendingInvitations.length > 0 && (
                  <div className="mt-6 text-left">
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      {t('sa.pendingInvitations')} ({pendingInvitations.length})
                    </h4>
                    <div className="space-y-2">
                      {pendingInvitations.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {inv.first_name || inv.last_name
                                  ? `${inv.first_name || ''} ${inv.last_name || ''}`.trim()
                                  : inv.email}
                              </p>
                              <p className="text-xs text-muted-foreground">{inv.email}</p>
                            </div>
                          </div>
                          <Badge variant="secondary">{t('sa.pending')}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : selectedStudentData ? (
            <div className="grid gap-6">
              {/* AI-Generated Comprehensive Summary */}
              {selectedStudentSummary ? (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        {t('sa.aiSummaryTitle')}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateAISummary(selectedStudent)}
                      >
                        {t('sa.regenerate')}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                      {selectedStudentSummary.summary_text}
                    </div>
                    
                    {/* Strengths Progress Bars */}
                    {selectedStudentSummary.strengths.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-foreground font-medium">{t('sa.keyStrengths')}</h4>
                        {selectedStudentSummary.strengths.slice(0, 4).map((strength, index) => {
                          const strengthData = selectedStudentData.topicPerformance.find(t => t.topic.toLowerCase().includes(strength.toLowerCase()));
                          return (
                            <ProgressBar
                              key={strength}
                              label={strength}
                              value={strengthData?.current_score || 75 + (index * 5)}
                              type="strength"
                              showTrend={true}
                              trendDirection="up"
                              animated={true}
                            />
                          );
                        })}
                      </div>
                    )}

                    {/* Weaknesses Progress Bars */}
                    {selectedStudentSummary.weaknesses.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-foreground font-medium">{t('sa.areasForImprovement')}</h4>
                        {selectedStudentSummary.weaknesses.slice(0, 4).map((weakness, index) => {
                          const weaknessData = selectedStudentData.topicPerformance.find(t => t.topic.toLowerCase().includes(weakness.toLowerCase()));
                          return (
                            <ProgressBar
                              key={weakness}
                              label={weakness}
                              value={weaknessData?.current_score || 35 + (index * 10)}
                              type="weakness"
                              showTrend={true}
                              trendDirection={weaknessData?.improvement > 0 ? "up" : "stable"}
                              animated={true}
                            />
                          );
                        })}
                      </div>
                    )}

                    {/* Improvement Metrics */}
                    {selectedStudentSummary.improvement_metrics && (
                      <Card className="bg-muted/50 border-border">
                        <CardContent className="p-4 space-y-2">
                          <h4 className="text-foreground font-medium">{t('sa.improvementPlan')}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">{t('sa.overallTrend')}</span>
                              <span className="text-foreground ml-2 capitalize">
                                {selectedStudentSummary.improvement_metrics.overall_trend}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t('sa.timeline')}</span>
                              <span className="text-foreground ml-2">
                                {selectedStudentSummary.improvement_metrics.estimated_improvement_timeline}
                              </span>
                            </div>
                          </div>
                          {selectedStudentSummary.improvement_metrics.recommended_actions && (
                            <div>
                              <span className="text-muted-foreground">{t('sa.recommendedActions')}</span>
                              <ul className="text-foreground ml-4 mt-1">
                                {selectedStudentSummary.improvement_metrics.recommended_actions.map((action: string, index: number) => (
                                  <li key={index} className="text-sm">• {action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      {t('sa.generateAiSummary')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground mb-4">{t('sa.noAiSummary')}</p>
                    <Button onClick={() => handleGenerateAISummary(selectedStudent)}>
                      {t('sa.generateAiSummary')}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Quick AI Insight */}
              {insight && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">{t('sa.quickInsight')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">{insight}</p>
                  </CardContent>
                </Card>
              )}

              {/* Progress Brief */}
              <ProgressBrief
                studentName={selectedStudentData.studentName}
                completionPercentage={selectedStudentData.completionPercentage}
                totalTimeSpent={selectedStudentData.totalTimeSpent}
                strengths={selectedStudentData.strengths}
                weakAreas={selectedStudentData.weakAreas}
                lastActivity={selectedStudentData.lastActivity}
              />
              
              {/* Strengths & Weaknesses Chart */}
              <StrengthsWeaknessesChart
                studentId={selectedStudentData.studentId}
                studentName={selectedStudentData.studentName}
                data={selectedStudentData.topicPerformance}
              />
            </div>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground">{t('sa.selectToView')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="classifications">
          <StudentClassificationManager />
        </TabsContent>

        <TabsContent value="assignments">
          <ContentAssignmentManager />
        </TabsContent>

        <TabsContent value="management">
          <div className="grid gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">{t('sa.systemOverview')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-muted/50 border-border">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-foreground">{students.length}</div>
                      <div className="text-sm text-muted-foreground">{t('sa.totalStudents')}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50 border-border">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-foreground">{summaries.length}</div>
                      <div className="text-sm text-muted-foreground">{t('sa.aiSummaries')}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50 border-border">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.completionPercentage, 0) / students.length) : 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">{t('sa.avgCompletion')}</div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">
                    {t('sa.overviewNote')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
