import { useState, useEffect, useRef } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, FileUp, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

const Features = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m EduAI, your adaptive learning assistant. What would you like to learn today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [timeSinceLastAnswer, setTimeSinceLastAnswer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [inputTokens, setInputTokens] = useState(0);
  const [outputTokens, setOutputTokens] = useState(0);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showUploadSection, setShowUploadSection] = useState(false);
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [avatarStyle, setAvatarStyle] = useState<'teacher' | 'casual' | 'professional' | 'friendly'>('teacher');
  const [avatarEmotion, setAvatarEmotion] = useState<'neutral' | 'happy' | 'confused' | 'excited'>('neutral');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUserMessageTimeRef = useRef<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isTimerActive && isQuizMode) {
      timerRef.current = setInterval(() => {
        if (lastUserMessageTimeRef.current) {
          const elapsed = Math.floor((new Date().getTime() - lastUserMessageTimeRef.current.getTime()) / 1000);
          const cappedTime = elapsed > 3600 ? 600 : elapsed;
          setTimeSinceLastAnswer(cappedTime);
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerActive, isQuizMode]);

  const handleSendMessage = () => {
    if (!input.trim() && uploadedFiles.length === 0) return;

    const fileInfo = uploadedFiles.length > 0 
      ? `\n\nUploaded: ${uploadedFiles.map(f => f.name).join(', ')}`
      : '';

    const userMessage: Message = {
      role: 'user',
      content: input + fileInfo,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    
    lastUserMessageTimeRef.current = new Date();
    
    const isQuizRequest = input.toLowerCase().includes('quiz') || 
                  /^(test|exam|practice|exercise|problem|question)/i.test(input);
    
    if (isQuizRequest) {
      setIsQuizMode(true);
      setIsTimerActive(true);
    } else {
      setIsTimerActive(false);
    }
    
    const inputTokenCount = Math.ceil(input.length / 4);
    setInputTokens((prev) => prev + inputTokenCount);
    
    setUploadedFiles([]);
    setShowUploadSection(false);

    setAvatarEmotion('neutral');
    setIsSpeaking(false);
    
    setTimeout(() => {
      const aiResponse = simulateAIResponse(input, timeSinceLastAnswer, isQuizRequest);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      const outputTokenCount = Math.ceil(aiResponse.length / 4);
      setOutputTokens((prev) => prev + outputTokenCount);
      
      if (!isQuizRequest) {
        setIsTimerActive(false);
      }

      setIsSpeaking(true);
      
      setTimeout(() => {
        setIsSpeaking(false);
        
        if (aiResponse.includes("Great job")) {
          setAvatarEmotion('happy');
        } else if (aiResponse.includes("Let's work through")) {
          setAvatarEmotion('confused');
        } else {
          setAvatarEmotion('neutral');
        }
      }, aiResponse.length * 50);
    }, 1000);
  };

  const simulateAIResponse = (userMessage: string, timeElapsed: number, isQuizRequest: boolean): string => {
    if (!isQuizRequest) {
      if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
        return "Hello! How can I help with your learning today?";
      }
      
      if (userMessage.toLowerCase().includes('help') || userMessage.toLowerCase().includes('how')) {
        return "I can help you learn various subjects through conversations and quizzes. Just tell me what subject you're interested in or upload your study materials!";
      }
      
      if (userMessage.toLowerCase().includes('upload') || userMessage.toLowerCase().includes('file')) {
        return "You can upload your study materials using the file upload button next to the chat input. I can analyze your documents and help you learn from them.";
      }
      
      return "I'm here to help you learn. Would you like to start a quiz on a particular subject or upload some study materials?";
    }
    
    const isSlowResponse = timeElapsed > 15;
    
    if (userMessage.toLowerCase().includes('math') || 
        userMessage.toLowerCase().includes('+') || 
        /[0-9\+\-\*\/\=]/.test(userMessage)) {
      return isSlowResponse 
        ? "Let's work through this math problem step by step. First, can you tell me what you think the answer might be?" 
        : "Great job with the math! Do you want to try a harder problem?";
    }
    
    if (userMessage.toLowerCase().includes('spell') || 
        userMessage.toLowerCase().includes('spelling')) {
      return isSlowResponse 
        ? "Let's practice spelling more. Can you spell 'elephant'? It's a bit trickier." 
        : "Your spelling is excellent! Let's move on to something more challenging.";
    }
    
    return isSlowResponse
      ? "I notice you're taking your time with this question. Would you like me to explain it in more detail or provide additional examples?"
      : "You seem to be handling this quiz well! Let's try the next question.";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }));
      
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(files => files.filter(file => file.name !== fileName));
  };

  const toggleUploadSection = () => {
    setShowUploadSection(prev => !prev);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarStyleChange = (value: string) => {
    // Avatar functionality removed
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col max-h-screen">
        <header className="p-4 border-b border-white/20 flex justify-between items-center">
          <h1 className="text-xl font-bold">Chat with EduAI</h1>
        </header>
        
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-4 h-full">
            <div className="hidden lg:flex lg:col-span-1 bg-gray-900/30 p-4 flex-col items-center justify-center">
              <div className="w-48 h-48 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-4xl font-bold">AI</span>
              </div>
              {isQuizMode && (
                <div className="px-4 py-2 bg-white/5 rounded-md text-white/70 text-sm mt-4">
                  Time: {timeSinceLastAnswer} seconds
                </div>
              )}
            </div>
            
            <div className="col-span-1 lg:col-span-3 flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="lg:hidden flex justify-center mb-4">
                  <div className="w-48 h-48 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">AI</span>
                  </div>
                </div>
                
                {messages.map((message, index) => (
                  <div 
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <Card 
                      className={`max-w-[80%] p-3 ${
                        message.role === 'user' 
                          ? 'bg-white/10 text-white border-white/20' 
                          : 'bg-white/5 text-white border-white/20'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <div className="text-xs text-white/50 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </Card>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {showUploadSection && (
                <div className="p-4 border-t border-white/10 bg-white/5">
                  <div className="mb-2 flex justify-between items-center">
                    <h3 className="font-medium">Upload Study Materials</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={toggleUploadSection}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="bg-white/10 text-sm rounded px-2 py-1 flex items-center gap-1">
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <button 
                          onClick={() => removeFile(file.name)}
                          className="text-white/70 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    onClick={triggerFileInput} 
                    variant="outline" 
                    size="sm"
                    className="w-full border-dashed border-white/30"
                  >
                    Select files to upload
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    multiple
                  />
                </div>
              )}
              
              <div className="p-4 border-t border-white/20">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full border border-white/30 flex-shrink-0"
                    onClick={toggleUploadSection}
                  >
                    <FileUp className="h-5 w-5" />
                  </Button>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type here..."
                    className="flex-1 bg-transparent border-white/30 focus-visible:ring-white"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    className="bg-white text-black hover:bg-gray-200 flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Features;
