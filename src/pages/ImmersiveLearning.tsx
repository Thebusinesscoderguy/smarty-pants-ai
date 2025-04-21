
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components/AppSidebar';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Book, Code, Atom } from 'lucide-react';
import ImmersiveEnvironment from '@/components/immersive/ImmersiveEnvironment';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

const subjects = [
  { id: 'astronomy', name: 'Astronomy', icon: Home, environment: 'spaceship' },
  { id: 'biology', name: 'Biology', icon: Atom, environment: 'forest' },
  { id: 'coding', name: 'Coding', icon: Code, environment: 'dojo' },
  { id: 'literature', name: 'Literature', icon: Book, environment: 'library' },
];

const ImmersiveLearning = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [activeSubject, setActiveSubject] = useState(subjectId || 'astronomy');
  const [environment, setEnvironment] = useState('spaceship');
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [isAvatarListening, setIsAvatarListening] = useState(false);
  const [isAvatarThinking, setIsAvatarThinking] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    isRecording,
    recordingTime,
    handleStartRecording,
    handleStopRecording
  } = useVoiceRecorder();

  // Set the environment based on the selected subject
  useEffect(() => {
    const subject = subjects.find(s => s.id === activeSubject);
    if (subject) {
      setEnvironment(subject.environment);
    }
  }, [activeSubject]);

  // Simulate avatar starting to teach when subject changes
  useEffect(() => {
    if (activeSubject) {
      setIsAvatarThinking(true);
      
      // Simulate AI thinking time
      setTimeout(() => {
        setIsAvatarThinking(false);
        setIsAvatarSpeaking(true);
        
        // Simulate avatar speaking time
        setTimeout(() => {
          setIsAvatarSpeaking(false);
        }, 5000);
      }, 2000);
    }
  }, [activeSubject]);

  const handleSubjectChange = (subject: string) => {
    setActiveSubject(subject);
    navigate(`/immersive/${subject}`);
  };

  const handleAskQuestion = () => {
    if (isRecording) {
      handleStopRecording();
      setIsAvatarListening(false);
      setIsAvatarThinking(true);
      
      // Simulate AI thinking about the question
      setTimeout(() => {
        setIsAvatarThinking(false);
        setIsAvatarSpeaking(true);
        
        // Simulate avatar responding
        setTimeout(() => {
          setIsAvatarSpeaking(false);
          toast({
            title: "Response ready",
            description: "The AI has answered your question.",
          });
        }, 4000);
      }, 2000);
    } else {
      handleStartRecording();
      setIsAvatarListening(true);
    }
  };

  console.log('Rendering ImmersiveLearning component', { activeSubject, environment });

  return (
    <div className="flex min-h-screen bg-black text-white">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-white/10 py-3 px-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Immersive Learning</h1>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAskQuestion}
              className={isRecording ? "bg-red-500 hover:bg-red-600" : ""}
            >
              {isRecording ? `Recording (${recordingTime}s)` : "Ask a Question"}
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden p-4 flex flex-col">
          <Tabs value={activeSubject} onValueChange={handleSubjectChange} className="flex-1 flex flex-col">
            <TabsList className="mb-4">
              {subjects.map(subject => (
                <TabsTrigger key={subject.id} value={subject.id} className="flex items-center gap-2">
                  <subject.icon className="h-4 w-4" />
                  <span>{subject.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="flex-1 overflow-hidden relative">
              {subjects.map(subject => (
                <TabsContent 
                  key={subject.id} 
                  value={subject.id} 
                  className="absolute inset-0 h-full"
                  forceMount={subject.id === activeSubject}
                >
                  <div className="h-full">
                    <ImmersiveEnvironment 
                      environment={subject.environment}
                      isSpeaking={isAvatarSpeaking}
                      isListening={isAvatarListening}
                      isThinking={isAvatarThinking}
                      subjectId={subject.id}
                    />
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ImmersiveLearning;
