
import { useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuizGenerator } from '@/components/quiz/QuizGenerator';
import { QuizLibrary } from '@/components/quiz/QuizLibrary';

const QuizGeneratorPage = () => {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <AppSidebar />
      
      <div className="flex-1 overflow-hidden">
        <header className="p-6 border-b border-white/20">
          <h1 className="text-2xl font-bold">Quiz Generator</h1>
          <p className="text-gray-400 mt-1">
            Create personalized quizzes from your conversations and study materials
          </p>
        </header>
        
        <main className="p-6">
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10">
              <TabsTrigger value="generate">Generate Quiz</TabsTrigger>
              <TabsTrigger value="library">Quiz Library</TabsTrigger>
            </TabsList>
            <TabsContent value="generate" className="mt-6">
              <QuizGenerator />
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
