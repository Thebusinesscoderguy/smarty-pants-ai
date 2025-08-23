import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ArrowLeft, BookOpen, CheckCircle, Info, FileText, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { supabase } from '@/integrations/supabase/client';

interface Lesson {
  id: string;
  title: string;
  content: string;
  duration: number;
  type: 'reading' | 'video' | 'interactive';
  completed?: boolean;
}

interface LessonViewerProps {
  lesson: Lesson;
  onBack: () => void;
  onComplete: (lessonId: string) => void;
}

const LessonViewer: React.FC<LessonViewerProps> = ({ lesson, onBack, onComplete }) => {
  const [showingDetail, setShowingDetail] = useState(false);
  const [showingSummary, setShowingSummary] = useState(false);
  const [expandedContent, setExpandedContent] = useState<string>('');
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  
  const handleCompleteLesson = () => {
    onComplete(lesson.id);
  };

  const handleMoreDetail = async () => {
    if (showingDetail) {
      setShowingDetail(false);
      setShowingSummary(false);
      return;
    }

    if (expandedContent) {
      setShowingDetail(true);
      setShowingSummary(false);
      return;
    }

    setIsLoadingDetail(true);
    try {
      const { data, error } = await supabase.functions.invoke('expand-lesson-detail', {
        body: { content: lesson.content }
      });

      if (error) throw error;
      
      setExpandedContent(data.expandedContent);
      setShowingDetail(true);
      setShowingSummary(false);
    } catch (error) {
      console.error('Error expanding lesson detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleSummarize = () => {
    setShowingSummary(!showingSummary);
    setShowingDetail(false);
  };

  const handleAskQuestion = () => {
    const question = prompt("What would you like to know about this topic?");
    if (question) {
      alert(`I'd be happy to help you understand: "${question}". In a full version, this would connect to an AI tutor.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-white/30 bg-white/10 hover:bg-white/20 text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Module
          </Button>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-white/30 text-white">
              <Clock className="mr-1 h-3 w-3" />
              {lesson.duration} min
            </Badge>
            <Button 
              onClick={handleCompleteLesson}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Lesson
            </Button>
          </div>
        </div>
      </div>

      {/* Lesson Content */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/10 border-white/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center">
                <BookOpen className="mr-3 h-6 w-6 text-blue-400" />
                {lesson.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[50vh] pr-4">
                <div className="prose prose-invert max-w-none text-white/90 leading-relaxed">
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      h1: ({ children }) => <h1 className="text-3xl font-bold text-white mb-4 mt-8 first:mt-0">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-2xl font-semibold text-blue-300 mb-3 mt-6">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xl font-medium text-purple-300 mb-2 mt-4">{children}</h3>,
                      p: ({ children }) => <p className="text-white/90 mb-4 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="text-white/90 mb-4 space-y-2">{children}</ul>,
                      ol: ({ children }) => <ol className="text-white/90 mb-4 space-y-2">{children}</ol>,
                      li: ({ children }) => <li className="ml-4">{children}</li>,
                      strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="text-blue-200">{children}</em>,
                      code: ({ children }) => <code className="bg-white/10 px-2 py-1 rounded text-green-300">{children}</code>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-blue-400 pl-4 my-4 text-blue-100 italic">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {showingSummary ? `## Key Points Summary\n\n**Numbers and Operations**: Understanding different types of numbers and operations.\n\n**Algebra Basics**: Working with variables, equations, and functions.\n\n**Geometry Principles**: Dealing with shapes, angles, and spatial relationships.\n\n**Practical Applications**: Mathematics in daily life including finance, construction, and technology.\n\n**Problem-Solving**: Systematic approach to understanding and solving mathematical problems.` :
                     showingDetail ? expandedContent || lesson.content :
                     lesson.content}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-white/10">
                <Button
                  onClick={handleMoreDetail}
                  variant="outline"
                  disabled={isLoadingDetail}
                  className={`border-white/30 ${showingDetail ? 'bg-blue-600/30 text-blue-200' : 'bg-white/10 hover:bg-white/20'} text-white`}
                >
                  <Info className="mr-2 h-4 w-4" />
                  {isLoadingDetail ? 'Loading...' : showingDetail ? 'Less Detail' : 'More Detail'}
                </Button>
                
                <Button
                  onClick={handleSummarize}
                  variant="outline"
                  className={`border-white/30 ${showingSummary ? 'bg-purple-600/30 text-purple-200' : 'bg-white/10 hover:bg-white/20'} text-white`}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {showingSummary ? 'Full Content' : 'Summarize'}
                </Button>
                
                <Button
                  onClick={handleAskQuestion}
                  variant="outline"
                  className="border-white/30 bg-white/10 hover:bg-white/20 text-white"
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Ask Question
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;