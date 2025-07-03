
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, User, Bot, FileText, Image, Play, Pause, File, Download } from 'lucide-react';
import { Message } from '@/types/message';

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
  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const renderFileContent = (message: Message) => {
    if (!message.fileUrl) return null;

    const fileType = message.fileUrl.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType || '');
    const isPdf = fileType === 'pdf';

    return (
      <div className="mt-4 p-4 bg-white/10 rounded-2xl border border-white/20">
        <div className="flex items-center space-x-3 mb-3">
          {isImage ? (
            <Image className="h-5 w-5 text-blue-400" />
          ) : isPdf ? (
            <FileText className="h-5 w-5 text-red-400" />
          ) : (
            <File className="h-5 w-5 text-gray-400" />
          )}
          <span className="text-white/80 text-sm font-medium">
            {isImage ? 'Image' : isPdf ? 'PDF Document' : 'File'} attached
          </span>
        </div>
        
        {isImage && (
          <img 
            src={message.fileUrl} 
            alt="Uploaded content" 
            className="max-w-sm rounded-xl border border-white/20 shadow-lg"
          />
        )}
        
        <div className="flex items-center space-x-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 bg-white/10 hover:bg-white/20 text-white rounded-xl"
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
            <div className={`p-3 rounded-2xl ${message.isFromUser ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-white/10'} border border-white/20 flex-shrink-0`}>
              {message.isFromUser ? (
                <User className="h-6 w-6 text-white" />
              ) : (
                <Bot className="h-6 w-6 text-purple-400" />
              )}
            </div>

            {/* Message Content */}
            <div className={`p-6 rounded-3xl ${
              message.isFromUser 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                : 'bg-white/10 text-white'
            } shadow-xl border border-white/20 flex-1`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-lg">
                    {message.isFromUser ? 'You' : 'AI Tutor'}
                  </span>
                  {message.type === 'voice' && (
                    <Badge variant="outline" className="border-white/30 text-white/80 bg-white/10">
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
                      className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl p-2"
                    >
                      {playingAudioId === message.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  
                  {!message.isFromUser && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl p-2"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-sm opacity-70">
                    {formatTime(message.timestamp)}
                  </span>
                  {message.tokenCount && (
                    <Badge variant="outline" className="border-white/20 text-white/60 bg-white/5 text-xs">
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
