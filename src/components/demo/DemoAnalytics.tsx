
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
      case 'improving': return <TrendingUp className="h-3 w-3 text-green-400" />;
      case 'declining': return <TrendingDown className="h-3 w-3 text-red-400" />;
      case 'needs_attention': return <Target className="h-3 w-3 text-orange-400" />;
      default: return <BarChart3 className="h-3 w-3 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-400';
      case 'declining': return 'text-red-400';
      case 'needs_attention': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{childName}'s Learning Analytics</h2>
        <p className="text-gray-400">
          Detailed insights into learning patterns, strengths, and areas for improvement
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <Brain className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{analytics.strengths.length}</div>
            <div className="text-sm text-gray-400">Strong Topics</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-orange-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{analytics.weaknesses.length}</div>
            <div className="text-sm text-gray-400">Need Focus</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {Math.round((analytics.strengths.reduce((sum, s) => sum + s.strength_score, 0) / analytics.strengths.length) * 100)}%
            </div>
            <div className="text-sm text-gray-400">Avg Strength</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {analytics.strengths.reduce((sum, s) => sum + s.total_attempts, 0) + 
               analytics.weaknesses.reduce((sum, w) => sum + w.total_attempts, 0)}
            </div>
            <div className="text-sm text-gray-400">Total Attempts</div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Progress Over Time */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Learning Progress Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.progressOverTime.map((point, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-400">
                  {new Date(point.date).toLocaleDateString()}
                </div>
                <div className="flex-1">
                  <Progress value={point.score} className="h-3" />
                </div>
                <div className="text-sm text-white font-medium w-12 text-right">
                  {point.score}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths Analysis */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Learning Strengths ({analytics.strengths.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.strengths.map((strength, index) => (
              <div key={index} className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-white">{strength.topic_name}</h4>
                    <p className="text-sm text-gray-400">{strength.subjects.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-400">
                      {getTrendIcon(strength.improvement_trend)}
                      <span className="text-lg font-bold">
                        {Math.round(strength.strength_score * 100)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
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
                    <span className="text-gray-400">
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
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingDown className="h-5 w-5 text-orange-500" />
            Areas Needing Focus ({analytics.weaknesses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.weaknesses.map((weakness, index) => (
              <div key={index} className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-white">{weakness.topic_name}</h4>
                    <p className="text-sm text-gray-400">{weakness.subjects.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-orange-400">
                      {getTrendIcon(weakness.improvement_trend)}
                      <span className="text-lg font-bold">
                        {Math.round(weakness.strength_score * 100)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
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
                    <span className="text-gray-400">
                      Last practiced: {new Date(weakness.last_practiced).toLocaleDateString()}
                    </span>
                    <Badge variant="outline" className={`${getTrendColor(weakness.improvement_trend)} border-current`}>
                      {weakness.improvement_trend.replace('_', ' ')}
                    </Badge>
                  </div>
                  {weakness.recommended_action && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2 mt-2">
                      <p className="text-xs text-blue-300">
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
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Performance by Subject</CardTitle>
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
                <div key={subject} className="p-4 bg-black/20 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-white">{subject}</h4>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{avgScore}%</div>
                      <div className="text-xs text-gray-400">Average Score</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <div className="text-xs text-green-400 mb-1">Strong Areas ({subjectStrengths.length})</div>
                      <div className="space-y-1">
                        {subjectStrengths.slice(0, 2).map((strength, idx) => (
                          <div key={idx} className="text-xs text-gray-300 bg-green-500/10 px-2 py-1 rounded">
                            {strength.topic_name} ({Math.round(strength.strength_score * 100)}%)
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-orange-400 mb-1">Needs Work ({subjectWeaknesses.length})</div>
                      <div className="space-y-1">
                        {subjectWeaknesses.slice(0, 2).map((weakness, idx) => (
                          <div key={idx} className="text-xs text-gray-300 bg-orange-500/10 px-2 py-1 rounded">
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
