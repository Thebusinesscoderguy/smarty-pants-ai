import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LessonViewer from '@/components/learning/LessonViewer';
import { QuestProgressNotification } from '@/components/quests/QuestProgressNotification';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useGamification } from '@/hooks/useGamification';

interface DailyLesson {
  day: number;
  topic: string;
  description: string;
  activities: string[];
  estimatedTime: number;
  practiceQuestions: number;
  completed?: boolean;
  completedAt?: string;
}

interface StudyPlan {
  id: string;
  title: string;
  description: string;
  daily_lessons: DailyLesson[];
}

const LearningModule = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [lessonContent, setLessonContent] = useState<string>('');
  const { completeLesson, questProgressNotification, clearQuestNotification } = useGamification();

  // Sync current day from URL param (?day=)
  useEffect(() => {
    const dayParam = Number(searchParams.get('day'));
    if (!Number.isNaN(dayParam) && dayParam > 0) {
      setCurrentDay(dayParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadStudyPlan = async () => {
      try {
        console.log('=== LearningModule: Starting to load study plan ===');
        const planId = localStorage.getItem('active_study_plan_id');
        console.log('Active study plan ID from localStorage:', planId);

        // Check authentication
        const { data: userData, error: authError } = await supabase.auth.getUser();
        const isGuest = !!authError || !userData?.user || planId === 'guest' || !planId;
        console.log('Auth check result:', { user: !!userData?.user, authError, isGuest });

        let parsedPlan: StudyPlan | null = null;
        let gradeLevelForContent = 'high school';
        let dayToUse = 1;

        if (isGuest) {
          const guestRaw = localStorage.getItem('guest_study_plan');
          console.log('Guest plan present:', !!guestRaw);
          if (!guestRaw) {
            console.error('=== ERROR: No guest study plan found ===');
            toast({
              title: "No active study plan",
              description: "Please create a study plan first",
              variant: "destructive"
            });
            navigate('/quiz-generator');
            return;
          }
          const guest = JSON.parse(guestRaw);
          parsedPlan = {
            id: 'guest',
            title: guest.title,
            description: guest.description,
            daily_lessons: Array.isArray(guest.dailyLessons) ? guest.dailyLessons : []
          };
          const urlParams = new URLSearchParams(window.location.search);
          const day = parseInt(urlParams.get('day') || '1');
          if (day > 1) {
            toast({
              title: "Sign in to unlock more",
              description: "Create a free account to access all study days.",
            });
            navigate('/quiz-generator');
            return;
          }
          dayToUse = 1;
        } else {
          // Authenticated path - fetch from DB
          console.log('=== Fetching study plan from database ===');
          const { data, error } = await supabase
            .from('study_plans')
            .select('*')
            .eq('id', planId)
            .eq('user_id', userData.user.id)
            .maybeSingle();

          console.log('Study plan fetch result:', { data, error, planId });

          if (error) {
            console.error('=== ERROR: Failed to fetch study plan ===', error);
            throw error;
          }

          if (!data) {
            console.error('=== ERROR: No study plan found with ID:', planId, '===');
            toast({
              title: "Study plan not found",
              description: "The study plan may have been deleted or doesn't belong to you",
              variant: "destructive"
            });
            navigate('/quiz-generator');
            return;
          }

          parsedPlan = {
            id: data.id,
            title: data.title,
            description: data.description,
            daily_lessons: Array.isArray(data.daily_lessons) ? data.daily_lessons as unknown as DailyLesson[] : []
          };
          gradeLevelForContent = data.grade_level || 'high school';
          const urlParams = new URLSearchParams(window.location.search);
          dayToUse = parseInt(urlParams.get('day') || '1');
        }

        setStudyPlan(parsedPlan);
        setCurrentDay(dayToUse);

        // Generate actual lesson content for the current lesson
        const currentLesson = parsedPlan!.daily_lessons.find(lesson => lesson.day === dayToUse) || parsedPlan!.daily_lessons[0];
        console.log('=== Current lesson lookup ===', { day: dayToUse, currentLesson, totalLessons: parsedPlan!.daily_lessons.length });
        if (currentLesson) {
          console.log('=== Generating lesson content for topic:', currentLesson.topic, '===');

          // Set a basic lesson content first to avoid infinite loading
          setLessonContent(`# ${currentLesson.topic}\n\n## Loading Content...\n\nGenerating detailed lesson content...`);

          try {
            const { data: contentData, error: contentError } = await supabase.functions.invoke('generate-lesson-content', {
              body: {
                topic: currentLesson.topic,
                description: currentLesson.description,
                gradeLevel: gradeLevelForContent,
                activities: currentLesson.activities,
                language: localStorage.getItem('selectedLanguage') || 'en'
              }
            });

            console.log('Content generation result:', { contentData, contentError });

            if (contentError) {
              console.error('Error generating lesson content:', contentError);
              toast({
                title: "Content generation failed",
                description: `Error: ${contentError.message || 'Please check your OpenAI API key.'}`,
                variant: "destructive"
              });
              setLessonContent(`# ${currentLesson.topic}\n\n## Content\n\n${currentLesson.description}\n\nDetailed lesson content could not be generated. Please ensure your OpenAI API key is configured properly.`);
            } else {
              setLessonContent(contentData?.content || `# ${currentLesson.topic}\n\n## Content\n\n${currentLesson.description}`);
            }
          } catch (edgeFunctionError: any) {
            console.error('=== ERROR: Edge function call failed ===', edgeFunctionError);
            toast({
              title: "Failed to generate lesson",
              description: "Using basic lesson content",
              variant: "destructive"
            });
            setLessonContent(`# ${currentLesson.topic}\n\n## Content\n\n${currentLesson.description}\n\n**Activities:**\n${currentLesson.activities ? currentLesson.activities.map((activity: string) => `- ${activity}`).join('\n') : 'No specific activities defined.'}`);
          }
        } else {
          console.error('=== ERROR: No lesson found for day:', dayToUse, 'Available lessons:', parsedPlan!.daily_lessons.map(l => l.day), '===');
          setLessonContent(`# No Lesson Found\n\nCould not find lesson content for day ${dayToUse}.\n\nAvailable days: ${parsedPlan!.daily_lessons.map(l => l.day).join(', ')}`);
        }

      } catch (error: any) {
        console.error('=== FATAL ERROR: Failed to load study plan ===', error);
        toast({
          title: "Failed to load study plan",
          description: error.message || "Please try again",
          variant: "destructive"
        });
        navigate('/quiz-generator');
      } finally {
        console.log('=== LearningModule: Loading complete, setting loading to false ===');
        setLoading(false);
      }
    };

    loadStudyPlan();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground">Loading your lesson...</div>
      </div>
    );
  }

  if (!studyPlan || !studyPlan.daily_lessons || studyPlan.daily_lessons.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground text-center">
          <h2 className="text-xl mb-4">No lessons found</h2>
          <button 
            onClick={() => navigate('/quiz-generator')}
            className="text-primary underline"
          >
            Return to Quiz Generator
          </button>
        </div>
      </div>
    );
  }

  // Find the current lesson
  const currentLesson = studyPlan.daily_lessons.find(lesson => lesson.day === currentDay) || studyPlan.daily_lessons[0];
  
  // Convert to the format expected by LessonViewer
  const lesson = {
    id: `${studyPlan.id}-day-${currentLesson.day}`,
    title: currentLesson.topic,
    content: lessonContent || `# ${currentLesson.topic}\n\n## Loading...\n\nGenerating lesson content...`,
    duration: currentLesson.estimatedTime,
    type: 'reading' as const,
    completed: false
  };

  return (
    <>
      <LessonViewer 
        lesson={lesson}
        onBack={() => navigate('/quiz-generator')}
        onComplete={async (lessonId) => {
          try {
            // Save user progress (client-side badge/XP, etc.)
            await completeLesson(lessonId);

            if (studyPlan!.id === 'guest') {
              toast({
                title: "Lesson completed! 🎉",
                description: `Great job completing Day ${currentLesson.day}: ${currentLesson.topic}. Sign in to track progress and unlock all days.`
              });
              navigate('/quiz-generator');
              return;
            }

            // Mark the current day as completed in the study plan JSON
            const updatedLessons = studyPlan!.daily_lessons.map((l) =>
              l.day === currentLesson.day
                ? { ...l, completed: true, completedAt: new Date().toISOString() }
                : l
            );

            const nextUncompleted = updatedLessons.find((l: any) => !l.completed);
            const nextDay = nextUncompleted ? nextUncompleted.day : null;

            // Update study plan with completion status
            await supabase
              .from('study_plans')
              .update({ 
                daily_lessons: updatedLessons as any,
                status: !nextUncompleted ? 'completed' : 'active'
              })
              .eq('id', studyPlan!.id);

            toast({
              title: "Lesson completed! 🎉",
              description: `Great job completing Day ${currentLesson.day}: ${currentLesson.topic}${nextUncompleted ? '. Ready for your next lesson!' : ' Study plan completed!'}`
            });

            // Always navigate back to study plans
            navigate('/quiz-generator');
          } catch (error) {
            console.error('Error completing lesson:', error);
            toast({ title: 'Error', description: 'Failed to save completion', variant: 'destructive' });
          }
        }}
      />
      
      {/* Quest Progress Notification */}
      <QuestProgressNotification
        progressUpdate={questProgressNotification}
        onComplete={clearQuestNotification}
      />
    </>
  );
};

export default LearningModule;