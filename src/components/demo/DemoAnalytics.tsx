
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, BarChart, Clock, Target, Brain } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, Cell } from 'recharts';
import { getDemoAnalyticsData, getDemoChildName } from '@/utils/demoData';

export const DemoAnalytics = () => {
  const analytics = getDemoAnalyticsData();
  const childName = getDemoChildName();

  const formatPercentage = (score: number) => Math.round(score * 100);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-white">{label}</p>
          <p className="text-sm text-blue-400">
            Score: {data.value}%
          </p>
        </div>
      );
    }
    return null;
  };

  const strengthsChartData = analytics.strengths.map(item => ({
    topic: item.topic_name.length > 15 ? item.topic_name.substring(0, 15) + '...' : item.topic_name,
    score: formatPercentage(item.strength_score),
    subject: item.subjects.name
  }));

  const weaknessesChartData = analytics.weaknesses.map(item => ({
    topic: item.topic_name.length > 15 ? item.topic_name.substring(0, 15) + '...' : item.topic_name,
    score: formatPercentage(item.strength_score),
    subject: item.subjects.name
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{childName}'s Learning Analytics</h2>
        <p className="text-gray-400">
          AI-powered insights into learning patterns, strengths, and areas for improvement
        </p>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{analytics.strengths.length}</div>
            <div className="text-sm text-gray-400">Strong Areas</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 text-orange-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{analytics.weaknesses.length}</div>
            <div className="text-sm text-gray-400">Focus Areas</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <BarChart className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {Math.round(analytics.strengths.reduce((sum, s) => sum + s.strength_score, 0) / analytics.strengths.length * 100)}%
            </div>
            <div className="text-sm text-gray-400">Avg Strength</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <Brain className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {analytics.strengths.reduce((sum, s) => sum + s.total_attempts, 0) + 
               analytics.weaknesses.reduce((sum, w) => sum + w.total_attempts, 0)}
            </div>
            <div className="text-sm text-gray-400">Total Attempts</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Over Time Chart */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5" />
            Learning Progress Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.progressOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  stroke="#9ca3af"
                  fontSize={12}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Strengths and Weaknesses Side by Side */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Top Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.strengths.map((strength, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-white">{strength.topic_name}</h4>
                      <p className="text-sm text-gray-400">{strength.subjects.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-400">
                        {formatPercentage(strength.strength_score)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {strength.correct_attempts}/{strength.total_attempts} correct
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={strength.strength_score * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs">
                    <span className={`${
                      strength.improvement_trend === 'improving' ? 'text-green-400' :
                      strength.improvement_trend === 'stable' ? 'text-blue-400' :
                      'text-yellow-400'
                    }`}>
                      {strength.improvement_trend === 'improving' ? '📈 Improving' :
                       strength.improvement_trend === 'stable' ? '➡️ Stable' :
                       '⚠️ Needs attention'}
                    </span>
                    <span className="text-gray-500">
                      Last: {new Date(strength.last_practiced).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingDown className="h-5 w-5 text-orange-500" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.weaknesses.map((weakness, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-white">{weakness.topic_name}</h4>
                      <p className="text-sm text-gray-400">{weakness.subjects.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-orange-400">
                        {formatPercentage(weakness.strength_score)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {weakness.correct_attempts}/{weakness.total_attempts} correct
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={weakness.strength_score * 100} 
                    className="h-2"
                  />
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={`${
                        weakness.improvement_trend === 'slowly_improving' ? 'text-blue-400' :
                        'text-red-400'
                      }`}>
                        {weakness.improvement_trend === 'slowly_improving' ? '📊 Slowly improving' : '🚨 Needs attention'}
                      </span>
                      <span className="text-gray-500">
                        Last: {new Date(weakness.last_practiced).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-blue-300 bg-blue-500/10 p-2 rounded">
                      💡 {weakness.recommended_action}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Strengths Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={strengthsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="topic" 
                    stroke="#9ca3af"
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    fontSize={12}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" fill="#10b981">
                    {strengthsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#10b981" />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Areas Needing Focus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={weaknessesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="topic" 
                    stroke="#9ca3af"
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    fontSize={12}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" fill="#f59e0b">
                    {weaknessesChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#f59e0b" />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Brain className="h-5 w-5" />
            AI Learning Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-white mb-3">Learning Pattern Analysis</h4>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-300 font-medium">🎯 Strong Foundation</p>
                  <p className="text-gray-300">
                    {childName} shows excellent mastery in {analytics.strengths[0]?.topic_name}, 
                    consistently scoring above 90%. This indicates strong foundational understanding.
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-blue-300 font-medium">📊 Learning Velocity</p>
                  <p className="text-gray-300">
                    Progress has been steady with a 13% improvement over the past month. 
                    The learning curve shows consistent engagement and skill development.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-white mb-3">Recommendations</h4>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <p className="text-orange-300 font-medium">⚡ Focus Area</p>
                  <p className="text-gray-300">
                    {analytics.weaknesses[0]?.topic_name} needs additional practice. Consider 
                    scheduling 2-3 extra sessions per week with simplified examples.
                  </p>
                </div>
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-purple-300 font-medium">🎓 Next Steps</p>
                  <p className="text-gray-300">
                    Ready to advance in {analytics.strengths[1]?.topic_name}. Consider introducing 
                    more challenging problems to maintain engagement and growth.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
