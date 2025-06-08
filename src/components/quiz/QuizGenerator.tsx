
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Save, Trash2, FileQuestion } from 'lucide-react';
import { useQuizGenerator, type Quiz } from '@/hooks/useQuizGenerator';

interface QuizGeneratorProps {
  conversationHistory?: any[];
}

export const QuizGenerator = ({ conversationHistory }: QuizGeneratorProps) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
  
  const { isGenerating, generateQuiz, saveQuiz } = useQuizGenerator();

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) return;

    const quiz = await generateQuiz(topic, difficulty, questionCount, conversationHistory);
    if (quiz) {
      setGeneratedQuiz(quiz);
    }
  };

  const handleSaveQuiz = async () => {
    if (!generatedQuiz) return;
    
    const quizId = await saveQuiz(generatedQuiz);
    if (quizId) {
      setGeneratedQuiz(null);
      setTopic('');
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5" />
            Generate Quiz
          </CardTitle>
          <CardDescription>
            Create a quiz based on any topic or your recent conversations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Quiz Topic</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Photosynthesis, World War II, Algebra..."
                disabled={isGenerating}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="questionCount">Number of Questions</Label>
            <Select value={questionCount.toString()} onValueChange={(value) => setQuestionCount(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {conversationHistory && conversationHistory.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 This quiz will be based on your recent conversation about this topic
              </p>
            </div>
          )}

          <Button 
            onClick={handleGenerateQuiz} 
            disabled={!topic.trim() || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Generate Quiz
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedQuiz && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{generatedQuiz.title}</CardTitle>
                <CardDescription>{generatedQuiz.description}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getDifficultyColor(generatedQuiz.difficulty)}>
                  {generatedQuiz.difficulty}
                </Badge>
                <Badge variant="outline">
                  {generatedQuiz.questions.length} questions
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {generatedQuiz.questions.map((question, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">Question {index + 1}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {question.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="mb-3">{question.question}</p>
                  
                  {question.options && (
                    <div className="space-y-1 mb-3">
                      {question.options.map((option, optIndex) => (
                        <div 
                          key={optIndex}
                          className={`p-2 rounded text-sm ${
                            option === question.correct_answer 
                              ? 'bg-green-100 text-green-800 font-medium' 
                              : 'bg-gray-50'
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}. {option}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {!question.options && (
                    <div className="p-2 bg-green-100 text-green-800 rounded text-sm font-medium mb-3">
                      Answer: {question.correct_answer}
                    </div>
                  )}
                  
                  {question.explanation && (
                    <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                      <strong>Explanation:</strong> {question.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveQuiz} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                Save Quiz
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setGeneratedQuiz(null)}
                className="flex-1"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Discard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
