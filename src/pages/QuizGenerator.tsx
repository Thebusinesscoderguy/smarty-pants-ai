
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { EnhancedQuizGenerator } from '@/components/quiz/EnhancedQuizGenerator';
import { StudyPlanGenerator } from '@/components/quiz/StudyPlanGenerator';
import { QuizLibrary } from '@/components/quiz/QuizLibrary';
import { Button } from '@/components/ui/button';
import { MessageSquare, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';

const QuizGeneratorPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { userRole } = useUserRole();
  const [currentPage, setCurrentPage] = useState<'chat' | 'study'>('study');

  const renderNavigation = () => (
    <div className="flex items-center space-x-2 bg-white/5 rounded-2xl p-2 backdrop-blur-xl border border-white/10">
      {/* Chat */}
      <Button
        variant={currentPage === 'chat' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => { setCurrentPage('chat'); navigate('/chat'); }}
        className={`${currentPage === 'chat' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-white hover:bg-white/10'} transition-all duration-200 rounded-xl px-4 py-2`}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        {t('chat.nav.chat')}
      </Button>

      {/* Study Tools */}
      <Button
        variant={currentPage === 'study' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentPage('study')}
        className={`${currentPage === 'study' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'text-white hover:bg-white/10'} transition-all duration-200 rounded-xl px-4 py-2`}
      >
        <BookOpen className="h-4 w-4 mr-2" />
        Study Tools
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex flex-col">
      <Header />

      {/* Top navigation matching the rest of the app */}
      <div className="flex-shrink-0 p-4 border-b border-white/20 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {renderNavigation()}
          </div>
        </div>
      </div>

      <main className="flex-1 p-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Quiz & Study Tools</h1>
          <p className="text-white/80 mb-6">Generate quizzes from text/image/voice and build study plans from previous grades.</p>

          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/10 border border-white/20">
              <TabsTrigger value="generate">Generate Quiz</TabsTrigger>
              <TabsTrigger value="study-plan">Study Plan</TabsTrigger>
              <TabsTrigger value="library">Quiz Library</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="mt-6">
              <EnhancedQuizGenerator />
            </TabsContent>

            <TabsContent value="study-plan" className="mt-6">
              <StudyPlanGenerator />
            </TabsContent>

            <TabsContent value="library" className="mt-6">
              <QuizLibrary />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default QuizGeneratorPage;
