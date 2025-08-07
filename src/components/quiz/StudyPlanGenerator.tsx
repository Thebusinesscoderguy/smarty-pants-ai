import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileUploadZone } from './FileUploadZone';
import { Loader2, BookOpen, Target, Calendar, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStudyPlanGenerator } from '@/hooks/useStudyPlanGenerator';

interface StudyPlan {
  id: string;
  title: string;
  description: string;
  weakAreas: string[];
  dailyLessons: DailyLesson[];
  estimatedDuration: number; // days
  difficultyLevel: 'easy' | 'medium' | 'hard';
}

interface DailyLesson {
  day: number;
  topic: string;
  description: string;
  activities: string[];
  estimatedTime: number; // minutes
  practiceQuestions: number;
}

export const StudyPlanGenerator = () => {
  const [inputMethod, setInputMethod] = useState<'file' | 'chat' | 'topic'>('file');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState<StudyPlan | null>(null);
  
  const { isGenerating, generateStudyPlan } = useStudyPlanGenerator();

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
  };

  const handleGeneratePlan = async () => {
    let inputData = '';
    let inputType = inputMethod;

    switch (inputMethod) {
      case 'file':
        if (!uploadedFile) return;
        inputData = uploadedFile.name; // In real implementation, would process file content
        break;
      case 'chat':
        if (!chatInput.trim()) return;
        inputData = chatInput;
        break;
      case 'topic':
        if (!selectedTopic.trim()) return;
        inputData = selectedTopic;
        break;
    }

    const plan = await generateStudyPlan(inputData, inputType);
    if (plan) {
      setGeneratedPlan(plan);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'hard': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const popularTopics = [
    'Algebra', 'Geometry', 'Calculus', 'Physics', 'Chemistry', 'Biology',
    'World History', 'Literature', 'Grammar', 'Spanish', 'French', 'Computer Science'
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Study Plan Generator
          </CardTitle>
          <CardDescription>
            Upload your quiz results or describe your weak areas to get a personalized study plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as 'file' | 'chat' | 'topic')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="file">Upload Quiz</TabsTrigger>
              <TabsTrigger value="chat">Describe Issues</TabsTrigger>
              <TabsTrigger value="topic">Select Topic</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              <div className="space-y-2">
                <Label>Upload Quiz Results or Graded Test</Label>
                <FileUploadZone
                  onFileUpload={handleFileUpload}
                  onFileRemove={handleFileRemove}
                  uploadedFile={uploadedFile}
                  acceptedFileTypes={['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png']}
                  disabled={isGenerating}
                />
              </div>
            </TabsContent>

            <TabsContent value="chat" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chatInput">Describe what you struggled with</Label>
                <Textarea
                  id="chatInput"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Describe the topics you found difficult, specific questions you got wrong, or areas where you need more practice..."
                  rows={4}
                  disabled={isGenerating}
                />
              </div>
            </TabsContent>

            <TabsContent value="topic" className="space-y-4">
              <div className="space-y-2">
                <Label>Select Subject Area</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {popularTopics.map((topic) => (
                    <Button
                      key={topic}
                      variant={selectedTopic === topic ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTopic(selectedTopic === topic ? '' : topic)}
                      disabled={isGenerating}
                    >
                      {topic}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Button 
            onClick={handleGeneratePlan}
            disabled={
              isGenerating || 
              (inputMethod === 'file' && !uploadedFile) ||
              (inputMethod === 'chat' && !chatInput.trim()) ||
              (inputMethod === 'topic' && !selectedTopic.trim())
            }
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Study Plan...
              </>
            ) : (
              <>
                <BookOpen className="mr-2 h-4 w-4" />
                Generate Study Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedPlan && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{generatedPlan.title}</CardTitle>
                <CardDescription>{generatedPlan.description}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getDifficultyColor(generatedPlan.difficultyLevel)}>
                  {generatedPlan.difficultyLevel}
                </Badge>
                <Badge variant="outline">
                  {generatedPlan.estimatedDuration} days
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Weak Areas Analysis */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <h4 className="font-medium">Areas for Improvement</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {generatedPlan.weakAreas.map((area, index) => (
                  <Badge key={index} variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Daily Lessons */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <h4 className="font-medium">Daily Study Plan</h4>
              </div>
              <div className="space-y-3">
                {generatedPlan.dailyLessons.map((lesson, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Day {lesson.day}</Badge>
                            <h5 className="font-medium">{lesson.topic}</h5>
                          </div>
                          <p className="text-sm text-muted-foreground">{lesson.description}</p>
                          <div className="space-y-1">
                            {lesson.activities.map((activity, actIndex) => (
                              <div key={actIndex} className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                {activity}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {lesson.estimatedTime} min
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {lesson.practiceQuestions} questions
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Progress Tracking */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <h4 className="font-medium">Progress Overview</h4>
              </div>
              <Card className="bg-muted/20">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>0/{generatedPlan.dailyLessons.length} days</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1">
                Start Study Plan
              </Button>
              <Button variant="outline" className="flex-1">
                Save Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};