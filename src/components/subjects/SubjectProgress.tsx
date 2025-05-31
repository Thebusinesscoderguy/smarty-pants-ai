
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, User, Users, School } from 'lucide-react';
import { useQuests } from '@/hooks/useQuests';
import { useAuth } from '@/contexts/AuthContext';

// Demo data for non-logged in users
const demoSubjects = [
  {
    id: '1',
    subjects: { name: 'Mathematics', description: 'Core mathematics curriculum' },
    assigned_by: 'school' as const,
    completion_percentage: 75,
    lessons_completed: 15,
    total_lessons: 20
  },
  {
    id: '2',
    subjects: { name: 'Science', description: 'General science topics' },
    assigned_by: 'parent' as const,
    completion_percentage: 60,
    lessons_completed: 12,
    total_lessons: 20
  },
  {
    id: '3',
    subjects: { name: 'English', description: 'Language arts and literature' },
    assigned_by: 'self' as const,
    completion_percentage: 90,
    lessons_completed: 18,
    total_lessons: 20
  }
];

export const SubjectProgress = () => {
  const { user } = useAuth();
  const { subjectAssignments, isLoading } = useQuests();

  // Use demo data if user is not logged in
  const displaySubjects = user ? subjectAssignments : demoSubjects;
  const displayLoading = user ? isLoading : false;

  if (displayLoading) {
    return <div className="animate-pulse">Loading subjects...</div>;
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-500" />
          Subject Progress
        </CardTitle>
        {!user && (
          <p className="text-sm text-gray-400">
            Demo subjects - showing how progress is tracked per subject
          </p>
        )}
      </CardHeader>
      <CardContent>
        {displaySubjects.length > 0 ? (
          <div className="space-y-4">
            {displaySubjects.map((subject) => (
              <div key={subject.id} className="space-y-3 p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{subject.subjects?.name}</h3>
                    <p className="text-sm text-gray-600">{subject.subjects?.description}</p>
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
                    <span>Progress</span>
                    <span>{subject.completion_percentage || 0}%</span>
                  </div>
                  <Progress 
                    value={subject.completion_percentage || 0} 
                    className="h-2" 
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>
                      {subject.lessons_completed || 0}/{subject.total_lessons || 0} lessons completed
                    </span>
                    <span>Assigned by {subject.assigned_by}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No subjects assigned yet</p>
            <p className="text-sm text-gray-400">
              Subjects can be assigned by you, your parents, or your school
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
