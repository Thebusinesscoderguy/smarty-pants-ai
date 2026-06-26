import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMonitoringData } from '@/hooks/useMonitoringData';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  BookOpen, 
  Download, 
  UserPlus,
  BarChart3,
  Brain,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Activity
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export const EnhancedStudentDashboard = () => {
  const { t } = useLanguage();
  const {
    studentProgress,
    overviewStats,
    loading,
    fetchStudentProgress
  } = useMonitoringData();
  
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const filteredStudents = studentProgress
    .filter(student => 
      student.student_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return b.completion_percentage - a.completion_percentage;
        case 'time':
          return b.total_time_spent - a.total_time_spent;
        case 'activity':
          return new Date(b.last_activity || 0).getTime() - new Date(a.last_activity || 0).getTime();
        default:
          return a.student_name.localeCompare(b.student_name);
      }
    });

  const handleExportData = () => {
    const csvContent = studentProgress.map(student => ({
      Name: student.student_name,
      Progress: `${student.completion_percentage}%`,
      CompletedLessons: student.completed_lessons,
      TotalLessons: student.total_lessons,
      StudyTime: `${Math.round(student.total_time_spent / 60)}h`,
      LastActivity: student.last_activity || 'No recent activity',
      Strengths: student.strengths.join('; '),
      WeakAreas: student.weak_areas.join('; ')
    }));

    const headers = Object.keys(csvContent[0]).join(',') + '\n';
    const csv = headers + csvContent.map(row => Object.values(row).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-dashboard-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: t('cmd.exportSuccess'),
      description: t('esd.exportSuccessDesc'),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">{t('esd.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('esd.title')}</h1>
          <p className="text-muted-foreground">
            {t('esd.subtitle')}
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleExportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('esd.exportData')}
          </Button>
          <Button onClick={fetchStudentProgress}>
            <Activity className="h-4 w-4 mr-2" />
            {t('cmd.refresh')}
          </Button>
        </div>
      </div>

      {/* Enhanced Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('cmd.totalStudents')}</p>
                <p className="text-2xl font-bold">{overviewStats?.totalStudents || 0}</p>
                <p className="text-xs text-green-600">{t('esd.plus2ThisWeek')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('cmd.avgProgress')}</p>
                <p className="text-2xl font-bold">{overviewStats?.avgCompletion || 0}%</p>
                <p className="text-xs text-green-600">{t('esd.plus5LastMonth')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('cmd.studyHours')}</p>
                <p className="text-2xl font-bold">{overviewStats?.totalStudyTime || 0}h</p>
                <p className="text-xs text-blue-600">{t('cmd.thisMonth')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-500/10 rounded-lg">
                <Target className="h-6 w-6 text-violet-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('esd.quests')}</p>
                <p className="text-2xl font-bold">{overviewStats?.totalQuests || 0}</p>
                <p className="text-xs text-violet-600">{t('esd.activeQuests')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder={t('cmd.searchStudents')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="name">{t('cmd.sortName')}</option>
                <option value="progress">{t('cmd.sortProgress')}</option>
                <option value="time">{t('cmd.sortTime')}</option>
                <option value="activity">{t('cmd.sortActivity')}</option>
              </select>
              
              <select
                value={selectedTimeFrame}
                onChange={(e) => setSelectedTimeFrame(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="week">{t('cmd.thisWeek')}</option>
                <option value="month">{t('cmd.thisMonthOpt')}</option>
                <option value="quarter">{t('cmd.thisQuarter')}</option>
                <option value="year">{t('cmd.thisYear')}</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {t('cmd.analyticsTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('cmd.noStudents')}</h3>
              <p className="text-muted-foreground">
                {searchTerm ? t('cmd.adjustSearch') : t('cmd.addStudents')}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredStudents.map((student) => (
                <Card key={student.student_id} className="border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <Tabs defaultValue="overview" className="w-full">
                      <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                        <div className="mb-4 md:mb-0">
                          <h3 className="text-xl font-semibold">{student.student_name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {t('cmd.lastActive')} {student.last_activity ?
                                new Date(student.last_activity).toLocaleDateString() :
                                t('cmd.noRecentActivity')
                              }
                            </span>
                            <Badge
                              variant={student.completion_percentage >= 80 ? "default" :
                                       student.completion_percentage >= 60 ? "secondary" : "destructive"}
                            >
                              {student.completion_percentage >= 80 ? t('cmd.excellent') :
                               student.completion_percentage >= 60 ? t('cmd.good') : t('cmd.needsAttention')}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">{t('cmd.overview')}</TabsTrigger>
                        <TabsTrigger value="performance">{t('esd.performance')}</TabsTrigger>
                        <TabsTrigger value="insights">{t('cmd.insights')}</TabsTrigger>
                        <TabsTrigger value="recommendations">{t('esd.recommendations')}</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span>{t('cmd.overallProgress')}</span>
                              <span>{student.completion_percentage}%</span>
                            </div>
                            <Progress value={student.completion_percentage} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {student.completed_lessons} {t('cmd.ofWord')} {student.total_lessons} {t('cmd.lessonsCompletedSuffix')}
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">{t('cmd.studyTime')}</p>
                            <p className="text-3xl font-bold text-primary">
                              {Math.round(student.total_time_spent / 60)}h
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {student.total_time_spent % 60}{t('esd.mAdditional')}
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">{t('cmd.subjects')}</p>
                            <p className="text-3xl font-bold text-secondary">
                              {student.subjects.length}
                            </p>
                            <p className="text-xs text-muted-foreground">{t('esd.activeSubjects')}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {student.subjects.map((subject, index) => (
                            <Card key={index} className="p-4">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-medium">{subject.subject_name}</h4>
                                  <span className="text-sm text-muted-foreground">
                                    {subject.completion_percentage}%
                                  </span>
                                </div>
                                <Progress value={subject.completion_percentage} className="h-2" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{subject.lessons_completed}/{subject.total_lessons} {t('cmd.lessonsWord')}</span>
                                  <span>{Math.round(subject.time_spent / 60)}h {subject.time_spent % 60}m</span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="performance" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card className="p-4">
                            <h4 className="font-medium text-green-600 mb-3 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              {t('esd.topStrengths')}
                            </h4>
                            <div className="space-y-2">
                              {student.strengths.slice(0, 5).map((strength, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                                  <span className="text-sm">{strength}</span>
                                  <Badge variant="outline" className="bg-green-100">{t('esd.strong')}</Badge>
                                </div>
                              ))}
                            </div>
                          </Card>
                          
                          <Card className="p-4">
                            <h4 className="font-medium text-violet-600 mb-3 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              {t('esd.improvementAreas')}
                            </h4>
                            <div className="space-y-2">
                              {student.weak_areas.slice(0, 5).map((area, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-violet-50 rounded">
                                  <span className="text-sm">{area}</span>
                                  <Badge variant="outline" className="bg-violet-100">{t('esd.focus')}</Badge>
                                </div>
                              ))}
                            </div>
                          </Card>
                        </div>
                      </TabsContent>

                      <TabsContent value="insights" className="space-y-6">
                        <Card className="p-6">
                          <h4 className="font-medium mb-4 flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            {t('esd.aiInsights')}
                          </h4>
                          <div className="prose prose-sm max-w-none">
                            <p className="text-muted-foreground leading-relaxed">
                              {student.student_name} {t('esd.iShows')} {student.completion_percentage >= 80 ? t('esd.iExcellent') :
                               student.completion_percentage >= 60 ? t('esd.iGood') : t('esd.iDeveloping')} {t('esd.iEngagement')}
                              {student.strengths.length > 0 && ` ${t('esd.iStrongPerf')} ${student.strengths.slice(0, 2).join(` ${t('esd.andWord')} `)}.`}
                              {student.weak_areas.length > 0 && ` ${t('esd.iRecFocus')} ${student.weak_areas.slice(0, 2).join(` ${t('esd.andWord')} `)}.`}
                              {' '}{t('esd.iStudyTimeOf')} {Math.round(student.total_time_spent / 60)} {t('esd.iHoursIndicates')}{' '}
                              {student.total_time_spent > 600 ? t('esd.iExcellent') : student.total_time_spent > 300 ? t('esd.iGood') : t('esd.iDeveloping')} {t('esd.iCommitment')}
                            </p>
                          </div>
                        </Card>
                      </TabsContent>

                      <TabsContent value="recommendations" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="p-4">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <Target className="h-4 w-4 text-blue-500" />
                              {t('esd.learningRec')}
                            </h4>
                            <ul className="space-y-2 text-sm">
                              {student.weak_areas.length > 0 ? (
                                student.weak_areas.slice(0, 3).map((area, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <Zap className="h-3 w-3 text-violet-500 mt-1" />
                                    {t('esd.focusOnPre')} {area} {t('esd.focusOnPost')}
                                  </li>
                                ))
                              ) : (
                                <li className="flex items-start gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-500 mt-1" />
                                  {t('esd.continuePath')}
                                </li>
                              )}
                            </ul>
                          </Card>
                          
                          <Card className="p-4">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <Activity className="h-4 w-4 text-purple-500" />
                              {t('esd.engagementTips')}
                            </h4>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-start gap-2">
                                <Zap className="h-3 w-3 text-blue-500 mt-1" />
                                {student.total_time_spent < 300 ?
                                  t('esd.tip15min') :
                                  t('esd.tipMaintain')
                                }
                              </li>
                              <li className="flex items-start gap-2">
                                <Zap className="h-3 w-3 text-green-500 mt-1" />
                                {student.strengths.length > 0 ?
                                  `${t('esd.leveragePre')} ${student.strengths[0]} ${t('esd.leveragePost')}` :
                                  t('esd.buildFoundational')
                                }
                              </li>
                            </ul>
                          </Card>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
