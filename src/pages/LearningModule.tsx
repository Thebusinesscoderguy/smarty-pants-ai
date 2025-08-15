import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { QuizTaker } from '@/components/quiz/QuizTaker';
import { 
  BookOpen, 
  Play, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  Target,
  Award,
  FileText,
  Brain,
  Lightbulb
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface Lesson {
  id: string;
  title: string;
  content: string;
  duration: number;
  type: 'reading' | 'video' | 'interactive';
  completed?: boolean;
}

interface QuizQuestion {
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correct_answer: string;
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  quizzes: Quiz[];
  progress: number;
  estimatedTime: number;
}

const LearningModule = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loadStudyPlan = async () => {
      if (!moduleId) return;
      
      try {
        const { data: studyPlan, error } = await supabase
          .from('study_plans')
          .select('*')
          .eq('id', moduleId)
          .single();
          
        if (error) throw error;
        
        if (studyPlan) {
          // Transform study plan into detailed learning module
          const dailyLessons = studyPlan.daily_lessons as any[] || [];
          
          const detailedModule: Module = {
            id: studyPlan.id,
            title: studyPlan.title,
            description: studyPlan.description || 'Your personalized learning journey',
            progress: 0,
            estimatedTime: studyPlan.estimated_duration * 45, // Convert days to minutes (45 min per day)
            lessons: dailyLessons.map((lesson, index) => ({
              id: `lesson-${index + 1}`,
              title: `Day ${lesson.day}: ${lesson.topic}`,
              content: lesson.description + '\n\nActivities:\n' + lesson.activities.join('\n• '),
              duration: lesson.estimatedTime,
              type: index % 3 === 0 ? 'reading' : index % 3 === 1 ? 'interactive' : 'video',
              completed: false
            })),
            quizzes: [
              {
                id: 'quiz-1',
                title: 'Knowledge Check',
                difficulty: (['easy', 'medium', 'hard'] as const).includes(studyPlan.difficulty_level as any) 
                  ? studyPlan.difficulty_level as 'easy' | 'medium' | 'hard'
                  : 'medium',
                timeLimit: 15,
                questions: [
                  {
                    question: `What are the key concepts you need to focus on in ${studyPlan.title}?`,
                    type: 'multiple_choice',
                    options: [
                      'Understanding basic principles',
                      'Practice with real problems',
                      'Reviewing weak areas',
                      'All of the above'
                    ],
                    correct_answer: 'All of the above',
                    explanation: 'A comprehensive approach covers all aspects of learning for maximum effectiveness.'
                  }
                ]
              }
            ]
          };
          setSelectedModule(detailedModule);
        }
      } catch (error) {
        console.error('Error loading study plan:', error);
      }
    };
    
    loadStudyPlan();
  }, [moduleId]);

  const handleLessonComplete = (lessonId: string) => {
    if (!selectedModule) return;
    
    const updatedModule = {
      ...selectedModule,
      lessons: selectedModule.lessons.map(lesson => 
        lesson.id === lessonId ? { ...lesson, completed: true } : lesson
      )
    };
    
    const completedLessons = updatedModule.lessons.filter(l => l.completed).length;
    const newProgress = (completedLessons / updatedModule.lessons.length) * 100;
    
    setSelectedModule({ ...updatedModule, progress: newProgress });
    setProgress(newProgress);
    setCurrentLesson(null);
  };

  const handleQuizComplete = (result: { score: number; total: number; saved: boolean }) => {
    // Handle quiz completion
    setCurrentQuiz(null);
    setActiveTab('overview');
  };

  if (!selectedModule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-blue-400" />
          <h2 className="text-2xl font-bold mb-2">Module Not Found</h2>
          <p className="text-gray-400 mb-4">The requested learning module could not be found.</p>
          <Button onClick={() => navigate('/quiz-generator')} variant="outline" className="border-white/30 text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Study Plans
          </Button>
        </div>
      </div>
    );
  }

  if (currentLesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <Button
              onClick={() => setCurrentLesson(null)}
              variant="outline"
              className="mb-6 border-white/30 bg-white/10 hover:bg-white/20 text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Module
            </Button>
            
            <Card className="bg-white/10 border-white/30 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl text-white">{currentLesson.title}</CardTitle>
                  <Badge variant="outline" className="border-white/30 text-white">
                    <Clock className="mr-1 h-3 w-3" />
                    {currentLesson.duration} min
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose prose-invert max-w-none">
                  <p className="text-white/90 text-lg leading-relaxed">
                    {currentLesson.content}
                  </p>
                </div>
                
                <div className="bg-white/5 p-6 rounded-lg border border-white/20">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Lightbulb className="mr-2 h-5 w-5 text-yellow-400" />
                    Key Learning Objectives
                  </h3>
                  <ul className="space-y-2 text-white/80">
                    <li>• Understand core concepts and principles</li>
                    <li>• Apply knowledge to practical scenarios</li>
                    <li>• Develop critical thinking skills</li>
                    <li>• Build foundation for advanced topics</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={() => handleLessonComplete(currentLesson.id)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  size="lg"
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Complete Lesson
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (currentQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <Button
              onClick={() => setCurrentQuiz(null)}
              variant="outline"
              className="mb-6 border-white/30 bg-white/10 hover:bg-white/20 text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Module
            </Button>
            <QuizTaker 
              quiz={currentQuiz} 
              onComplete={handleQuizComplete}
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex flex-col">
      <Header />
      
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <Button
            onClick={() => navigate('/quiz-generator')}
            variant="outline"
            className="mb-6 border-white/30 bg-white/10 hover:bg-white/20 text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Study Plans
          </Button>

          {/* Module Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {selectedModule.title}
            </h1>
            <p className="text-xl text-white/80 mb-6">{selectedModule.description}</p>
            
            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-400" />
                <span className="text-white/90">Progress: {Math.round(selectedModule.progress)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-400" />
                <span className="text-white/90">{selectedModule.estimatedTime} minutes</span>
              </div>
            </div>
            
            <Progress value={selectedModule.progress} className="w-full h-3 mb-6" />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/10 border border-white/20">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="lessons">Lessons</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-white/10 border-white/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <BookOpen className="mr-2 h-5 w-5" />
                      Learning Path
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedModule.lessons.map((lesson, index) => (
                        <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            lesson.completed ? 'bg-green-500' : 'bg-gray-500'
                          }`}>
                            {lesson.completed ? <CheckCircle className="h-4 w-4" /> : <span className="text-sm">{index + 1}</span>}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">{lesson.title}</p>
                            <p className="text-white/60 text-sm">{lesson.duration} minutes</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 border-white/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Brain className="mr-2 h-5 w-5" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white/80">Lessons Completed</span>
                        <span className="text-white font-semibold">
                          {selectedModule.lessons.filter(l => l.completed).length} / {selectedModule.lessons.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/80">Assessments Available</span>
                        <span className="text-white font-semibold">{selectedModule.quizzes.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/80">Estimated Completion</span>
                        <span className="text-white font-semibold">{selectedModule.estimatedTime} min</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="lessons" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {selectedModule.lessons.map((lesson) => (
                  <Card key={lesson.id} className="bg-white/10 border-white/30 backdrop-blur-sm hover:bg-white/15 transition-all">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-lg">{lesson.title}</CardTitle>
                        {lesson.completed && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-white/80 mb-4 line-clamp-2">{lesson.content}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-sm flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          {lesson.duration} minutes
                        </span>
                        <Button
                          onClick={() => setCurrentLesson(lesson)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Play className="mr-1 h-3 w-3" />
                          {lesson.completed ? 'Review' : 'Start'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="assessments" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {selectedModule.quizzes.map((quiz) => (
                  <Card key={quiz.id} className="bg-white/10 border-white/30 backdrop-blur-sm hover:bg-white/15 transition-all">
                    <CardHeader>
                      <CardTitle className="text-white text-lg flex items-center">
                        <FileText className="mr-2 h-5 w-5" />
                        {quiz.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-white/80">Questions:</span>
                          <span className="text-white">{quiz.questions.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/80">Difficulty:</span>
                          <Badge variant="outline" className={`border-white/30 ${
                            quiz.difficulty === 'easy' ? 'text-green-400' :
                            quiz.difficulty === 'medium' ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {quiz.difficulty}
                          </Badge>
                        </div>
                        {quiz.timeLimit && (
                          <div className="flex items-center justify-between">
                            <span className="text-white/80">Time Limit:</span>
                            <span className="text-white flex items-center">
                              <Clock className="mr-1 h-3 w-3" />
                              {quiz.timeLimit} min
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => setCurrentQuiz(quiz)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <Award className="mr-2 h-4 w-4" />
                        Take Assessment
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LearningModule;