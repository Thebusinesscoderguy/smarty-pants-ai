import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ArrowLeft, BookOpen, CheckCircle, Info, FileText, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
  
  const handleCompleteLesson = () => {
    onComplete(lesson.id);
  };

  const handleMoreDetail = () => {
    setShowingDetail(!showingDetail);
    setShowingSummary(false);
  };

  const handleSummarize = () => {
    setShowingSummary(!showingSummary);
    setShowingDetail(false);
  };

  const handleAskQuestion = () => {
    // Open a simple prompt for questions
    const question = prompt("What would you like to know about this topic?");
    if (question) {
      alert(`Great question! "${question}" - This would normally connect to an AI tutor to answer your question.`);
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
                    {showingSummary ? `## Summary\n\nThis is a concise summary of "${lesson.title}". The main points covered include the core concepts and key takeaways that you should remember from this lesson.` :
                     showingDetail ? `${lesson.content}\n\n## Additional Details\n\nHere are some additional insights and deeper explanations about the topics covered in this lesson. This expanded content provides more context and examples to help you better understand the material.` :
                     lesson.content}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-white/10">
                <Button
                  onClick={handleMoreDetail}
                  variant="outline"
                  className={`border-white/30 ${showingDetail ? 'bg-blue-600/30 text-blue-200' : 'bg-white/10 hover:bg-white/20'} text-white`}
                >
                  <Info className="mr-2 h-4 w-4" />
                  {showingDetail ? 'Less Detail' : 'More Detail'}
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