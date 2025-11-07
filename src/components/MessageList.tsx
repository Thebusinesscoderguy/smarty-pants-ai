
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, User, Bot, FileText, Image, Play, Pause, File, Download, Loader2, Copy } from 'lucide-react';
import { Message } from '@/types/message';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';

interface MessageListProps {
  messages: Message[];
  onPlayAudio?: (messageId: string) => void;
  onPauseAudio?: (messageId: string) => void;
  playingAudioId?: string;
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  onPlayAudio, 
  onPauseAudio, 
  playingAudioId 
}) => {
  const [speakingMessages, setSpeakingMessages] = useState<Set<string>>(new Set());
  const [loadingTTS, setLoadingTTS] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { selectedVoice } = useVoiceSettings();
  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const handleTextToSpeech = async (messageId: string, text: string) => {
    // If already speaking this message, stop it
    if (speakingMessages.has(messageId)) {
      window.speechSynthesis.cancel();
      setSpeakingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
      return;
    }

    setLoadingTTS(prev => new Set(prev).add(messageId));

    try {
      // Limit text length to prevent API issues
      const textToSpeak = text.length > 500 ? text.substring(0, 500) + "..." : text;
      console.log('Converting text to speech:', textToSpeak.substring(0, 50) + '...');
      
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: {
          text: textToSpeak,
          voice: selectedVoice,
        }
      });

      if (error) {
        console.error('Text-to-speech error:', error);
        
        // Provide more specific error messages
        let errorMessage = "Failed to convert text to speech. Please try again.";
        if (error.message?.includes('API key')) {
          errorMessage = "Speech service not configured. Please contact support.";
        } else if (error.message?.includes('rate limit')) {
          errorMessage = "Too many speech requests. Please wait a moment and try again.";
        } else if (error.message?.includes('timeout')) {
          errorMessage = "Speech service is slow. Please try again.";
        }
        
        toast({
          title: "Speech Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data && data.audioContent) {
        try {
          // Convert base64 to audio blob with better error handling
          const binaryString = atob(data.audioContent);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Create and configure audio element
          const audio = new Audio(audioUrl);
          audio.volume = 0.8; // Set reasonable volume
          
          setSpeakingMessages(prev => new Set(prev).add(messageId));
          
          audio.onended = () => {
            setSpeakingMessages(prev => {
              const newSet = new Set(prev);
              newSet.delete(messageId);
              return newSet;
            });
            URL.revokeObjectURL(audioUrl);
          };
          
          audio.onerror = (e) => {
            console.error('Audio playback error:', e);
            setSpeakingMessages(prev => {
              const newSet = new Set(prev);
              newSet.delete(messageId);
              return newSet;
            });
            URL.revokeObjectURL(audioUrl);
            toast({
              title: "Playback Error",
              description: "Failed to play the generated speech.",
              variant: "destructive",
            });
          };
          
          // Try to play with user interaction handling
          try {
            await audio.play();
          } catch (playError) {
            console.error('Audio play error:', playError);
            if (playError.name === 'NotAllowedError') {
              toast({
                title: "Audio Blocked",
                description: "Browser blocked audio playback. Please click the speaker icon to enable audio.",
                variant: "destructive",
              });
            } else {
              throw playError;
            }
          }
        } catch (audioError) {
          console.error('Audio processing error:', audioError);
          toast({
            title: "Audio Error",
            description: "Failed to process the generated audio.",
            variant: "destructive",
          });
        }
      } else {
        throw new Error('No audio content received from server');
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);
      
      let errorMessage = "Failed to convert text to speech. Please try again.";
      if (error.message?.includes('No audio content')) {
        errorMessage = "Speech service returned empty response. Please try again.";
      }
      
      toast({
        title: "Speech Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingTTS(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  };

  const handleCopyMessage = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Message text has been copied successfully.",
      });
    } catch (error) {
      console.error('Copy error:', error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy message to clipboard.",
        variant: "destructive",
      });
    }
  };

  const renderFileContent = (message: Message) => {
    if (!message.fileUrl) return null;

    const fileType = message.fileUrl.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType || '');
    const isPdf = fileType === 'pdf';

    return (
      <div className="mt-4 p-4 bg-muted rounded-2xl border border-border">
        <div className="flex items-center space-x-3 mb-3">
          {isImage ? (
            <Image className="h-5 w-5 text-primary" />
          ) : isPdf ? (
            <FileText className="h-5 w-5 text-destructive" />
          ) : (
            <File className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">
            {isImage ? 'Image' : isPdf ? 'PDF Document' : 'File'} attached
          </span>
        </div>
        
        {isImage && (
          <img 
            src={message.fileUrl} 
            alt="Uploaded content" 
            className="max-w-sm rounded-xl border border-border shadow-lg"
          />
        )}
        
        <div className="flex items-center space-x-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => window.open(message.fileUrl, '_blank')}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}>
          <div className={`flex items-start space-x-4 max-w-4xl ${message.isFromUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`p-3 rounded-2xl ${message.isFromUser ? 'bg-primary' : 'bg-muted'} border border-border flex-shrink-0`}>
              {message.isFromUser ? (
                <User className="h-6 w-6 text-primary-foreground" />
              ) : (
                <Bot className="h-6 w-6 text-primary" />
              )}
            </div>

            {/* Message Content */}
            <div className={`p-6 rounded-3xl ${
              message.isFromUser 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card text-foreground'
            } shadow-xl border border-border flex-1`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-lg">
                    {message.isFromUser ? 'You' : 'AI Tutor'}
                  </span>
                  {message.type === 'voice' && (
                    <Badge variant="outline">
                      Voice
                    </Badge>
                  )}
                </div>
              </div>

              <div className="text-lg leading-relaxed whitespace-pre-wrap">
                {message.text}
              </div>

              {renderFileContent(message)}

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-3">
                  {message.type === 'voice' && onPlayAudio && onPauseAudio && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (playingAudioId === message.id) {
                          onPauseAudio(message.id);
                        } else {
                          onPlayAudio(message.id);
                        }
                      }}
                      className="hover:bg-muted rounded-xl p-2"
                    >
                      {playingAudioId === message.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  
                  {!message.isFromUser && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyMessage(message.text)}
                        className="hover:bg-muted rounded-xl p-2 transition-all duration-200"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTextToSpeech(message.id || '', message.text)}
                        disabled={loadingTTS.has(message.id || '')}
                        className="hover:bg-muted rounded-xl p-2 transition-all duration-200"
                        title={speakingMessages.has(message.id || '') ? "Stop speech" : "Read aloud"}
                      >
                        {loadingTTS.has(message.id || '') ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : speakingMessages.has(message.id || '') ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-sm opacity-70">
                    {formatTime(message.timestamp)}
                  </span>
                  {message.tokenCount && (
                    <Badge variant="outline" className="text-xs">
                      {message.tokenCount} tokens
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
