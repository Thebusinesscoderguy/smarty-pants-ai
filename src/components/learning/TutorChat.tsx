import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import MessageList from '@/components/MessageList';
import MessageInput from '@/components/MessageInput';
import { Clock, ArrowLeft, BookOpen, Target, CheckCircle } from 'lucide-react';
import { useTutorChat } from '@/hooks/useTutorChat';

interface Lesson {
  id: string;
  title: string;
  content: string;
  duration: number;
  type: 'reading' | 'video' | 'interactive';
  completed?: boolean;
}

interface TutorChatProps {
  lesson: Lesson;
  onBack: () => void;
  onComplete: (lessonId: string) => void;
}

const TutorChat: React.FC<TutorChatProps> = ({ lesson, onBack, onComplete }) => {
  const {
    messages,
    textMessage,
    setTextMessage,
    messagesEndRef,
    sendMessage,
    isLessonComplete,
    lessonProgress,
    handlePlayAudio,
    handlePauseAudio
  } = useTutorChat(lesson);

  const handleSendText = async () => {
    if (!textMessage.trim()) return;
    await sendMessage(textMessage);
    setTextMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleCompleteLesson = () => {
    onComplete(lesson.id);
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
            <div className="text-center">
              <div className="text-sm text-white/70">Progress</div>
              <div className="text-lg font-semibold">{Math.round(lessonProgress)}%</div>
            </div>
            <Badge variant="outline" className="border-white/30 text-white">
              <Clock className="mr-1 h-3 w-3" />
              {lesson.duration} min
            </Badge>
          </div>
        </div>
      </div>

      {/* Lesson Info Card */}
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/10 border-white/30 backdrop-blur-sm mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-white flex items-center">
                <BookOpen className="mr-2 h-5 w-5 text-blue-400" />
                {lesson.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-white/80">
                    <Target className="h-4 w-4 text-green-400" />
                    <span className="text-sm">Interactive Learning</span>
                  </div>
                </div>
                {isLessonComplete && (
                  <Button 
                    onClick={handleCompleteLesson}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Lesson
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col p-4">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
          <Card className="flex-1 bg-white/5 border-white/20 backdrop-blur-sm">
            <CardContent className="p-0 h-full">
              <div className="flex flex-col h-[60vh]">
                <ScrollArea className="flex-1 p-4">
                  <MessageList 
                    messages={messages}
                    onPlayAudio={handlePlayAudio}
                    onPauseAudio={handlePauseAudio}
                  />
                  <div ref={messagesEndRef} />
                </ScrollArea>

                <div className="border-t border-white/10 p-4">
                  <MessageInput 
                    onSendText={handleSendText}
                    onVoiceResponse={() => {}} // Disabled for focus on learning
                    onFileUpload={() => {}} // Disabled for focus on learning
                    textMessage={textMessage}
                    setTextMessage={setTextMessage}
                    file={null}
                    setFile={() => {}}
                    onKeyPress={handleKeyPress}
                    disabled={false}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TutorChat;