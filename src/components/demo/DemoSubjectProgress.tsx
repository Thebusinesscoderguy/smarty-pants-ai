
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, TrendingUp, Award, Target } from 'lucide-react';
import { getDemoSubjectData, getDemoChildName } from '@/utils/demoData';

export const DemoSubjectProgress = () => {
  const subjects = getDemoSubjectData();
  const childName = getDemoChildName();

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-400 bg-green-400/20';
    if (grade.startsWith('B')) return 'text-blue-400 bg-blue-400/20';
    if (grade.startsWith('C')) return 'text-yellow-400 bg-yellow-400/20';
    return 'text-gray-400 bg-gray-400/20';
  };

  const getAssignedByColor = (assignedBy: string) => {
    switch (assignedBy) {
      case 'school': return 'bg-blue-500/20 text-blue-300';
      case 'parent': return 'bg-purple-500/20 text-purple-300';
      case 'self': return 'bg-green-500/20 text-green-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{childName}'s Subject Progress</h2>
        <p className="text-gray-400">
          Track learning progress across all subjects and topics
        </p>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <BookOpen className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{subjects.length}</div>
            <div className="text-sm text-gray-400">Active Subjects</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {Math.round(subjects.reduce((sum, s) => sum + s.completion_percentage, 0) / subjects.length)}%
            </div>
            <div className="text-sm text-gray-400">Avg Completion</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {Math.round(subjects.reduce((sum, s) => sum + s.time_spent, 0) / 60)}h
            </div>
            <div className="text-sm text-gray-400">Total Time</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {subjects.reduce((sum, s) => sum + s.lessons_completed, 0)}
            </div>
            <div className="text-sm text-gray-400">Lessons Done</div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {subjects.map((subject) => (
          <Card key={subject.id} className="bg-white/10 border-white/20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-white text-lg">{subject.name}</CardTitle>
                  <p className="text-sm text-gray-400 mt-1">{subject.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={`text-xs ${getGradeColor(subject.current_grade)}`}>
                    {subject.current_grade}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${getAssignedByColor(subject.assigned_by)}`}>
                    {subject.assigned_by}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white">
                    {subject.lessons_completed}/{subject.total_lessons} lessons ({subject.completion_percentage}%)
                  </span>
                </div>
                <Progress value={subject.completion_percentage} className="h-3" />
              </div>

              {/* Time Spent */}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400">Time spent:</span>
                <span className="text-white">{Math.round(subject.time_spent / 60)}h {subject.time_spent % 60}m</span>
              </div>

              {/* Last Activity */}
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400">Last activity:</span>
                <span className="text-white">
                  {new Date(subject.last_activity).toLocaleDateString()}
                </span>
              </div>

              {/* Strengths */}
              {subject.strengths && subject.strengths.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-green-400 mb-2">Strengths</h4>
                  <div className="flex flex-wrap gap-1">
                    {subject.strengths.map((strength, index) => (
                      <Badge key={index} variant="outline" className="text-xs text-green-300 border-green-500/30">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Areas for Improvement */}
              {subject.needs_work && subject.needs_work.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-orange-400 mb-2">Areas for Improvement</h4>
                  <div className="flex flex-wrap gap-1">
                    {subject.needs_work.map((area, index) => (
                      <Badge key={index} variant="outline" className="text-xs text-orange-300 border-orange-500/30">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Topics */}
              {subject.recent_topics && subject.recent_topics.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-blue-400 mb-2">Recent Topics</h4>
                  <div className="space-y-1">
                    {subject.recent_topics.map((topic, index) => (
                      <div key={index} className="text-xs text-gray-300 bg-black/20 px-2 py-1 rounded">
                        {topic}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subject Performance Comparison */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Subject Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex items-center gap-4">
                <div className="w-32 text-sm text-white font-medium truncate">
                  {subject.name}
                </div>
                <div className="flex-1">
                  <Progress value={subject.completion_percentage} className="h-2" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${getGradeColor(subject.current_grade)}`}>
                    {subject.current_grade}
                  </Badge>
                  <span className="text-xs text-gray-400 w-12 text-right">
                    {subject.completion_percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
