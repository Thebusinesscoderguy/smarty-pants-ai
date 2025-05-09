import { useState, useRef, useEffect } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatArea from '@/components/chat/ChatArea';
import { Plus, MicOff, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useAudioHandler } from '@/hooks/useAudioHandler';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export interface Chat {
  id: string;
  title: string;
  topic: string;
  lastMessage: string;
  updatedAt: Date;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  content: string;
  isFromUser: boolean;
  timestamp: Date;
  audioUrl?: string;
  isPlaying?: boolean;
}

const OPENAI_VOICES = [
  { label: 'Alloy (Default)', value: 'alloy' },
  { label: 'Echo', value: 'echo' },
  { label: 'Fable', value: 'fable' },
  { label: 'Onyx', value: 'onyx' },
  { label: 'Nova', value: 'nova' },
  { label: 'Shimmer', value: 'shimmer' },
];

const Chat = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([
    {
      id: '1',
      title: 'Voice assistants',
      topic: 'AI Technology',
      lastMessage: 'How do voice assistants work?',
      updatedAt: new Date(2025, 4, 5),
      messages: [
        {
          id: '1-1',
          content: 'I\'m curious about voice assistants.',
          isFromUser: true,
          timestamp: new Date(2025, 4, 5, 10, 0)
        },
        {
          id: '1-2',
          content: 'What would you like to know about voice assistants?',
          isFromUser: false,
          timestamp: new Date(2025, 4, 5, 10, 1)
        },
        {
          id: '1-3',
          content: 'How do voice assistants work?',
          isFromUser: true,
          timestamp: new Date(2025, 4, 5, 10, 2)
        }
      ]
    },
    {
      id: '2',
      title: 'Learning Spanish',
      topic: 'Language Learning',
      lastMessage: 'Can you help me practice Spanish?',
      updatedAt: new Date(2025, 4, 4),
      messages: [
        {
          id: '2-1',
          content: 'I want to learn Spanish',
          isFromUser: true,
          timestamp: new Date(2025, 4, 4, 15, 0)
        },
        {
          id: '2-2',
          content: 'Can you help me practice Spanish?',
          isFromUser: true,
          timestamp: new Date(2025, 4, 4, 15, 1)
        }
      ]
    },
    {
      id: '3',
      title: 'React development',
      topic: 'Programming',
      lastMessage: 'How do I use React hooks?',
      updatedAt: new Date(2025, 4, 3),
      messages: [
        {
          id: '3-1',
          content: 'I\'m learning React and I\'m confused about hooks.',
          isFromUser: true,
          timestamp: new Date(2025, 4, 3, 9, 0)
        },
        {
          id: '3-2',
          content: 'How do I use React hooks?',
          isFromUser: true,
          timestamp: new Date(2025, 4, 3, 9, 1)
        }
      ]
    }
  ]);
  
  const [activeChat, setActiveChat] = useState<Chat | null>(chats[0] || null);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);

  // Voice recording functionality
  const {
    isRecording,
    recordingTime,
    audioData,
    setAudioData,
    handleStartRecording,
    handleStopRecording
  } = useVoiceRecorder();

  // Rename the imported audio handler functions to avoid name conflicts
  const {
    handlePlayAudio: audioHandlerPlay,
    handlePauseAudio: audioHandlerPause,
    activeSpeakingMessage
  } = useAudioHandler();

  useEffect(() => {
    if (user) {
      checkOpenAIKey();
    }
    scrollToBottom();
  }, [user, activeChat?.messages]);

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

  const handleSelectChat = (chatId: string) => {
    const selected = chats.find(chat => chat.id === chatId);
    if (selected) {
      setActiveChat(selected);
    }
  };

  const handleNewChat = () => {
    const newChat: Chat = {
      id: `new-${Date.now()}`,
      title: 'New Conversation',
      topic: 'General',
      lastMessage: '',
      updatedAt: new Date(),
      messages: []
    };
    
    setChats(prev => [newChat, ...prev]);
    setActiveChat(newChat);
    setInputMessage('');
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !activeChat) return;
    
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      content: inputMessage,
      isFromUser: true,
      timestamp: new Date()
    };
    
    // Update chat with new message
    const updatedChat = {
      ...activeChat,
      lastMessage: inputMessage,
      updatedAt: new Date(),
      messages: [...activeChat.messages, newMessage]
    };
    
    setChats(prev => prev.map(chat => 
      chat.id === activeChat.id ? updatedChat : chat
    ));
    
    setActiveChat(updatedChat);
    setInputMessage('');

    // Get AI response (with voice if enabled)
    if (voiceEnabled) {
      getAIResponse(inputMessage, updatedChat);
    } else {
      // Text-only response
      getTextResponse(inputMessage, updatedChat);
    }
  };

  const getTextResponse = async (userMessage: string, currentChat: Chat) => {
    try {
      const aiResponse: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        content: `I've processed your message: "${userMessage}". How can I help you further?`,
        isFromUser: false,
        timestamp: new Date()
      };
      
      const updatedWithAiChat = {
        ...currentChat,
        messages: [...currentChat.messages, aiResponse]
      };
      
      setChats(prev => prev.map(chat => 
        chat.id === currentChat.id ? updatedWithAiChat : chat
      ));
      
      setActiveChat(updatedWithAiChat);
      
      // Update token usage simulation
      setTotalTokensUsed(prev => prev + Math.ceil(userMessage.length / 4) + 10);
      
    } catch (error: any) {
      console.error("Error in getTextResponse:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response: " + error.message,
        variant: "destructive"
      });
    }
  };

  const getAIResponse = async (userMessage: string, currentChat: Chat) => {
    try {
      // First add a processing message
      const processingMessageId = `processing-${Date.now()}`;
      const processingMessage: ChatMessage = {
        id: processingMessageId,
        content: "Generating voice response...",
        isFromUser: false,
        timestamp: new Date(),
      };

      const chatWithProcessing = {
        ...currentChat,
        messages: [...currentChat.messages, processingMessage]
      };
      
      setChats(prev => prev.map(chat => 
        chat.id === currentChat.id ? chatWithProcessing : chat
      ));
      
      setActiveChat(chatWithProcessing);

      try {
        // Generate voice response
        const response = await supabase.functions.invoke('text-to-voice', {
          body: { 
            text: `I've processed your message: "${userMessage}". How can I help you further?`,
            voice: selectedVoice || 'alloy'
          }
        });

        if (response.error) {
          if (response.error.message && response.error.message.includes('API key')) {
            setApiKeyError(true);
          }
          throw new Error(response.error.message || 'Failed to generate speech');
        }

        const base64Audio = response.data.audioContent;

        const byteCharacters = atob(base64Audio);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const audioBlob = new Blob([byteArray], { type: 'audio/mp3' });

        const audioUrl = URL.createObjectURL(audioBlob);

        // Remove processing message and add the real response
        const aiMessageId = `ai-${Date.now()}`;
        const aiMessage: ChatMessage = {
          id: aiMessageId,
          content: `I've processed your message: "${userMessage}". How can I help you further?`,
          timestamp: new Date(),
          audioUrl: audioUrl,
          isFromUser: false
        };

        const updatedWithAiChat = {
          ...currentChat,
          messages: [...currentChat.messages.filter(m => m.id !== processingMessageId), aiMessage]
        };
        
        setChats(prev => prev.map(chat => 
          chat.id === currentChat.id ? updatedWithAiChat : chat
        ));
        
        setActiveChat(updatedWithAiChat);
        
        // Update token usage simulation
        setTotalTokensUsed(prev => prev + Math.ceil(userMessage.length / 4) + 10);

        // Auto-play the audio response
        setTimeout(() => {
          if (aiMessageId) {
            handlePlayAudio(aiMessageId);
          }
        }, 500);

      } catch (error: any) {
        // Remove processing message on error
        const updatedChat = {
          ...currentChat,
          messages: currentChat.messages.filter(m => m.id !== processingMessageId)
        };
        
        setChats(prev => prev.map(chat => 
          chat.id === currentChat.id ? updatedChat : chat
        ));
        
        setActiveChat(updatedChat);
        
        console.error("Error in getAIResponse:", error);
        toast({
          title: "Error",
          description: "Failed to get voice response: " + error.message,
          variant: "destructive"
        });
        
        // Fall back to text response
        getTextResponse(userMessage, currentChat);
      }
    } catch (error: any) {
      console.error("Error in getAIResponse:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response: " + error.message,
        variant: "destructive"
      });
      
      // Fall back to text response
      getTextResponse(userMessage, currentChat);
    }
  };

  const handleRecordStop = async () => {
    handleStopRecording();
    
    if (!activeChat || !audioData) return;
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioData);
      
      reader.onloadend = async function() {
        // Add a temporary message to show processing
        const processingMessageId = `processing-${Date.now()}`;
        const processingMessage: ChatMessage = {
          id: processingMessageId,
          content: "Processing your voice message...",
          isFromUser: false,
          timestamp: new Date()
        };
        
        const chatWithProcessing = {
          ...activeChat,
          messages: [...activeChat.messages, processingMessage]
        };
        
        setChats(prev => prev.map(chat => 
          chat.id === activeChat.id ? chatWithProcessing : chat
        ));
        
        setActiveChat(chatWithProcessing);
        
        try {
          const base64data = (reader.result as string).split(',')[1];
          
          // Use supabase.functions.invoke instead of direct fetch
          const response = await supabase.functions.invoke('voice-to-text', {
            body: { audio: base64data }
          });
          
          if (response.error) {
            if (response.error.message && response.error.message.includes('API key')) {
              setApiKeyError(true);
            }
            throw new Error(response.error.message || 'Failed to process voice');
          }
          
          const transcribedText = response.data.text;
          
          // Create a user message with the transcribed text
          const userMessage: ChatMessage = {
            id: `voice-${Date.now()}`,
            content: transcribedText,
            timestamp: new Date(),
            isFromUser: true
          };
          
          if (audioData) {
            // Convert audioData to a URL
            const audioUrl = URL.createObjectURL(audioData);
            userMessage.audioUrl = audioUrl;
          }
          
          // Remove processing message
          const updatedChat = {
            ...activeChat,
            lastMessage: transcribedText,
            messages: [...activeChat.messages.filter(m => m.id !== processingMessageId), userMessage]
          };
          
          setChats(prev => prev.map(chat => 
            chat.id === activeChat.id ? updatedChat : chat
          ));
          
          setActiveChat(updatedChat);
          
          // Get AI response
          if (voiceEnabled) {
            getAIResponse(transcribedText, updatedChat);
          } else {
            getTextResponse(transcribedText, updatedChat);
          }
          
        } catch (error: any) {
          // Remove the processing message
          const updatedChat = {
            ...activeChat,
            messages: activeChat.messages.filter(m => m.id !== processingMessageId)
          };
          
          setChats(prev => prev.map(chat => 
            chat.id === activeChat.id ? updatedChat : chat
          ));
          
          setActiveChat(updatedChat);
          
          console.error("Error in processVoiceToText:", error);
          toast({
            title: "Error",
            description: "Failed to process voice: " + error.message,
            variant: "destructive"
          });
        }
      };
    } catch (error: any) {
      console.error("Error in handleRecordStop:", error);
      toast({
        title: "Error",
        description: "Failed to process voice: " + error.message,
        variant: "destructive"
      });
    }
  };

  // Define local handlePlayAudio function that uses the imported function
  const handlePlayAudio = (messageId: string) => {
    if (!activeChat) return;
    
    const message = activeChat.messages.find(m => m.id === messageId);
    if (!message || !message.audioUrl) return;
    
    const audio = new Audio(message.audioUrl);
    
    // Stop any currently playing audio
    const updatedMessages = activeChat.messages.map(m => 
      m.isPlaying ? { ...m, isPlaying: false } : m
    );
    
    // Set the current message to playing
    const updatedMessagesWithPlaying = updatedMessages.map(m => 
      m.id === messageId ? { ...m, isPlaying: true } : m
    );
    
    const updatedChat = {
      ...activeChat,
      messages: updatedMessagesWithPlaying
    };
    
    setChats(prev => prev.map(chat => 
      chat.id === activeChat.id ? updatedChat : chat
    ));
    
    setActiveChat(updatedChat);
    
    audio.play();
    
    audio.onended = () => {
      const updatedMessagesAfterEnd = updatedChat.messages.map(m => 
        m.id === messageId ? { ...m, isPlaying: false } : m
      );
      
      const updatedChatAfterEnd = {
        ...updatedChat,
        messages: updatedMessagesAfterEnd
      };
      
      setChats(prev => prev.map(chat => 
        chat.id === activeChat.id ? updatedChatAfterEnd : chat
      ));
      
      setActiveChat(updatedChatAfterEnd);
    };
  };

  // Define local handlePauseAudio function that uses the imported function
  const handlePauseAudio = (messageId: string) => {
    if (!activeChat) return;
    
    const message = activeChat.messages.find(m => m.id === messageId);
    if (!message || !message.audioUrl || !message.isPlaying) return;
    
    // Find audio element and pause it
    const audioElements = document.getElementsByTagName('audio');
    for (let i = 0; i < audioElements.length; i++) {
      audioElements[i].pause();
    }
    
    // Update message state
    const updatedMessages = activeChat.messages.map(m => 
      m.id === messageId ? { ...m, isPlaying: false } : m
    );
    
    const updatedChat = {
      ...activeChat,
      messages: updatedMessages
    };
    
    setChats(prev => prev.map(chat => 
      chat.id === activeChat.id ? updatedChat : chat
    ));
    
    setActiveChat(updatedChat);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
      <div className="w-64 flex-shrink-0 border-r border-white/10">
        <AppSidebar />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar 
          chats={chats}
          activeChat={activeChat}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
        />
        
        {apiKeyError && (
          <Alert variant="destructive" className="absolute top-4 right-4 w-96 z-50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>OpenAI API Key Error</AlertTitle>
            <AlertDescription>
              The OpenAI API key is not configured on the server. Please contact the administrator.
            </AlertDescription>
          </Alert>
        )}
        
        {activeChat ? (
          <div className="flex-1 flex flex-col h-full">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{activeChat.title}</h2>
                <div className="text-sm text-white/70">{activeChat.topic}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center mr-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-white/30 mr-2"
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                  >
                    {voiceEnabled ? (
                      <>Voice: On</>
                    ) : (
                      <>Voice: Off</>
                    )}
                  </Button>
                  
                  {voiceEnabled && (
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger className="w-[140px] bg-white/5 border-white/20">
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
                  )}
                </div>
                
                {/* Voice Recording Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-full w-10 h-10 ${isRecording ? 'bg-red-500/30 text-red-300' : 'bg-white/10'}`}
                  onClick={isRecording ? handleRecordStop : handleStartRecording}
                >
                  {isRecording ? (
                    <div className="relative">
                      <MicOff className="h-5 w-5" />
                      <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-3 h-3 animate-pulse"></span>
                    </div>
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
            
            <ChatArea 
              chat={activeChat}
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              onSendMessage={handleSendMessage}
              onPlayAudio={handlePlayAudio}
              onPauseAudio={handlePauseAudio}
              messagesEndRef={messagesEndRef}
              onKeyDown={handleKeyDown}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Start a new chat</h2>
              <Button onClick={handleNewChat} className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                New Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
