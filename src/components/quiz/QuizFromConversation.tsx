
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';
import { QuizGenerator } from './QuizGenerator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface QuizFromConversationProps {
  messages: any[];
}

export const QuizFromConversation = ({ messages }: QuizFromConversationProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Filter and format messages for quiz generation
  const conversationHistory = messages
    .filter(msg => msg.role && msg.content)
    .slice(-10) // Last 10 messages for context
    .map(msg => ({
      role: msg.role,
      content: msg.content
    }));

  if (conversationHistory.length < 2) {
    return null; // Don't show if not enough conversation
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <FileQuestion className="h-4 w-4" />
          Generate Quiz from Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Quiz from Conversation</DialogTitle>
        </DialogHeader>
        <QuizGenerator 
          conversationHistory={conversationHistory} 
        />
      </DialogContent>
    </Dialog>
  );
};
