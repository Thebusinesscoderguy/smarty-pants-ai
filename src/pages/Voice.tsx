
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { toast } from '@/components/ui/use-toast';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useAudioHandler } from '@/hooks/useAudioHandler';
import { Message } from '@/types/message';
import TokenUsageDisplay from '@/components/voice/TokenUsageDisplay';
import ChatHeader from '@/components/voice/ChatHeader';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import OpenAIKeyForm from '@/components/OpenAIKeyForm';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageList from '@/components/MessageList';
import VoiceMessageInput from '@/components/VoiceMessageInput';

const OPENAI_VOICES = [
  { label: 'Alloy (Default)', value: 'alloy' },
  { label: 'Echo', value: 'echo' },
  { label: 'Fable', value: 'fable' },
  { label: 'Onyx', value: 'onyx' },
  { label: 'Nova', value: 'nova' },
  { label: 'Shimmer', value: 'shimmer' },
];

const MONTHLY_TOKEN_LIMIT = 5000;

const Voice = () => {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-message',
      text: "Welcome to Teachly! How can I assist you today? You can send text, voice messages, or upload files.",
      timestamp: new Date(),
      isFromUser: false,
      type: 'text',
      tokenCount: 18
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [textMessage, setTextMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [selectedVoice, setSelectedVoice] = useState('alloy');

  const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const [inputTokens, setInputTokens] = useState(0);
  const [outputTokens, setOutputTokens] = useState(0);
  const monthlyLimit = MONTHLY_TOKEN_LIMIT;

  const [apiKeyError, setApiKeyError] = useState(false);
  
  // Response time tracking
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [lastQuestionTime, setLastQuestionTime] = useState<Date | null>(null);
  const [responseTimes, setResponseTimes] = useState<{
    question: string;
    responseTimeMs: number;
    wasCorrect: boolean;
  }[]>([]);
  const [userStrengths, setUserStrengths] = useState<string[]>([]);
  const [userWeaknesses, setUserWeaknesses] = useState<string[]>([]);

  const {
    isRecording,
    recordingTime,
    audioData,
    setAudioData,
    handleStartRecording,
    handleStopRecording
  } = useVoiceRecorder();

  const {
    handlePlayAudio,
    handlePauseAudio,
    activeSpeakingMessage
  } = useAudioHandler();

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchTokenUsage();
      checkOpenAIKey();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkOpenAIKey = async () => {
    try {
      const response = await supabase.functions.invoke('text-to-voice', {
        body: { text: "Test", voice: 'alloy' }
      });
      if (response.error && response.error.message && response.error.message.includes('API key')) {
        setApiKeyError(true);
        console.error("API key error from function:", response.error);
      } else {
        setApiKeyError(false);
      }
    } catch (error: any) {
      console.error("Error checking OpenAI API key:", error);
      if (error.message && error.message.includes('API key')) {
        setApiKeyError(true);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTokenUsage = async () => {
    // Placeholder for token usage fetching logic
    // This would typically fetch from your backend or database
    // For now, we'll just use the state values
  };

  const fetchMessages = async () => {
    // Placeholder for messages fetching logic
    // This would typically fetch from your backend or database
    // For now, we'll just use the initial welcome message
  };

  const processVoiceToText = async (audioBase64: string) => {
    try {
      // Add a temporary message to show processing
      const processingMessageId = `processing-${Date.now()}`;
      const processingMessage: Message = {
        id: processingMessageId,
        text: "Processing your voice message...",
        timestamp: new Date(),
        isFromUser: false,
        type: 'text',
        tokenCount: 0
      };
      
      setMessages(prev => [...prev, processingMessage]);
      
      try {
        // Use supabase.functions.invoke instead of direct fetch
        const response = await supabase.functions.invoke('voice-to-text', {
          body: { audio: audioBase64 }
        });
        
        if (response.error) {
          if (response.error.message && response.error.message.includes('API key')) {
            setApiKeyError(true);
          }
          throw new Error(response.error.message || 'Failed to process voice');
        }
        
        const transcribedText = response.data.text;
        
        // Remove the processing message
        setMessages(prev => prev.filter(m => m.id !== processingMessageId));
        
        // Create a user message with the transcribed text
        const userMessage: Message = {
          id: `voice-${Date.now()}`,
          text: transcribedText,
          timestamp: new Date(),
          isFromUser: true,
          type: 'voice',
          tokenCount: Math.ceil(transcribedText.length / 4)
        };
        
        if (audioData) {
          // Convert audioData to a URL
          const audioUrl = URL.createObjectURL(audioData);
          userMessage.audioUrl = audioUrl;
        }
        
        setMessages(prev => [...prev, userMessage]);
        
        // Simulate token counting without database access
        setInputTokens(prev => prev + (userMessage.tokenCount || 0));
        setTotalTokensUsed(prev => prev + (userMessage.tokenCount || 0));
        
        // Track response time if in quiz mode
        if (isQuizMode && lastQuestionTime) {
          const responseTimeMs = new Date().getTime() - lastQuestionTime.getTime();
          const isCorrectAnswer = analyzeAnswerCorrectness(transcribedText);
          
          const newResponseTime = {
            question: getLastQuestion(),
            responseTimeMs,
            wasCorrect: isCorrectAnswer
          };
          
          setResponseTimes(prev => [...prev, newResponseTime]);
          analyzeUserPerformance([...responseTimes, newResponseTime]);
        }
        
        await getAIResponse(transcribedText);
        
      } catch (error: any) {
        // Remove the processing message
        setMessages(prev => prev.filter(m => m.id !== processingMessageId));
        
        console.error("Error in processVoiceToText:", error);
        toast({
          title: "Error",
          description: "Failed to process voice: " + error.message,
          variant: "destructive"
        });
      }
      
    } catch (error: any) {
      console.error("Error in processVoiceToText:", error);
      toast({
        title: "Error",
        description: "Failed to process voice: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleSendTextMessage = async () => {
    if (!textMessage.trim()) return;
    
    try {
      const tokenCount = Math.ceil(textMessage.length / 4);
      
      // Create a temporary ID for this message
      const tempId = `text-${Date.now()}`;
      
      const newUserMessage: Message = {
        id: tempId,
        text: textMessage,
        timestamp: new Date(),
        isFromUser: true,
        type: 'text',
        tokenCount: tokenCount
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      setTextMessage('');
      
      // Simulate token counting without database access
      setInputTokens(prev => prev + tokenCount);
      setTotalTokensUsed(prev => prev + tokenCount);
      
      // Track response time if in quiz mode
      if (isQuizMode && lastQuestionTime) {
        const responseTimeMs = new Date().getTime() - lastQuestionTime.getTime();
        const isCorrectAnswer = analyzeAnswerCorrectness(textMessage);
        
        const newResponseTime = {
          question: getLastQuestion(),
          responseTimeMs,
          wasCorrect: isCorrectAnswer
        };
        
        setResponseTimes(prev => [...prev, newResponseTime]);
        analyzeUserPerformance([...responseTimes, newResponseTime]);
      }
      
      await getAIResponse(textMessage);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;
    
    try {
      const messageText = `Uploaded file: ${file.name}`;
      const tokenCount = Math.ceil(messageText.length / 4);
      
      // Create file URL directly
      const fileUrl = URL.createObjectURL(file);
      
      const newUserMessage: Message = {
        id: `file-${Date.now()}`,
        text: messageText,
        timestamp: new Date(),
        fileUrl: fileUrl,
        fileName: file.name,
        isFromUser: true,
        type: 'file',
        tokenCount: tokenCount
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      setFile(null);
      
      // Simulate token counting without database access
      setInputTokens(prev => prev + tokenCount);
      setTotalTokensUsed(prev => prev + tokenCount);
      
      await getAIResponse(`I've uploaded a file named ${file.name}. Can you help me with this?`);
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file: " + error.message,
        variant: "destructive"
      });
    }
  };

  const getAIResponse = async (userMessage: string) => {
    try {
      const processingMessageId = `processing-${Date.now()}`;
      const processingMessage: Message = {
        id: processingMessageId,
        text: "Generating voice response...",
        timestamp: new Date(),
        isFromUser: false,
        type: 'text',
        tokenCount: 0
      };

      setMessages(prev => [...prev, processingMessage]);

      try {
        // Get previous messages for context (limit to last 10 for token efficiency)
        const conversationHistory = messages
          .filter(m => m.id !== 'welcome-message' && !m.id?.startsWith('processing-'))
          .slice(-10)
          .map(m => ({
            role: m.isFromUser ? "user" : "assistant", 
            content: m.text
          }));
        
        // Check if this appears to be a quiz-related message
        const isQuizRequest = userMessage.toLowerCase().includes('quiz') || 
                             userMessage.toLowerCase().includes('test') || 
                             userMessage.toLowerCase().includes('question');
        
        // If we're starting a quiz, enable quiz mode
        if (isQuizRequest && !isQuizMode) {
          setIsQuizMode(true);
          setResponseTimes([]);
        }
        
        // Generate AI response using OpenAI's chat completion API
        const completionResponse = await supabase.functions.invoke('chat-completion', {
          body: {
            messages: [
              {
                role: "system",
                content: `You are a helpful, friendly AI assistant named Teachly. Be conversational, thoughtful, and helpful with your responses. Keep responses concise yet informative.
                
                ${isQuizMode ? "You are in quiz mode. Ask educational questions and provide feedback on the user's answers. Focus on helping them learn." : ""}
                
                ${responseTimes.length > 0 ? `Here's some information about the user's performance:
                - Strengths: ${userStrengths.join(', ') || 'Not enough data yet'}
                - Weaknesses: ${userWeaknesses.join(', ') || 'Not enough data yet'}
                - Response times: Fast: ${getFastResponseTopics()}, Slow: ${getSlowResponseTopics()}` : ""}
                
                When responding to user questions, be natural and conversational. Don't use phrases like "I've processed your message" or other robotic language.`
              },
              ...conversationHistory,
              { role: "user", content: userMessage }
            ]
          }
        });

        if (completionResponse.error) {
          throw new Error(completionResponse.error.message || 'Failed to generate AI response');
        }

        const aiResponseText = completionResponse.data.text;
        
        // Check if this is a quiz question and update state
        if (isQuizMode && aiResponseText.includes('?')) {
          setLastQuestionTime(new Date());
        }

        // Generate speech from the AI response text
        const voiceResponse = await supabase.functions.invoke('text-to-voice', {
          body: { 
            text: aiResponseText,
            voice: selectedVoice || 'alloy'
          }
        });

        if (voiceResponse.error) {
          if (voiceResponse.error.message && voiceResponse.error.message.includes('API key')) {
            setApiKeyError(true);
          }
          throw new Error(voiceResponse.error.message || 'Failed to generate speech');
        }

        const base64Audio = voiceResponse.data.audioContent;

        const byteCharacters = atob(base64Audio);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const audioBlob = new Blob([byteArray], { type: 'audio/mp3' });

        const audioUrl = URL.createObjectURL(audioBlob);

        setMessages(prev => prev.filter(m => m.id !== processingMessageId));

        const aiMessageId = `ai-${Date.now()}`;
        const tokenCount = Math.ceil(aiResponseText.length / 4);
        
        const aiMessage: Message = {
          id: aiMessageId,
          text: aiResponseText,
          timestamp: new Date(),
          audioUrl: audioUrl,
          isFromUser: false,
          type: 'voice',
          tokenCount: tokenCount
        };

        setMessages(prev => [...prev, aiMessage]);
        setOutputTokens(prev => prev + tokenCount);
        setTotalTokensUsed(prev => prev + tokenCount);

        setTimeout(() => {
          if (aiMessageId) {
            handlePlayAudio(aiMessageId, messages, setMessages);
          }
        }, 500);

      } catch (error: any) {
        setMessages(prev => prev.filter(m => m.id !== processingMessageId));
        console.error("Error in getAIResponse:", error);
        toast({
          title: "Error",
          description: "Failed to get AI response: " + error.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error in getAIResponse:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response: " + error.message,
        variant: "destructive"
      });
    }
  };

  // Helper functions for analyzing user performance
  const getLastQuestion = (): string => {
    const aiMessages = messages.filter(m => !m.isFromUser);
    if (aiMessages.length > 0) {
      const lastMessage = aiMessages[aiMessages.length - 1].text;
      return lastMessage;
    }
    return '';
  };

  const analyzeAnswerCorrectness = (answer: string): boolean => {
    // This is a simple placeholder implementation
    // In a real app, you would need a more sophisticated answer evaluation
    const lastQuestion = getLastQuestion().toLowerCase();
    const userAnswer = answer.toLowerCase();
    
    // Simple example rules - this would be much more sophisticated in production
    if (lastQuestion.includes('capital of france') && userAnswer.includes('paris')) {
      return true;
    }
    if (lastQuestion.includes('2+2') && (userAnswer.includes('4') || userAnswer.includes('four'))) {
      return true;
    }
    
    // Default rule - assumes correct answers contain keywords from the question
    // This is very simplistic and would need to be improved
    const questionWords = lastQuestion.split(' ')
      .filter(word => word.length > 4)
      .map(word => word.replace(/[^a-zA-Z0-9]/g, ''));
    
    let correctWordCount = 0;
    questionWords.forEach(word => {
      if (userAnswer.includes(word)) {
        correctWordCount++;
      }
    });
    
    return correctWordCount > 0;
  };
  
  const analyzeUserPerformance = (responseData: {
    question: string;
    responseTimeMs: number;
    wasCorrect: boolean;
  }[]) => {
    if (responseData.length < 2) return; // Need more data
    
    // Extract topics from questions (simple implementation)
    const topics = new Map<string, {
      totalTime: number,
      correctCount: number,
      incorrectCount: number,
      count: number
    }>();
    
    // Simple topic extraction - in production this would be more sophisticated
    responseData.forEach(data => {
      // Very basic topic extraction - would use NLP in production
      const possibleTopics = data.question.toLowerCase()
        .split(' ')
        .filter(word => word.length > 4)
        .map(word => word.replace(/[^a-zA-Z0-9]/g, ''));
      
      const topic = possibleTopics[0] || 'general'; // Simplified
      
      if (!topics.has(topic)) {
        topics.set(topic, {
          totalTime: 0,
          correctCount: 0,
          incorrectCount: 0,
          count: 0
        });
      }
      
      const topicData = topics.get(topic)!;
      topicData.totalTime += data.responseTimeMs;
      if (data.wasCorrect) {
        topicData.correctCount++;
      } else {
        topicData.incorrectCount++;
      }
      topicData.count++;
    });
    
    // Analyze strengths (quick correct answers)
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    topics.forEach((data, topic) => {
      const averageTime = data.totalTime / data.count;
      const correctRatio = data.correctCount / data.count;
      
      if (correctRatio > 0.7 && data.count >= 2) {
        strengths.push(topic);
      }
      
      if (correctRatio < 0.5 || averageTime > 10000) { // More than 10 seconds
        weaknesses.push(topic);
      }
    });
    
    setUserStrengths(strengths);
    setUserWeaknesses(weaknesses);
  };
  
  const getFastResponseTopics = (): string => {
    if (responseTimes.length < 2) return 'Not enough data';
    
    const topicTimes = new Map<string, number[]>();
    
    responseTimes.forEach(data => {
      const topic = data.question.split(' ')[0].toLowerCase(); // Very simplified
      if (!topicTimes.has(topic)) {
        topicTimes.set(topic, []);
      }
      topicTimes.get(topic)!.push(data.responseTimeMs);
    });
    
    const fastTopics: string[] = [];
    
    topicTimes.forEach((times, topic) => {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      if (avgTime < 5000 && times.length > 1) { // Less than 5 seconds average
        fastTopics.push(topic);
      }
    });
    
    return fastTopics.join(', ') || 'None identified yet';
  };
  
  const getSlowResponseTopics = (): string => {
    if (responseTimes.length < 2) return 'Not enough data';
    
    const topicTimes = new Map<string, number[]>();
    
    responseTimes.forEach(data => {
      const topic = data.question.split(' ')[0].toLowerCase(); // Very simplified
      if (!topicTimes.has(topic)) {
        topicTimes.set(topic, []);
      }
      topicTimes.get(topic)!.push(data.responseTimeMs);
    });
    
    const slowTopics: string[] = [];
    
    topicTimes.forEach((times, topic) => {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      if (avgTime > 10000 && times.length > 1) { // More than 10 seconds average
        slowTopics.push(topic);
      }
    });
    
    return slowTopics.join(', ') || 'None identified yet';
  };

  const handleVoiceResponse = async () => {
    // Voice response handling logic
    if (textMessage.trim()) {
      await getAIResponse(textMessage);
    } else {
      toast({
        title: "Empty Message",
        description: "Please enter a message to get a voice response.",
        variant: "destructive"
      });
    }
  };

  const handleRecordStop = async () => {
    handleStopRecording();
    
    if (audioData) {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioData);
      reader.onloadend = function() {
        const base64data = (reader.result as string).split(',')[1];
        processVoiceToText(base64data);
      };
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendTextMessage();
    }
  };

  const isTokenLimitReached = totalTokensUsed >= monthlyLimit;

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
      <div className="w-64 flex-shrink-0 border-r border-white/10">
        <AppSidebar />
      </div>

      <div className="flex-1 flex flex-col max-h-screen overflow-hidden shadow-2xl">
        <ChatHeader
          isRecording={isRecording}
          recordingTime={recordingTime}
          onStartRecording={isTokenLimitReached ? () => {
            toast({
              title: "Token Limit Reached",
              description: "You've reached your monthly token limit. Please try again next month.",
              variant: "destructive"
            });
          } : handleStartRecording}
          onStopRecording={handleRecordStop}
        />

        <div className="flex-1 flex flex-col px-4 py-2 space-y-4 overflow-hidden bg-gray-900/50">
          {apiKeyError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>OpenAI API Key Error</AlertTitle>
              <AlertDescription>
                The OpenAI API key is not configured on the server. Please contact the administrator to set up the OpenAI API key in Supabase secrets.
              </AlertDescription>
            </Alert>
          )}

          {isTokenLimitReached && (
            <Alert variant="destructive" className="mb-4 bg-red-900/30 border-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Token Limit Reached</AlertTitle>
              <AlertDescription>
                You've reached your monthly token limit of {MONTHLY_TOKEN_LIMIT} tokens. Please try again next month or contact support for an upgraded plan.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-row items-center gap-4 mb-2">
            <TokenUsageDisplay
              totalTokensUsed={totalTokensUsed}
              monthlyLimit={MONTHLY_TOKEN_LIMIT}
              inputTokens={inputTokens}
              outputTokens={outputTokens}
            />
            <div className="flex items-center gap-2">
              <label htmlFor="voice-select" className="text-sm font-medium text-white/80">Voice:</label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={isTokenLimitReached}>
                <SelectTrigger id="voice-select" className="w-[140px] bg-white/5 border-white/20">
                  <SelectValue placeholder="Choose voice" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 z-50">
                  {OPENAI_VOICES.map(voice => (
                    <SelectItem key={voice.value} value={voice.value}>
                      {voice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <label htmlFor="quiz-mode" className="text-sm font-medium text-white/80">
                Quiz Mode:
              </label>
              <Select value={isQuizMode ? "on" : "off"} onValueChange={(value) => setIsQuizMode(value === "on")}>
                <SelectTrigger id="quiz-mode" className="w-[100px] bg-white/5 border-white/20">
                  <SelectValue placeholder="Quiz Mode" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 z-50">
                  <SelectItem value="on">On</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isQuizMode && responseTimes.length > 0 && (
            <Alert className="mb-4 bg-blue-900/30 border-blue-700">
              <div>
                <h3 className="font-medium">Learning Analysis:</h3>
                <div className="text-sm mt-1">
                  <div><span className="font-semibold">Strengths:</span> {userStrengths.length > 0 ? userStrengths.join(', ') : 'Not enough data yet'}</div>
                  <div><span className="font-semibold">Areas to improve:</span> {userWeaknesses.length > 0 ? userWeaknesses.join(', ') : 'Not enough data yet'}</div>
                  <div><span className="font-semibold">Quick responses:</span> {getFastResponseTopics()}</div>
                  <div><span className="font-semibold">Slower responses:</span> {getSlowResponseTopics()}</div>
                </div>
              </div>
            </Alert>
          )}

          <div className="flex-1 flex flex-col space-y-4">
            <ScrollArea className="flex-1 pr-4">
              <MessageList 
                messages={messages}
                onPlayAudio={(messageId) => handlePlayAudio(messageId, messages, setMessages)}
                onPauseAudio={(messageId) => handlePauseAudio(messageId, messages, setMessages)}
              />
              <div ref={messagesEndRef} />
            </ScrollArea>

            <div className="pt-4 border-t border-white/10">
              <VoiceMessageInput 
                onSendText={handleSendTextMessage}
                onVoiceResponse={handleVoiceResponse}
                onFileUpload={handleFileUpload}
                textMessage={textMessage}
                setTextMessage={setTextMessage}
                file={file}
                setFile={setFile}
                onKeyPress={handleKeyPress}
                disabled={isTokenLimitReached}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Voice;
