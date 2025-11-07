import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Brain, Clock, Trophy, Target, AlertCircle, CheckCircle, Star } from 'lucide-react';
import { getDemoOverallStats, getDemoMonitoringData, getDemoRecentActivity, getDemoChildName, getDemoAnalyticsData } from '@/utils/demoData';
import { useEffect } from 'react';

export const DemoParentDashboard = () => {
  console.log('DemoParentDashboard: Component rendering');
  
  useEffect(() => {
    console.log('DemoParentDashboard: Component mounted, loading demo data...');
    try {
      const stats = getDemoOverallStats();
      const monitoring = getDemoMonitoringData();
      const activity = getDemoRecentActivity();
      const childName = getDemoChildName();
      const analytics = getDemoAnalyticsData();
      
      console.log('DemoParentDashboard: Demo data loaded successfully:', {
        stats: !!stats,
        monitoring: !!monitoring,
        activity: !!activity,
        childName,
        analytics: !!analytics
      });
    } catch (error) {
      console.error('DemoParentDashboard: Error loading demo data:', error);
    }
  }, []);

  const stats = getDemoOverallStats();
  const monitoring = getDemoMonitoringData();
  const activity = getDemoRecentActivity();
  const childName = getDemoChildName();
  const analytics = getDemoAnalyticsData();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quiz_completed': return <Trophy className="h-4 w-4 text-yellow-600" />;
      case 'lesson_completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'achievement_earned': return <Star className="h-4 w-4 text-primary" />;
      case 'quest_progress': return <Target className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'positive': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'attention': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Parent Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor {childName}'s learning progress and performance
        </p>
      </div>

      {/* Overall Progress Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-bold text-foreground">{stats.completionPercentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Study Time</p>
                <p className="text-2xl font-bold text-foreground">{Math.round(stats.totalTimeSpent / 60)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold text-foreground">{stats.currentStreak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lessons Done</p>
                <p className="text-2xl font-bold text-foreground">{stats.lessonsCompleted}/{stats.totalLessons}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Progress Summary */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Brain className="h-5 w-5" />
            AI Learning Progress Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">
            {childName} is making excellent progress with {stats.completionPercentage}% overall completion and a {stats.currentStreak}-day study streak. 
            She shows exceptional strength in {analytics.strengths[0]?.topic_name} and {analytics.strengths[1]?.topic_name}, consistently scoring above 85%. 
            Areas needing focused attention include {analytics.weaknesses[0]?.topic_name}, where additional practice would be beneficial. 
            Her study habits are consistent with an average session time of {stats.averageSessionTime} minutes. 
            Continue encouraging regular practice to maintain this excellent momentum and consider extra support in challenging areas.
          </p>
        </CardContent>
      </Card>

      {/* Strengths and Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.strengths.slice(0, 4).map((strength, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-foreground">{strength.topic_name}</h4>
                      <p className="text-sm text-muted-foreground">{strength.subjects.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {Math.round(strength.strength_score * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {strength.correct_attempts}/{strength.total_attempts} correct
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={strength.strength_score * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.weaknesses.map((weakness, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-foreground">{weakness.topic_name}</h4>
                      <p className="text-sm text-muted-foreground">{weakness.subjects.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-orange-600">
                        {Math.round(weakness.strength_score * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {weakness.correct_attempts}/{weakness.total_attempts} correct
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={weakness.strength_score * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-blue-600">{weakness.recommended_action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations and Alerts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">AI Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monitoring.recommendations.map((rec, index) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  rec.priority === 'high' ? 'border-red-300 bg-red-50' :
                  rec.priority === 'medium' ? 'border-yellow-300 bg-yellow-50' :
                  'border-blue-300 bg-blue-50'
                }`}>
                  <div className="flex items-start gap-2">
                    <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                      {rec.priority}
                    </Badge>
                    {rec.celebration && <Trophy className="h-4 w-4 text-yellow-600" />}
                  </div>
                  <h4 className="font-medium text-foreground mt-2">{rec.title}</h4>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                  {rec.resources && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">Suggested resources:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rec.resources.map((resource, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {resource}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-muted">
                  {getActivityIcon(item.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    {item.score && (
                      <p className="text-xs text-green-600">Score: {item.score}%</p>
                    )}
                    {item.progress && (
                      <p className="text-xs text-blue-600">Progress: {item.progress}%</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {item.details && (
                      <p className="text-xs text-foreground mt-1">{item.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Study Patterns */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Study Patterns & Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-3">Learning Preferences</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preferred Study Time:</span>
                  <span className="text-foreground">{monitoring.studyPatterns.preferredStudyTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Session:</span>
                  <span className="text-foreground">{monitoring.studyPatterns.averageSessionLength} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Most Productive Days:</span>
                  <span className="text-foreground">{monitoring.studyPatterns.mostProductiveDays.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Attention Span:</span>
                  <span className="text-foreground">{monitoring.studyPatterns.attentionSpan}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">Recent Alerts</h4>
              <div className="space-y-2">
                {monitoring.alerts.map((alert, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    {getAlertIcon(alert.type)}
                    <div>
                      <p className="text-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};