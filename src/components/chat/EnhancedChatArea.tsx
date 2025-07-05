
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Paperclip, Mic, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useMessageHandler } from '@/hooks/useMessageHandler';
import { InteractiveQuiz } from '@/components/learning/InteractiveQuiz';
import { LearningPathVisualization } from '@/components/learning/LearningPathVisualization';
import { HomeworkHelper } from '@/components/learning/HomeworkHelper';
import { TrendingUp, Brain, User, Bot } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isFromUser: boolean;
  timestamp: Date;
  type: string;
  specialFeature?: any;
}

interface MessageBubbleProps {
  message: Message;
  onSpecialFeature?: (message: Message) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onSpecialFeature }) => {
  useEffect(() => {
    if (message.specialFeature && onSpecialFeature) {
      onSpecialFeature(message);
    }
  }, [message, onSpecialFeature]);

  return (
    <div className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start space-x-3 max-w-4xl ${message.isFromUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        <div className={`p-3 rounded-2xl ${message.isFromUser ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-white/10'} border border-white/20`}>
          {message.isFromUser ? <User className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-purple-400" />}
        </div>
        <div className={`p-6 rounded-3xl ${message.isFromUser ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-white/10 text-white'} shadow-xl border border-white/20`}>
          <p className="text-lg leading-relaxed">{message.content}</p>
          <p className="text-sm mt-3 opacity-70">
            {message.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

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
    toast({
      title: "Recording Started",
      description: "Tap the mic again to stop recording.",
    });
  };

  const stopRecording = () => {
    setIsRecording(false);
    setAudioURL('mocked_audio_url');
    toast({
      title: "Recording Stopped",
      description: "Audio processed and ready to send.",
    });
  };

  const handleSpecialFeature = (message: Message) => {
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-semibold text-white">{user?.email?.split('@')[0] || 'User'}</div>
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
