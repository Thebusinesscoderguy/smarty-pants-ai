import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ArrowLeft, BookOpen, CheckCircle, Info, FileText, HelpCircle } from 'lucide-react';
import { SpeakButton } from '@/components/voice/SpeakButton';
import { TTSSettingsBar } from '@/components/voice/TTSSettingsBar';
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
  const [ttsVoice, setTtsVoice] = useState('alloy');
  const [showingDetail, setShowingDetail] = useState(false);
  const [showingSummary, setShowingSummary] = useState(false);
  const [expandedContent, setExpandedContent] = useState<string>('');
  const [summaryContent, setSummaryContent] = useState<string>('');
  const [questionAnswer, setQuestionAnswer] = useState<string>('');
  const [showingQuestion, setShowingQuestion] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  
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

  const handleSummarize = async () => {
    if (showingSummary) {
      setShowingSummary(false);
      setShowingDetail(false);
      setShowingQuestion(false);
      return;
    }

    if (summaryContent) {
      setShowingSummary(true);
      setShowingDetail(false);
      setShowingQuestion(false);
      return;
    }

    setIsLoadingSummary(true);
    try {
      const { data, error } = await supabase.functions.invoke('explain-text', {
        body: { 
          text: lesson.content,
          mode: 'summary'
        }
      });

      if (error) throw error;
      
      setSummaryContent(data.text);
      setShowingSummary(true);
      setShowingDetail(false);
      setShowingQuestion(false);
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleAskQuestion = async () => {
    const question = prompt("What would you like to know about this topic?");
    if (!question) return;

    setIsLoadingQuestion(true);
    setShowingQuestion(true);
    setShowingDetail(false);
    setShowingSummary(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('ask-question', {
        body: { 
          question,
          lessonContent: lesson.content
        }
      });

      if (error) throw error;
      
      setQuestionAnswer(data.answer);
    } catch (error) {
      console.error('Error getting answer:', error);
      setQuestionAnswer('Sorry, I encountered an error while trying to answer your question. Please try again.');
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-accent/10 text-foreground flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/50 backdrop-blur-sm border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            onClick={onBack}
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Module
          </Button>
          
          <div className="flex items-center gap-4">
            <TTSSettingsBar voice={ttsVoice} onVoiceChange={setTtsVoice} />
            <Badge variant="outline">
              <Clock className="mr-1 h-3 w-3" />
              {lesson.duration} min
            </Badge>
            <Button 
              onClick={handleCompleteLesson}
              className="bg-primary hover:bg-primary/90"
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
          <Card className="bg-card/80 border-border backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BookOpen className="mr-1 h-6 w-6 text-primary" />
                {lesson.title}
                <SpeakButton
                  text={lesson.content.slice(0, 300)}
                  voice={ttsVoice}
                  size="sm"
                  variant="outline"
                  className="rounded-full h-8 w-8 p-0 ml-2"
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[50vh] pr-4">
                <div className="prose max-w-none leading-relaxed">
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      h1: ({ children }) => <h1 className="text-3xl font-bold text-foreground mb-4 mt-8 first:mt-0">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-2xl font-semibold text-primary mb-3 mt-6">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xl font-medium text-accent mb-2 mt-4">{children}</h3>,
                      p: ({ children }) => <p className="text-foreground/90 mb-4 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="text-foreground/90 mb-4 space-y-2">{children}</ul>,
                      ol: ({ children }) => <ol className="text-foreground/90 mb-4 space-y-2">{children}</ol>,
                      li: ({ children }) => <li className="ml-4">{children}</li>,
                      strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="text-primary/80">{children}</em>,
                      code: ({ children }) => <code className="bg-muted px-2 py-1 rounded text-primary">{children}</code>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary pl-4 my-4 text-muted-foreground italic">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {showingSummary ? summaryContent || lesson.content :
                     showingDetail ? expandedContent || lesson.content :
                     showingQuestion ? `## Your Question Answered\n\n${questionAnswer}` :
                     lesson.content}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-border">
                <Button
                  onClick={handleMoreDetail}
                  variant="outline"
                  disabled={isLoadingDetail}
                  className={showingDetail ? 'bg-primary/20 border-primary' : ''}
                >
                  <Info className="mr-2 h-4 w-4" />
                  {isLoadingDetail ? 'Loading...' : showingDetail ? 'Less Detail' : 'More Detail'}
                </Button>
                
                <Button
                  onClick={handleSummarize}
                  variant="outline"
                  disabled={isLoadingSummary}
                  className={showingSummary ? 'bg-accent/20 border-accent' : ''}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {isLoadingSummary ? 'Loading...' : showingSummary ? 'Full Content' : 'Summarize'}
                </Button>
                
                <Button
                  onClick={handleAskQuestion}
                  variant="outline"
                  disabled={isLoadingQuestion}
                  className={showingQuestion ? 'bg-primary/20 border-primary' : ''}
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  {isLoadingQuestion ? 'Loading...' : 'Ask Question'}
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