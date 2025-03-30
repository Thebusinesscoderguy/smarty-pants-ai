
import { useState, useEffect, useRef } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Send } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUserMessageTimeRef = useRef<Date | null>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Timer for tracking time since last answer
  useEffect(() => {
    if (isTimerActive) {
      timerRef.current = setInterval(() => {
        if (lastUserMessageTimeRef.current) {
          const elapsed = Math.floor((new Date().getTime() - lastUserMessageTimeRef.current.getTime()) / 1000);
          // Cap at 10 minutes (600 seconds) if longer than an hour
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
  }, [isTimerActive]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    
    // Update last message time and start timer
    lastUserMessageTimeRef.current = new Date();
    setIsTimerActive(true);
    
    // Simulate token counting (would be retrieved from API in real implementation)
    const inputTokenCount = Math.ceil(input.length / 4);
    setInputTokens((prev) => prev + inputTokenCount);
    
    // Simulate API response with a delayed assistant message
    setTimeout(() => {
      // This is where you would call your OpenAI API in a real implementation
      const aiResponse = simulateAIResponse(input, timeSinceLastAnswer);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Update output tokens
      const outputTokenCount = Math.ceil(aiResponse.length / 4);
      setOutputTokens((prev) => prev + outputTokenCount);
      
      // Stop the timer after receiving response
      setIsTimerActive(false);
    }, 1000);
  };

  // Temporary function to simulate OpenAI response (would be replaced with actual API call)
  const simulateAIResponse = (userMessage: string, timeElapsed: number): string => {
    // Logic to adapt based on time elapsed
    const isSlowResponse = timeElapsed > 15;
    
    if (userMessage.toLowerCase().includes('quiz')) {
      if (userMessage.toLowerCase().includes('math') || userMessage.toLowerCase().includes('+')) {
        return isSlowResponse 
          ? "Let's work through this math problem step by step. First, can you tell me what you think the answer might be?" 
          : "Great job with the math! Do you want to try a harder problem?";
      }
      
      if (userMessage.toLowerCase().includes('spell')) {
        return isSlowResponse 
          ? "Let's practice spelling more. Can you spell 'elephant'? It's a bit trickier." 
          : "Your spelling is excellent! Let's move to something more challenging.";
      }
    }
    
    return isSlowResponse
      ? "I notice you're taking your time with this topic. Would you like me to explain it in more detail or provide additional examples?"
      : "You seem to understand this well! Shall we move on to the next concept?";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-black text-white">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col max-h-screen">
          <header className="p-4 border-b border-white/20">
            <h1 className="text-xl font-bold">Chat with EduAI</h1>
          </header>
          
          <main className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
            
            {/* Time tracker */}
            <div className="px-4 py-2 text-white/70 text-sm border-t border-white/20">
              Time since last answer: {timeSinceLastAnswer} seconds
            </div>
            
            {/* Input area */}
            <div className="p-4 border-t border-white/20">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type here..."
                  className="flex-1 bg-transparent border-white/30 focus-visible:ring-white"
                />
                <Button 
                  onClick={handleSendMessage}
                  className="bg-white text-black hover:bg-gray-200"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Features;
