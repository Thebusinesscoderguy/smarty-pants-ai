
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Minus, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Question {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correct_answer: string;
  points: number;
}

interface TestData {
  title: string;
  description: string;
  subject: string;
  time_limit: number;
  is_mandatory: boolean;
  ai_graded: boolean;
  questions: Question[];
}

export const TestCreator = ({ onTestCreated }: { onTestCreated?: () => void }) => {
  const [testData, setTestData] = useState<TestData>({
    title: '',
    description: '',
    subject: '',
    time_limit: 30,
    is_mandatory: false,
    ai_graded: true,
    questions: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1
    };
    setTestData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === id ? { ...q, ...updates } : q
      )
    }));
  };

  const removeQuestion = (id: string) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  };

  const updateQuestionOption = (questionId: string, optionIndex: number, value: string) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId 
          ? { ...q, options: q.options?.map((opt, idx) => idx === optionIndex ? value : opt) }
          : q
      )
    }));
  };

  const saveTest = async () => {
    if (!user || !testData.title || testData.questions.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and add at least one question",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Save test to database
      const { data: test, error: testError } = await supabase
        .from('tests')
        .insert({
          title: testData.title,
          description: testData.description,
          subject: testData.subject,
          creator_id: user.id,
          time_limit_minutes: testData.time_limit,
          is_mandatory: testData.is_mandatory,
          ai_graded: testData.ai_graded,
          total_points: testData.questions.reduce((sum, q) => sum + q.points, 0)
        })
        .select()
        .single();

      if (testError) throw testError;

      // Save questions
      const questionsToInsert = testData.questions.map((q, index) => ({
        test_id: test.id,
        question: q.question,
        question_type: q.type,
        options: q.options ? JSON.stringify(q.options) : null,
        correct_answer: q.correct_answer,
        points: q.points,
        order_index: index
      }));

      const { error: questionsError } = await supabase
        .from('test_questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast({
        title: "Success",
        description: "Test created successfully!",
      });

      // Reset form
      setTestData({
        title: '',
        description: '',
        subject: '',
        time_limit: 30,
        is_mandatory: false,
        ai_graded: true,
        questions: []
      });

      onTestCreated?.();
    } catch (error: any) {
      console.error('Error creating test:', error);
      toast({
        title: "Error",
        description: "Failed to create test: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Create New Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Test Title *</Label>
              <Input
                value={testData.title}
                onChange={(e) => setTestData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter test title"
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
              />
            </div>
            <div>
              <Label className="text-white">Subject</Label>
              <Select value={testData.subject} onValueChange={(value) => setTestData(prev => ({ ...prev, subject: value }))}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                  <SelectItem value="geography">Geography</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-white">Description</Label>
            <Textarea
              value={testData.description}
              onChange={(e) => setTestData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Test description (optional)"
              className="bg-white/10 border-white/20 text-white placeholder-gray-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-white">Time Limit (minutes)</Label>
              <Input
                type="number"
                value={testData.time_limit}
                onChange={(e) => setTestData(prev => ({ ...prev, time_limit: parseInt(e.target.value) || 30 }))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={testData.is_mandatory}
                onCheckedChange={(checked) => setTestData(prev => ({ ...prev, is_mandatory: checked }))}
              />
              <Label className="text-white">Mandatory</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={testData.ai_graded}
                onCheckedChange={(checked) => setTestData(prev => ({ ...prev, ai_graded: checked }))}
              />
              <Label className="text-white">AI Graded</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">Questions ({testData.questions.length})</h3>
          <Button onClick={addQuestion} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>

        {testData.questions.map((question, index) => (
          <Card key={question.id} className="bg-white/5 border-white/10">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white text-lg">Question {index + 1}</CardTitle>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeQuestion(question.id)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Question Text *</Label>
                <Textarea
                  value={question.question}
                  onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                  placeholder="Enter your question"
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Question Type</Label>
                  <Select 
                    value={question.type} 
                    onValueChange={(value: 'multiple_choice' | 'true_false' | 'short_answer') => 
                      updateQuestion(question.id, { type: value })
                    }
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="true_false">True/False</SelectItem>
                      <SelectItem value="short_answer">Short Answer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white">Points</Label>
                  <Input
                    type="number"
                    value={question.points}
                    onChange={(e) => updateQuestion(question.id, { points: parseInt(e.target.value) || 1 })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>

              {question.type === 'multiple_choice' && (
                <div>
                  <Label className="text-white">Answer Options</Label>
                  <div className="space-y-2">
                    {question.options?.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-2">
                        <Input
                          value={option}
                          onChange={(e) => updateQuestionOption(question.id, optionIndex, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                        />
                        <Button
                          variant={question.correct_answer === option ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateQuestion(question.id, { correct_answer: option })}
                          className={question.correct_answer === option ? "bg-green-600" : ""}
                        >
                          Correct
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {question.type === 'true_false' && (
                <div>
                  <Label className="text-white">Correct Answer</Label>
                  <Select 
                    value={question.correct_answer} 
                    onValueChange={(value) => updateQuestion(question.id, { correct_answer: value })}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {question.type === 'short_answer' && (
                <div>
                  <Label className="text-white">Expected Answer (for AI grading)</Label>
                  <Input
                    value={question.correct_answer}
                    onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })}
                    placeholder="Expected answer or keywords"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={saveTest} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Test'}
        </Button>
      </div>
    </div>
  );
};
