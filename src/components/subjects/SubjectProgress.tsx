
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, User, Users, School } from 'lucide-react';
import { useQuests } from '@/hooks/useQuests';
import { useAuth } from '@/contexts/AuthContext';

export const SubjectProgress = () => {
  const { user } = useAuth();
  const { subjectAssignments, isLoading } = useQuests();

  if (!user) {
    return (
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Subject Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300">Sign in to track your subject progress</p>
          <p className="text-gray-400 text-sm mt-2">
            Subjects can be assigned by you, your parents, or your school
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <div className="animate-pulse text-white">Loading subjects...</div>;
  }

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
      case 'self': return 'bg-blue-500';
      case 'parent': return 'bg-green-500';
      case 'school': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="bg-white/10 border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <BookOpen className="h-5 w-5 text-blue-500" />
          Subject Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        {subjectAssignments.length > 0 ? (
          <div className="space-y-4">
            {subjectAssignments.map((subject) => (
              <div key={subject.id} className="space-y-3 p-4 border border-white/20 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-white">{subject.subjects?.name}</h3>
                    <p className="text-sm text-gray-300">{subject.subjects?.description}</p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${getAssignedByColor(subject.assigned_by)} text-white flex items-center gap-1`}
                  >
                    {getAssignedByIcon(subject.assigned_by)}
                    {subject.assigned_by}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Progress</span>
                    <span className="text-white">{subject.completion_percentage || 0}%</span>
                  </div>
                  <Progress 
                    value={subject.completion_percentage || 0} 
                    className="h-2" 
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>
                      {subject.lessons_completed || 0}/{subject.total_lessons || 0} topics mastered
                    </span>
                    <span>Assigned {new Date(subject.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-300 mb-4">No subjects assigned yet</p>
            <p className="text-sm text-gray-400">
              Start learning or ask your teacher/parent to assign subjects to track your progress
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
