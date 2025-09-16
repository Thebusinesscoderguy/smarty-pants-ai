import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Trophy, Clock, BookOpen, Target, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface StudentProgress {
  id: string;
  name: string;
  email: string;
  totalStudyTime: number;
  averageScore: number;
  completedQuizzes: number;
  
  currentSubjects: string[];
  weakAreas: string[];
  strongAreas: string[];
  lastActivity: string;
}

export const ParentDashboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, [user]);

  const fetchStudentData = async () => {
    if (!user) return;
    
    try {
      // Fetch children from the simple children table
      const { data: children, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id);

      if (childrenError) throw childrenError;

      const studentData: StudentProgress[] = [];

      for (const child of children || []) {
        // Each child is just a record with name and grade, no complex user relationships
        studentData.push({
          id: child.id,
          name: `${child.first_name} ${child.last_name}`,
          email: '',
          totalStudyTime: 0, // Children records don't track activity yet
          averageScore: 0,
          completedQuizzes: 0,
          
          currentSubjects: child.subjects || [],
          weakAreas: [],
          strongAreas: [],
          lastActivity: child.grade_level || 'No grade set'
        });
      }

      setStudents(studentData);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading student progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Parent Dashboard</h1>
          <p className="text-white/70">Monitor your children's learning progress and achievements</p>
        </div>

        {students.length === 0 ? (
          <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                No Students Connected
              </CardTitle>
              <CardDescription className="text-white/70">
                You haven't added any children yet. Go to Settings to add your children by name and grade.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-8">
            {students.map((student) => (
              <Card key={student.id} className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">{student.name}</CardTitle>
                  <CardDescription className="text-white/70">
                    Grade: {student.lastActivity}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{student.averageScore}%</div>
                      <div className="text-sm text-white/70">Average Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{student.completedQuizzes}</div>
                      <div className="text-sm text-white/70">Quizzes Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">{student.totalStudyTime}</div>
                      <div className="text-sm text-white/70">Study Minutes</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        Strong Areas
                      </h4>
                      {student.strongAreas.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {student.strongAreas.map((area) => (
                            <Badge key={area} variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/50 text-sm">No strong areas identified yet</p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-orange-400" />
                        Areas for Improvement
                      </h4>
                      {student.weakAreas.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {student.weakAreas.map((area) => (
                            <Badge key={area} variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/50 text-sm">No weak areas identified</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h4 className="text-white font-semibold mb-3">Current Subjects</h4>
                    {student.currentSubjects.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {student.currentSubjects.map((subject) => (
                          <Badge key={subject} variant="outline" className="border-blue-500/30 text-blue-400">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/50 text-sm">No subjects being studied yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};