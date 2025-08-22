import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LessonViewer from '@/components/learning/LessonViewer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DailyLesson {
  day: number;
  topic: string;
  description: string;
  activities: string[];
  estimatedTime: number;
  practiceQuestions: number;
}

interface StudyPlan {
  id: string;
  title: string;
  description: string;
  daily_lessons: DailyLesson[];
}

const LearningModule = () => {
  const navigate = useNavigate();
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [lessonContent, setLessonContent] = useState<string>('');

  useEffect(() => {
    const loadStudyPlan = async () => {
      try {
        console.log('=== LearningModule: Starting to load study plan ===');
        // Get active study plan ID from localStorage
        const planId = localStorage.getItem('active_study_plan_id');
        console.log('Active study plan ID from localStorage:', planId);
        
        if (!planId) {
          console.error('=== ERROR: No active study plan ID found in localStorage ===');
          toast({
            title: "No active study plan",
            description: "Please create a study plan first",
            variant: "destructive"
          });
          navigate('/quiz');
          return;
        }

        // Check authentication
        const { data: userData, error: authError } = await supabase.auth.getUser();
        console.log('Auth check result:', { user: !!userData?.user, authError });
        
        if (authError || !userData?.user) {
          console.error('=== ERROR: Authentication failed ===', authError);
          toast({
            title: "Authentication required",
            description: "Please log in to access lessons",
            variant: "destructive"
          });
          navigate('/auth');
          return;
        }

        // Fetch study plan from Supabase
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
          navigate('/quiz');
          return;
        }
        
        // Parse the daily_lessons JSON field
        const parsedPlan: StudyPlan = {
          id: data.id,
          title: data.title,
          description: data.description,
          daily_lessons: Array.isArray(data.daily_lessons) ? data.daily_lessons as unknown as DailyLesson[] : []
        };
        
        setStudyPlan(parsedPlan);
        
        // Get current day from URL params or start with day 1
        const urlParams = new URLSearchParams(window.location.search);
        const day = parseInt(urlParams.get('day') || '1');
        setCurrentDay(day);

        // Generate actual lesson content for the current lesson
        const currentLesson = parsedPlan.daily_lessons.find(lesson => lesson.day === day) || parsedPlan.daily_lessons[0];
        console.log('=== Current lesson lookup ===', { day, currentLesson, totalLessons: parsedPlan.daily_lessons.length });
        if (currentLesson) {
          console.log('=== Generating lesson content for topic:', currentLesson.topic, '===');
          
          // Set a basic lesson content first to avoid infinite loading
          setLessonContent(`# ${currentLesson.topic}\n\n## Loading Content...\n\nGenerating detailed lesson content...`);
          
          try {
          const { data: contentData, error: contentError } = await supabase.functions.invoke('generate-lesson-content', {
            body: {
              topic: currentLesson.topic,
              description: currentLesson.description,
              gradeLevel: data.grade_level || 'high school',
              activities: currentLesson.activities,
              language: localStorage.getItem('selectedLanguage') || 'en'
            }
          });

            console.log('Content generation result:', { contentData, contentError });

            if (contentError) {
              console.error('Error generating lesson content:', contentError);
              toast({
                title: "Content generation failed",
                description: "Using basic content. Please check your OpenAI API key.",
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
          console.error('=== ERROR: No lesson found for day:', day, 'Available lessons:', parsedPlan.daily_lessons.map(l => l.day), '===');
          setLessonContent(`# No Lesson Found\n\nCould not find lesson content for day ${day}.\n\nAvailable days: ${parsedPlan.daily_lessons.map(l => l.day).join(', ')}`);
        }
        
      } catch (error: any) {
        console.error('=== FATAL ERROR: Failed to load study plan ===', error);
        toast({
          title: "Failed to load study plan",
          description: error.message || "Please try again",
          variant: "destructive"
        });
        navigate('/quiz');
      } finally {
        console.log('=== LearningModule: Loading complete, setting loading to false ===');
        setLoading(false);
      }
    };

    loadStudyPlan();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="text-white">Loading your lesson...</div>
      </div>
    );
  }

  if (!studyPlan || !studyPlan.daily_lessons || studyPlan.daily_lessons.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="text-white text-center">
          <h2 className="text-xl mb-4">No lessons found</h2>
          <button 
            onClick={() => navigate('/quiz')}
            className="text-blue-400 underline"
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
    <LessonViewer 
      lesson={lesson}
      onBack={() => navigate('/quiz')}
      onComplete={() => {
        // Mark lesson as completed and navigate back
        toast({
          title: "Lesson completed!",
          description: `Great job completing Day ${currentLesson.day}: ${currentLesson.topic}`
        });
        navigate('/quiz');
      }}
    />
  );
};

export default LearningModule;