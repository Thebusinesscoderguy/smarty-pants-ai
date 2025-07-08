
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, RefreshCw, Brain, Target, TrendingUp } from 'lucide-react';
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

export const StudentAnalyticsView = () => {
  const [students, setStudents] = useState<RealStudentAnalytics[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [insight, setInsight] = useState<string>('');
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

    } catch (error: any) {
      console.error('Error fetching student analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load student analytics",
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
      setInsight('Unable to generate personalized insight at this time.');
    }
  };

  const handleGenerateAISummary = async (studentId: string) => {
    try {
      await generateAISummary(studentId);
      toast({
        title: "Success",
        description: "AI summary generated successfully",
      });
    } catch (error) {
      console.error('Error generating AI summary:', error);
    }
  };

  const selectedStudentData = students.find(s => s.studentId === selectedStudent);
  const selectedStudentSummary = selectedStudent ? getSummaryForStudent(selectedStudent) : null;

  if (isLoading) {
    return <div className="animate-pulse">Loading student analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Student Analytics & Management</h2>
          <p className="text-gray-400">AI-powered insights, classifications, and targeted content distribution</p>
        </div>
        
        <div className="flex gap-4">
          <Button onClick={fetchStudentAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white w-48">
              <SelectValue placeholder="Select student" />
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
            AI Analytics
          </TabsTrigger>
          <TabsTrigger value="classifications" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Classifications
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Content Assignments
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          {students.length === 0 ? (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300">No students found.</p>
                <p className="text-gray-400 text-sm mt-2">
                  Invite students to start tracking their progress and analytics.
                </p>
              </CardContent>
            </Card>
          ) : selectedStudentData ? (
            <div className="grid gap-6">
              {/* AI-Generated Comprehensive Summary */}
              {selectedStudentSummary ? (
                <Card className="bg-white/10 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        AI-Generated Student Summary
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateAISummary(selectedStudent)}
                      >
                        Regenerate
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                      {selectedStudentSummary.summary_text}
                    </div>
                    
                    {/* Strengths Progress Bars */}
                    {selectedStudentSummary.strengths.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-white font-medium">Key Strengths</h4>
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
                        <h4 className="text-white font-medium">Areas for Improvement</h4>
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
                      <Card className="bg-white/5 border-white/10">
                        <CardContent className="p-4 space-y-2">
                          <h4 className="text-white font-medium">Improvement Plan</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Overall Trend:</span>
                              <span className="text-white ml-2 capitalize">
                                {selectedStudentSummary.improvement_metrics.overall_trend}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Timeline:</span>
                              <span className="text-white ml-2">
                                {selectedStudentSummary.improvement_metrics.estimated_improvement_timeline}
                              </span>
                            </div>
                          </div>
                          {selectedStudentSummary.improvement_metrics.recommended_actions && (
                            <div>
                              <span className="text-gray-400">Recommended Actions:</span>
                              <ul className="text-white ml-4 mt-1">
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
                <Card className="bg-white/10 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Generate AI Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-400 mb-4">No AI summary available for this student</p>
                    <Button onClick={() => handleGenerateAISummary(selectedStudent)}>
                      Generate AI Summary
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Quick AI Insight */}
              {insight && (
                <Card className="bg-white/10 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Quick AI Insight</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 text-sm leading-relaxed">{insight}</p>
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
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300">Select a student to view detailed analytics</p>
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
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">System Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-white">{students.length}</div>
                      <div className="text-sm text-gray-400">Total Students</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-white">{summaries.length}</div>
                      <div className="text-sm text-gray-400">AI Summaries</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-white">
                        {students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.completionPercentage, 0) / students.length) : 0}%
                      </div>
                      <div className="text-sm text-gray-400">Avg Completion</div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">
                    AI-powered analytics help identify student strengths, weaknesses, and optimal learning paths.
                    Use classifications to organize students and target content effectively.
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
