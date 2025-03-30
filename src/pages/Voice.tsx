import { useState, useRef } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Play } from 'lucide-react';

interface VoiceMessage {
  text: string;
  timestamp: Date;
}

const Voice = () => {
  const [messages, setMessages] = useState<VoiceMessage[]>([
    {
      text: "Welcome to voice messaging! Press the microphone button to start recording.",
      timestamp: new Date(),
    }
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    
    setTimeout(() => {
      const newUserMessage = {
        text: "This is a simulated user voice message that would be transcribed from actual voice recording.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      scrollToBottom();
      
      setTimeout(() => {
        const aiResponse = {
          text: "I've processed your voice message. This is where the AI would respond both in text and with text-to-speech voice.",
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, aiResponse]);
        scrollToBottom();
      }, 1500);
    }, 1000);
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col max-h-screen">
        <header className="p-4 border-b border-white/20">
          <h1 className="text-xl font-bold">Voice Messages</h1>
        </header>
        
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <Card 
                key={index}
                className="p-4 bg-white/5 border-white/20"
              >
                <p className="mb-2">{message.text}</p>
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-white/30 hover:bg-white/10"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Play
                  </Button>
                  <span className="text-xs text-white/50">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </Card>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t border-white/20 flex justify-center">
            {isRecording ? (
              <Button 
                onClick={handleStopRecording}
                variant="destructive"
                size="lg"
                className="rounded-full w-16 h-16 flex items-center justify-center"
              >
                <Square className="h-6 w-6" />
              </Button>
            ) : (
              <Button 
                onClick={handleStartRecording}
                className="bg-white text-black hover:bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center"
              >
                <Mic className="h-6 w-6" />
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Voice;
