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
  
  // Add quest progress tracking
  questProgress: {
    activeQuests: QuestWithProgress[];
    completedQuests: QuestWithProgress[];
    totalCompleted: number;
    totalActive: number;
  };
}

interface QuestWithProgress {
  id: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  type: 'daily' | 'weekly' | 'monthly';
  status: 'active' | 'completed' | 'failed';
  progress_percentage: number;
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
      // Fetch children from parent-child relationships (linked to actual user accounts)
      const { data: relationships, error: relationshipsError } = await supabase
        .from('parent_child_relationships')
        .select('child_id')
        .eq('parent_id', user.id);

      if (relationshipsError) {
        console.log('No parent-child relationships found, trying children table');
      }

      const studentData: StudentProgress[] = [];

      // If we have linked relationships, fetch quest progress for those users
      if (relationships && relationships.length > 0) {
        for (const rel of relationships) {
          const childUserId = rel.child_id;
          
          // Get child profile/info
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', childUserId)
            .single();

          // Fetch quest progress for this child
          const { data: questProgress } = await supabase
            .from('user_quest_progress')
            .select(`
              id,
              current_value,
              completed,
              status,
              created_at,
              quests!inner(
                id,
                title,
                description,
                target_value,
                type,
                difficulty
              )
            `)
            .eq('user_id', childUserId);

          // Process quest data
          const questsWithProgress: QuestWithProgress[] = (questProgress || []).map(qp => ({
            id: qp.quests.id,
            title: qp.quests.title,
            description: qp.quests.description,
            target_value: qp.quests.target_value,
            current_value: qp.current_value,
            type: qp.quests.type as 'daily' | 'weekly' | 'monthly',
            status: qp.status as 'active' | 'completed' | 'failed',
            progress_percentage: Math.min(100, Math.round((qp.current_value / qp.quests.target_value) * 100))
          }));

          const activeQuests = questsWithProgress.filter(q => q.status === 'active');
          const completedQuests = questsWithProgress.filter(q => q.status === 'completed');

          studentData.push({
            id: childUserId,
            name: profile?.display_name || 'Student',
            email: '',
            totalStudyTime: 0,
            averageScore: 0,
            completedQuizzes: 0,
            
            currentSubjects: [],
            weakAreas: [],
            strongAreas: [],
            lastActivity: 'Recently active',
            
            questProgress: {
              activeQuests,
              completedQuests,
              totalCompleted: completedQuests.length,
              totalActive: activeQuests.length
            }
          });
        }
      }

      // Also fetch from children table for basic records (without quest progress)
      const { data: children, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id);

      if (childrenError) throw childrenError;

      for (const child of children || []) {
        // Skip if we already have this child from relationships
        const alreadyAdded = studentData.find(s => s.name.includes(child.first_name));
        if (alreadyAdded) continue;
        
        studentData.push({
          id: child.id,
          name: `${child.first_name} ${child.last_name}`,
          email: '',
          totalStudyTime: 0,
          averageScore: 0,
          completedQuizzes: 0,
          
          currentSubjects: child.subjects || [],
          weakAreas: [],
          strongAreas: [],
          lastActivity: child.grade_level || 'No grade set',
          
          questProgress: {
            activeQuests: [],
            completedQuests: [],
            totalCompleted: 0,
            totalActive: 0
          }
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
                      <div className="text-2xl font-bold text-blue-400">{student.questProgress.totalActive}</div>
                      <div className="text-sm text-white/70">Active Quests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{student.questProgress.totalCompleted}</div>
                      <div className="text-sm text-white/70">Completed Quests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">{student.totalStudyTime}</div>
                      <div className="text-sm text-white/70">Study Minutes</div>
                    </div>
                  </div>

                  {/* Quest Progress Section */}
                  {student.questProgress.activeQuests.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-400" />
                        Active Quest Progress
                      </h4>
                      <div className="space-y-4">
                        {student.questProgress.activeQuests.slice(0, 5).map((quest) => (
                          <div key={quest.id} className="bg-white/5 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h5 className="text-white font-medium">{quest.title}</h5>
                                <p className="text-white/60 text-sm">{quest.description}</p>
                              </div>
                              <Badge 
                                variant="secondary" 
                                className={`
                                  ${quest.type === 'daily' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : ''}
                                  ${quest.type === 'weekly' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : ''}
                                  ${quest.type === 'monthly' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : ''}
                                `}
                              >
                                {quest.type}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-white/70">
                                  Progress: {quest.current_value} / {quest.target_value}
                                </span>
                                <span className="text-white font-medium">
                                  {quest.progress_percentage}%
                                </span>
                              </div>
                              <Progress 
                                value={quest.progress_percentage} 
                                className="h-2"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {student.questProgress.activeQuests.length > 5 && (
                        <p className="text-white/50 text-sm mt-2 text-center">
                          +{student.questProgress.activeQuests.length - 5} more quests...
                        </p>
                      )}
                    </div>
                  )}

                  {/* Recently Completed Quests */}
                  {student.questProgress.completedQuests.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-green-400" />
                        Recently Completed Quests
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {student.questProgress.completedQuests.slice(0, 3).map((quest) => (
                          <Badge 
                            key={quest.id} 
                            variant="secondary" 
                            className="bg-green-500/20 text-green-400 border-green-500/30"
                          >
                            ✓ {quest.title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

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