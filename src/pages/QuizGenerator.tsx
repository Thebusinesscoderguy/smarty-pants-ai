
import { useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedQuizGenerator } from '@/components/quiz/EnhancedQuizGenerator';
import { StudyPlanGenerator } from '@/components/quiz/StudyPlanGenerator';
import { QuizLibrary } from '@/components/quiz/QuizLibrary';

const QuizGeneratorPage = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar />
      
      <div className="flex-1 overflow-hidden">
        <header className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">Quiz & Study Tools</h1>
          <p className="text-muted-foreground mt-1">
            Generate quizzes, create study plans, and manage your learning materials
          </p>
        </header>
        
        <main className="p-6">
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-card/50">
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
        </main>
      </div>
    </div>
  );
};

export default QuizGeneratorPage;
