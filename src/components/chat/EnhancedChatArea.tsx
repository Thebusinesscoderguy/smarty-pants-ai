import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Paperclip, Mic, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useMessageHandler } from '@/hooks/useMessageHandler';
import { Message, MessageBubble } from '@/components/chat/MessageBubble';
import { InteractiveQuiz } from '@/components/learning/InteractiveQuiz';
import { LearningPathVisualization } from '@/components/learning/LearningPathVisualization';
import { HomeworkHelper } from '@/components/learning/HomeworkHelper';
import { TrendingUp, Brain } from 'lucide-react';

interface EnhancedChatAreaProps {
  isDemoMode?: boolean;
  demoTimeLeft?: number;
}

export const EnhancedChatArea = ({ isDemoMode, demoTimeLeft }: EnhancedChatAreaProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const { messages, setMessages, sendMessage, uploadFile } = useMessageHandler();
  const [showQuiz, setShowQuiz] = useState(false);
  const [showLearningPath, setShowLearningPath] = useState(false);
  const [showHomeworkHelper, setShowHomeworkHelper] = useState(false);
  const [currentFeatureData, setCurrentFeatureData] = useState<any>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isDemoMode && demoTimeLeft <= 0) {
      toast({
        title: "Demo Time Expired",
        description: "Your demo time has expired. Please sign up to continue.",
      });
    }
  }, [isDemoMode, demoTimeLeft, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSend = async () => {
    if (input.trim()) {
      await sendMessage(input);
      setInput('');
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const fileUrl = await uploadFile(file);
      if (fileUrl) {
        await sendMessage('Uploaded a file', 'file', fileUrl);
      } else {
        toast({
          title: "Upload Failed",
          description: "There was an error uploading your file.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    // Implement audio recording logic here
    toast({
      title: "Recording Started",
      description: "Tap the mic again to stop recording.",
    });
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Implement stop recording and audio processing logic here
    setAudioURL('mocked_audio_url'); // Replace with actual audio URL
    toast({
      title: "Recording Stopped",
      description: "Audio processed and ready to send.",
    });
  };

  const handleSpecialFeature = (message: any) => {
    if (message.specialFeature) {
      const { type, topic, problem } = message.specialFeature;
      
      switch (type) {
        case 'quiz':
          setCurrentFeatureData({ topic });
          setShowQuiz(true);
          break;
        case 'learning_path':
          setShowLearningPath(true);
          break;
        case 'homework':
          setCurrentFeatureData({ problem });
          setShowHomeworkHelper(true);
          break;
      }
    }
  };

  const handleQuizComplete = (score: number, totalQuestions: number) => {
    const completionMessage: Message = {
      id: Date.now().toString(),
      content: `Great job! You scored ${score}/${totalQuestions} (${Math.round((score/totalQuestions)*100)}%) on the quiz. Keep up the excellent work! 🎉`,
      isFromUser: false,
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages(prev => [...prev, completionMessage]);
    setShowQuiz(false);
    setCurrentFeatureData(null);
  };

  const handleTopicSelect = (topic: string) => {
    setCurrentFeatureData({ topic });
    setShowQuiz(true);
    setShowLearningPath(false);
  };

  return (
    <div className="flex h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Sidebar */}
      <div className="w-80 bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col">
        {/* User Info */}
        <div className="p-4 flex items-center space-x-4 border-b border-white/10">
          <Avatar>
            {user?.user_metadata?.avatar_url ? (
              <AvatarImage src={user.user_metadata.avatar_url} alt={user?.user_metadata?.name as string} />
            ) : (
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
            )}
          </Avatar>
          <div>
            <div className="text-lg font-semibold text-white">{user?.user_metadata?.name || user?.email}</div>
            <div className="text-sm text-gray-400">
              {isDemoMode ? 'Demo Mode' : 'Active'}
            </div>
          </div>
        </div>
        
        {/* Quick Action Buttons */}
        <div className="p-4 border-t border-white/10">
          <div className="space-y-2">
            <Button
              onClick={() => setShowLearningPath(!showLearningPath)}
              variant="outline"
              className="w-full justify-start border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Learning Path
            </Button>
            <Button
              onClick={() => setShowHomeworkHelper(!showHomeworkHelper)}
              variant="outline"
              className="w-full justify-start border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
            >
              <Brain className="mr-2 h-4 w-4" />
              Homework Help
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message, index) => (
            <div key={message.id || index}>
              <MessageBubble 
                message={message} 
                onSpecialFeature={handleSpecialFeature}
              />
              
              {/* Show special features inline */}
              {message.specialFeature && (
                <div className="mt-4">
                  {message.specialFeature.type === 'quiz' && showQuiz && (
                    <InteractiveQuiz
                      topic={currentFeatureData?.topic || message.specialFeature.topic}
                      onComplete={handleQuizComplete}
                      chatHistory={messages}
                    />
                  )}
                  
                  {message.specialFeature.type === 'learning_path' && showLearningPath && (
                    <LearningPathVisualization
                      onTopicSelect={handleTopicSelect}
                    />
                  )}
                  
                  {message.specialFeature.type === 'homework' && showHomeworkHelper && (
                    <HomeworkHelper
                      onComplete={(sessionId) => {
                        setShowHomeworkHelper(false);
                        const completionMessage: Message = {
                          id: Date.now().toString(),
                          content: "Excellent work on completing your homework! You've learned valuable problem-solving skills. 🎓",
                          isFromUser: false,
                          timestamp: new Date(),
                          type: 'text'
                        };
                        setMessages(prev => [...prev, completionMessage]);
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
          
          {/* Standalone Learning Features */}
          {showLearningPath && !messages.some(m => m.specialFeature?.type === 'learning_path') && (
            <LearningPathVisualization onTopicSelect={handleTopicSelect} />
          )}
          
          {showHomeworkHelper && !messages.some(m => m.specialFeature?.type === 'homework') && (
            <HomeworkHelper
              onComplete={(sessionId) => {
                setShowHomeworkHelper(false);
                const completionMessage: Message = {
                  id: Date.now().toString(),
                  content: "Great job completing your homework with step-by-step guidance! 🎓",
                  isFromUser: false,
                  timestamp: new Date(),
                  type: 'text'
                };
                setMessages(prev => [...prev, completionMessage]);
              }}
            />
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center space-x-3">
            {/* Attachment Button */}
            <label htmlFor="upload-file">
              <Paperclip className="h-6 w-6 text-gray-400 cursor-pointer" />
              <input
                type="file"
                id="upload-file"
                className="hidden"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
            </label>

            {/* Mic Button */}
            <Button
              variant="ghost"
              className="p-2 rounded-full hover:bg-gray-700/50"
              onClick={() => {
                if (isRecording) {
                  stopRecording();
                } else {
                  startRecording();
                }
              }}
            >
              {isRecording ? (
                <X className="h-6 w-6 text-red-500" />
              ) : (
                <Mic className="h-6 w-6 text-gray-400" />
              )}
            </Button>

            {/* Input Field */}
            <Input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSend();
                }
              }}
              className="bg-black/20 border-white/20 text-white placeholder-gray-400 rounded-full flex-1 focus:ring-0 focus:border-white/30"
            />

            {/* Send Button */}
            <Button
              onClick={handleSend}
              className="rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
