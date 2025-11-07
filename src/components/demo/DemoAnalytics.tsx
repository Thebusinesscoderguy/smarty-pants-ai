
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Brain, Clock, Target, BarChart3 } from 'lucide-react';
import { getDemoAnalyticsData, getDemoChildName } from '@/utils/demoData';

export const DemoAnalytics = () => {
  const analytics = getDemoAnalyticsData();
  const childName = getDemoChildName();

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'declining': return <TrendingDown className="h-3 w-3 text-red-600" />;
      case 'needs_attention': return <Target className="h-3 w-3 text-orange-600" />;
      default: return <BarChart3 className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      case 'needs_attention': return 'text-orange-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{childName}'s Learning Analytics</h2>
        <p className="text-muted-foreground">
          Detailed insights into learning patterns, strengths, and areas for improvement
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <Brain className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{analytics.strengths.length}</div>
            <div className="text-sm text-muted-foreground">Strong Topics</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">{analytics.weaknesses.length}</div>
            <div className="text-sm text-muted-foreground">Need Focus</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              {Math.round((analytics.strengths.reduce((sum, s) => sum + s.strength_score, 0) / analytics.strengths.length) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">Avg Strength</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              {analytics.strengths.reduce((sum, s) => sum + s.total_attempts, 0) + 
               analytics.weaknesses.reduce((sum, w) => sum + w.total_attempts, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Attempts</div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Progress Over Time */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Learning Progress Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.progressOverTime.map((point, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-sm text-muted-foreground">
                  {new Date(point.date).toLocaleDateString()}
                </div>
                <div className="flex-1">
                  <Progress value={point.score} className="h-3" />
                </div>
                <div className="text-sm text-foreground font-medium w-12 text-right">
                  {point.score}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths Analysis */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Learning Strengths ({analytics.strengths.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.strengths.map((strength, index) => (
              <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-foreground">{strength.topic_name}</h4>
                    <p className="text-sm text-muted-foreground">{strength.subjects.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-600">
                      {getTrendIcon(strength.improvement_trend)}
                      <span className="text-lg font-bold">
                        {Math.round(strength.strength_score * 100)}%
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {strength.correct_attempts}/{strength.total_attempts} correct
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Progress 
                    value={strength.strength_score * 100} 
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Last practiced: {new Date(strength.last_practiced).toLocaleDateString()}
                    </span>
                    <Badge variant="outline" className={`${getTrendColor(strength.improvement_trend)} border-current`}>
                      {strength.improvement_trend.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weaknesses Analysis */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingDown className="h-5 w-5 text-orange-600" />
            Areas Needing Focus ({analytics.weaknesses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.weaknesses.map((weakness, index) => (
              <div key={index} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-foreground">{weakness.topic_name}</h4>
                    <p className="text-sm text-muted-foreground">{weakness.subjects.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-orange-600">
                      {getTrendIcon(weakness.improvement_trend)}
                      <span className="text-lg font-bold">
                        {Math.round(weakness.strength_score * 100)}%
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {weakness.correct_attempts}/{weakness.total_attempts} correct
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Progress 
                    value={weakness.strength_score * 100} 
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Last practiced: {new Date(weakness.last_practiced).toLocaleDateString()}
                    </span>
                    <Badge variant="outline" className={`${getTrendColor(weakness.improvement_trend)} border-current`}>
                      {weakness.improvement_trend.replace('_', ' ')}
                    </Badge>
                  </div>
                  {weakness.recommended_action && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                      <p className="text-xs text-blue-700">
                        <strong>Recommendation:</strong> {weakness.recommended_action}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subject Performance Breakdown */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Performance by Subject</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['Mathematics', 'English Literature', 'Chemistry', 'World History'].map((subject) => {
              const subjectStrengths = analytics.strengths.filter(s => s.subjects.name === subject);
              const subjectWeaknesses = analytics.weaknesses.filter(w => w.subjects.name === subject);
              const avgScore = subjectStrengths.length > 0 
                ? Math.round((subjectStrengths.reduce((sum, s) => sum + s.strength_score, 0) / subjectStrengths.length) * 100)
                : 0;

              return (
                <div key={subject} className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-foreground">{subject}</h4>
                    <div className="text-right">
                      <div className="text-lg font-bold text-foreground">{avgScore}%</div>
                      <div className="text-xs text-muted-foreground">Average Score</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <div className="text-xs text-green-600 mb-1">Strong Areas ({subjectStrengths.length})</div>
                      <div className="space-y-1">
                        {subjectStrengths.slice(0, 2).map((strength, idx) => (
                          <div key={idx} className="text-xs text-foreground bg-green-50 px-2 py-1 rounded">
                            {strength.topic_name} ({Math.round(strength.strength_score * 100)}%)
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-orange-600 mb-1">Needs Work ({subjectWeaknesses.length})</div>
                      <div className="space-y-1">
                        {subjectWeaknesses.slice(0, 2).map((weakness, idx) => (
                          <div key={idx} className="text-xs text-foreground bg-orange-50 px-2 py-1 rounded">
                            {weakness.topic_name} ({Math.round(weakness.strength_score * 100)}%)
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};