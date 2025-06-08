import { useState, useEffect, useRef } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, FileUp, X, MessageSquare, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { QuizFromConversation } from '@/components/quiz/QuizFromConversation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  conversation_id?: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  message_count: number;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

const Features = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showUploadSection, setShowUploadSection] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      // Load default welcome message for non-authenticated users
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I\'m your AI learning assistant. Sign in to save your conversations and get personalized help.',
        timestamp: new Date(),
      }]);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          conversation_id,
          created_at
        `)
        .eq('user_id', user.id)
        .not('conversation_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation and get conversation info
      const conversationMap = new Map();
      data?.forEach(msg => {
        if (msg.conversation_id && !conversationMap.has(msg.conversation_id)) {
          conversationMap.set(msg.conversation_id, {
            id: msg.conversation_id,
            title: `Chat ${msg.conversation_id.slice(0, 8)}`,
            updated_at: msg.created_at,
            message_count: 1
          });
        } else if (msg.conversation_id) {
          const conv = conversationMap.get(msg.conversation_id);
          conv.message_count += 1;
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages = data.map(msg => ({
        id: msg.id,
        role: msg.is_from_user ? 'user' : 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        conversation_id: msg.conversation_id
      })) as Message[];

      setMessages(formattedMessages);
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive"
      });
    }
  };

  const startNewConversation = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! How can I help you learn today?',
      timestamp: new Date(),
    }]);
    setCurrentConversationId(null);
  };

  const saveMessage = async (message: Message, conversationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          content: message.content,
          is_from_user: message.role === 'user',
          conversation_id: conversationId,
          type: 'text'
        });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() && uploadedFiles.length === 0) return;

    const fileInfo = uploadedFiles.length > 0 
      ? `\n\nUploaded: ${uploadedFiles.map(f => f.name).join(', ')}`
      : '';

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input + fileInfo,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setUploadedFiles([]);
    setShowUploadSection(false);

    // Create conversation ID if this is a new conversation
    let conversationId = currentConversationId;
    if (!conversationId) {
      conversationId = `conv-${Date.now()}`;
      setCurrentConversationId(conversationId);
    }

    // Save user message if authenticated
    if (user) {
      await saveMessage(userMessage, conversationId);
    }

    try {
      // Get AI response
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            {
              role: "system",
              content: "You are a helpful AI learning assistant. Provide clear, educational responses to help students learn."
            },
            ...messages.slice(-5).map(m => ({
              role: m.role,
              content: m.content
            })),
            { role: "user", content: userMessage.content }
          ]
        }
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.text,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI message if authenticated
      if (user) {
        await saveMessage(aiMessage, conversationId);
        await loadConversations(); // Refresh conversations list
      }

    } catch (error: any) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
      
      setUploadedFiles(prev => [...prev, ...newFiles]);
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

  return (
    <div className="flex min-h-screen bg-black text-white">
      <AppSidebar />
      
      <div className="flex-1 flex max-h-screen">
        {/* Conversations Sidebar */}
        {user && (
          <div className="w-80 bg-gray-900/30 border-r border-white/20 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Previous Chats</h2>
              <Button
                size="sm"
                onClick={startNewConversation}
                className="bg-white/10 hover:bg-white/20"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {conversations.map((conv) => (
                <Card 
                  key={conv.id} 
                  className={`bg-white/10 border-white/20 cursor-pointer hover:bg-white/15 transition-colors p-3 ${
                    currentConversationId === conv.id ? 'bg-white/20' : ''
                  }`}
                  onClick={() => loadConversation(conv.id)}
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white text-sm truncate">{conv.title}</h3>
                      <p className="text-xs text-gray-400">{conv.message_count} messages</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
              
              {conversations.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-8">
                  No previous conversations yet. Start chatting to see them here!
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <header className="p-4 border-b border-white/20 flex justify-between items-center">
            <h1 className="text-xl font-bold">
              {currentConversationId ? 'Conversation' : 'Chat with AI Learning Assistant'}
            </h1>
            <div className="flex items-center gap-2">
              {messages.length > 2 && (
                <QuizFromConversation messages={messages} />
              )}
              {!user && (
                <p className="text-sm text-gray-400">Sign in to save conversations</p>
              )}
            </div>
          </header>
          
          <main className="flex-1 overflow-hidden flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div 
                  key={message.id || index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <Card 
                    className={`max-w-[80%] p-3 ${
                      message.role === 'user' 
                        ? 'bg-blue-600/20 text-white border-blue-600/30' 
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
              
              {isLoading && (
                <div className="flex justify-start">
                  <Card className="bg-white/5 text-white border-white/20 p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </Card>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* File Upload Section */}
            {showUploadSection && (
              <div className="p-4 border-t border-white/10 bg-white/5">
                <div className="mb-2 flex justify-between items-center">
                  <h3 className="font-medium">Upload Files</h3>
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
            
            {/* Input Area */}
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
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent border-white/30 focus-visible:ring-white"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="bg-white text-black hover:bg-gray-200 flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Features;
