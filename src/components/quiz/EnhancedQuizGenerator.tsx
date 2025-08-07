import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileUploadZone } from './FileUploadZone';
import { Loader2, Plus, Save, Trash2, FileQuestion, Brain, Upload } from 'lucide-react';
import { useQuizGenerator, type Quiz } from '@/hooks/useQuizGenerator';

interface EnhancedQuizGeneratorProps {
  conversationHistory?: any[];
}

export const EnhancedQuizGenerator = ({ conversationHistory }: EnhancedQuizGeneratorProps) => {
  const [inputMethod, setInputMethod] = useState<'manual' | 'file' | 'ai'>('manual');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [customInstructions, setCustomInstructions] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
  
  const { isGenerating, generateQuiz, saveQuiz } = useQuizGenerator();

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
  };

  const handleGenerateQuiz = async () => {
    let quizData: any = {
      topic,
      difficulty,
      questionCount,
      conversationHistory
    };

    // Add specific data based on input method
    switch (inputMethod) {
      case 'file':
        if (!uploadedFile) return;
        quizData.sourceFile = uploadedFile.name; // In real implementation, would process file
        break;
      case 'ai':
        if (!customInstructions.trim()) return;
        quizData.customInstructions = customInstructions;
        break;
      case 'manual':
        if (!topic.trim()) return;
        break;
    }

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
      setCustomInstructions('');
      setUploadedFile(null);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'hard': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const canGenerate = () => {
    switch (inputMethod) {
      case 'manual':
        return topic.trim().length > 0;
      case 'file':
        return uploadedFile !== null;
      case 'ai':
        return customInstructions.trim().length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5" />
            Enhanced Quiz Generator
          </CardTitle>
          <CardDescription>
            Create quizzes from topics, uploaded materials, or custom AI instructions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as 'manual' | 'file' | 'ai')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="manual">Topic Based</TabsTrigger>
              <TabsTrigger value="file">Upload Material</TabsTrigger>
              <TabsTrigger value="ai">AI Instructions</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
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
            </TabsContent>

            <TabsContent value="file" className="space-y-4">
              <div className="space-y-2">
                <Label>Upload Study Material or Quiz Questions</Label>
                <FileUploadZone
                  onFileUpload={handleFileUpload}
                  onFileRemove={handleFileRemove}
                  uploadedFile={uploadedFile}
                  acceptedFileTypes={['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png']}
                  disabled={isGenerating}
                />
              </div>
              {uploadedFile && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fileTopic">Topic (Optional)</Label>
                    <Input
                      id="fileTopic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Override detected topic..."
                      disabled={isGenerating}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fileDifficulty">Difficulty Level</Label>
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
              )}
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instructions">Custom AI Instructions</Label>
                <Textarea
                  id="instructions"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Describe exactly what kind of quiz you want. For example: 'Create a quiz about the American Civil War focusing on battles and key figures, with scenario-based questions that test critical thinking rather than memorization.'"
                  rows={4}
                  disabled={isGenerating}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aiTopic">Topic (Optional)</Label>
                  <Input
                    id="aiTopic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Main subject area..."
                    disabled={isGenerating}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="aiDifficulty">Difficulty Level</Label>
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
            </TabsContent>
          </Tabs>

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
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-600">
                💡 This quiz will incorporate context from your recent conversation
              </p>
            </div>
          )}

          <Button 
            onClick={handleGenerateQuiz} 
            disabled={!canGenerate() || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
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
                <div key={index} className="p-4 border rounded-lg bg-card">
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
                              ? 'bg-green-500/10 text-green-600 border border-green-500/20 font-medium' 
                              : 'bg-muted/50'
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}. {option}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {!question.options && (
                    <div className="p-2 bg-green-500/10 text-green-600 border border-green-500/20 rounded text-sm font-medium mb-3">
                      Answer: {question.correct_answer}
                    </div>
                  )}
                  
                  {question.explanation && (
                    <div className="text-sm text-muted-foreground bg-blue-500/10 border border-blue-500/20 p-2 rounded">
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