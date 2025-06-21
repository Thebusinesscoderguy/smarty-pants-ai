
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, User, Users, School, TrendingUp, Clock, Award } from 'lucide-react';
import { getDemoSubjectData, getDemoChildName } from '@/utils/demoData';

export const DemoSubjectProgress = () => {
  const subjects = getDemoSubjectData();
  const childName = getDemoChildName();

  const getAssignedByIcon = (assignedBy: string) => {
    switch (assignedBy) {
      case 'self': return <User className="h-4 w-4" />;
      case 'parent': return <Users className="h-4 w-4" />;
      case 'school': return <School className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getAssignedByColor = (assignedBy: string) => {
    switch (assignedBy) {
      case 'self': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'parent': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'school': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-400';
    if (grade.startsWith('B')) return 'text-blue-400';
    if (grade.startsWith('C')) return 'text-yellow-400';
    if (grade.startsWith('D')) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{childName}'s Subject Progress</h2>
        <p className="text-gray-400">Track progress across all assigned subjects and topics</p>
      </div>

      {/* Overall Progress Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <BookOpen className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{subjects.length}</div>
            <div className="text-sm text-gray-400">Active Subjects</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {Math.round(subjects.reduce((sum, s) => sum + s.completion_percentage, 0) / subjects.length)}%
            </div>
            <div className="text-sm text-gray-400">Avg Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {Math.round(subjects.reduce((sum, s) => sum + s.time_spent, 0) / 60)}h
            </div>
            <div className="text-sm text-gray-400">Total Study Time</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardContent className="p-4 text-center">
            <Award className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">
              {subjects.reduce((sum, s) => sum + s.lessons_completed, 0)}
            </div>
            <div className="text-sm text-gray-400">Lessons Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Details */}
      <div className="space-y-4">
        {subjects.map((subject) => (
          <Card key={subject.id} className="bg-white/10 border-white/20">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-xl text-white">{subject.name}</h3>
                    <Badge 
                      variant="outline" 
                      className={`${getAssignedByColor(subject.assigned_by)} flex items-center gap-1`}
                    >
                      {getAssignedByIcon(subject.assigned_by)}
                      <span className="capitalize">{subject.assigned_by}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">{subject.description}</p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getGradeColor(subject.current_grade)}`}>
                    {subject.current_grade}
                  </div>
                  <div className="text-xs text-gray-400">Current Grade</div>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Overall Progress</span>
                    <span className="text-white">{subject.completion_percentage}%</span>
                  </div>
                  <Progress 
                    value={subject.completion_percentage} 
                    className="h-3"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>
                      {subject.lessons_completed}/{subject.total_lessons} lessons completed
                    </span>
                    <span>
                      {Math.round(subject.time_spent / 60)} hours studied
                    </span>
                  </div>
                </div>

                {/* Strengths and Areas for Improvement */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Strengths
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {subject.strengths.map((strength, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-green-500/20 text-green-300">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-orange-400 mb-2 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      Focus Areas
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {subject.needs_work.map((area, index) => (
                        <Badge key={index} variant="outline" className="text-xs text-orange-300 border-orange-500/30">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Topics */}
                <div>
                  <h4 className="text-sm font-medium text-blue-400 mb-2">Recent Topics</h4>
                  <div className="flex flex-wrap gap-1">
                    {subject.recent_topics.map((topic, index) => (
                      <Badge key={index} variant="outline" className="text-xs text-blue-300 border-blue-500/30">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Last Activity */}
                <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t border-white/10">
                  <span>Last studied: {new Date(subject.last_activity).toLocaleDateString()}</span>
                  <span>Assigned by {subject.assigned_by}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subject Performance Summary */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-white mb-2">Top Performing Subjects</h4>
              <div className="space-y-2">
                {subjects
                  .sort((a, b) => b.completion_percentage - a.completion_percentage)
                  .slice(0, 2)
                  .map((subject, index) => (
                    <div key={subject.id} className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg">
                      <span className="text-green-300">#{index + 1} {subject.name}</span>
                      <span className="text-green-400 font-medium">{subject.completion_percentage}%</span>
                    </div>
                  ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-2">Needs More Attention</h4>
              <div className="space-y-2">
                {subjects
                  .sort((a, b) => a.completion_percentage - b.completion_percentage)
                  .slice(0, 1)
                  .map((subject) => (
                    <div key={subject.id} className="flex items-center justify-between p-2 bg-orange-500/10 rounded-lg">
                      <span className="text-orange-300">{subject.name}</span>
                      <span className="text-orange-400 font-medium">{subject.completion_percentage}%</span>
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
