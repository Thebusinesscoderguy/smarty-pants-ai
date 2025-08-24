import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuizAnalytics } from '@/hooks/useQuizAnalytics';
import { 
  BarChart3, 
  Clock, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Brain,
  Zap,
  BookOpen,
  RotateCcw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export const QuizPerformanceAnalytics = () => {
  const { 
    loading, 
    quizPerformance, 
    subjectImprovements, 
    refreshAnalytics,
    retakeQuizWithMistakeFocus,
    getRecommendedSimilarQuizzes
  } = useQuizAnalytics();
  
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getImprovementIcon = (improvement: number) => {
    if (improvement > 5) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (improvement < -5) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Target className="h-4 w-4 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading quiz analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Quiz Performance Analytics</h2>
          <p className="text-muted-foreground">Detailed analysis of quiz performance, mistakes, and improvement areas</p>
        </div>
        <Button onClick={refreshAnalytics} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="question-level">Question Analysis</TabsTrigger>
          <TabsTrigger value="subject-improvement">Subject Progress</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quiz Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizPerformance.map((quiz) => (
              <Card key={quiz.quiz_id} className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedQuiz(selectedQuiz === quiz.quiz_id ? null : quiz.quiz_id)}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{quiz.quiz_title}</CardTitle>
                    <Badge className={getScoreBadgeColor(quiz.best_score)}>
                      Best: {Math.round(quiz.best_score)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Average Score</span>
                      <span className="font-medium">{Math.round(quiz.average_score)}%</span>
                    </div>
                    <Progress value={quiz.average_score} className="h-2" />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <RotateCcw className="h-3 w-3" />
                        <span>{quiz.total_attempts} attempts</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{Math.round(quiz.completion_time_trend.reduce((a, b) => a + b, 0) / quiz.completion_time_trend.length || 0)}min avg</span>
                      </div>
                    </div>

                    {quiz.recommended_retake && (
                      <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="text-sm text-orange-700">Retake recommended</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed Quiz Analysis */}
          {selectedQuiz && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Detailed Analysis: {quizPerformance.find(q => q.quiz_id === selectedQuiz)?.quiz_title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const quiz = quizPerformance.find(q => q.quiz_id === selectedQuiz);
                  if (!quiz) return null;

                  return (
                    <div>
                      {/* Mistake Categories */}
                      <div>
                        <h4 className="font-medium mb-3">Common Mistake Types</h4>
                        <div className="space-y-2">
                          {Object.entries(quiz.mistake_categories).map(([category, count]) => (
                            <div key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm">{category}</span>
                              <Badge variant="outline">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="question-level" className="space-y-6">
          {selectedQuiz ? (
            (() => {
              const quiz = quizPerformance.find(q => q.quiz_id === selectedQuiz);
              if (!quiz) return <div>Select a quiz to view question analysis</div>;

              return (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Question-Level Analysis: {quiz.quiz_title}</h3>
                  
                  {quiz.question_analytics.map((question) => (
                    <Card key={question.question_id}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {/* Question Info */}
                          <div className="lg:col-span-2">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-sm line-clamp-2">{question.question_text}</h4>
                              <Badge className={getScoreBadgeColor(question.accuracy_rate)}>
                                {Math.round(question.accuracy_rate)}%
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Type: {question.question_type}</span>
                              <span>Topic: {question.topic}</span>
                              <span>Attempts: {question.attempts}</span>
                            </div>

                            {question.mistake_patterns.length > 0 && (
                              <div className="mt-2">
                                <h5 className="text-xs font-medium text-red-600 mb-1">Common Mistakes:</h5>
                                <div className="space-y-1">
                                  {question.mistake_patterns.slice(0, 2).map((pattern, i) => (
                                    <div key={i} className="text-xs text-red-700 bg-red-50 p-1 rounded">
                                      {pattern}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Performance Stats */}
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Accuracy</span>
                                <span>{Math.round(question.accuracy_rate)}%</span>
                              </div>
                              <Progress value={question.accuracy_rate} className="h-2" />
                            </div>
                            
                            <div className="text-sm">
                              <div className="flex items-center gap-1 mb-1">
                                <Clock className="h-3 w-3" />
                                <span>Avg Response: {Math.round(question.average_response_time / 1000)}s</span>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                <span>Difficulty: {question.difficulty_level}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })()
          ) : (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Quiz</h3>
              <p className="text-muted-foreground">Choose a quiz from the Overview tab to see detailed question analysis</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="subject-improvement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {subjectImprovements.map((subject) => (
              <Card key={subject.subject}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {subject.subject}
                    </span>
                    <div className="flex items-center gap-1">
                      {getImprovementIcon(subject.overall_improvement)}
                      <span className="text-sm font-normal">
                        {subject.overall_improvement > 0 ? '+' : ''}{Math.round(subject.overall_improvement)}%
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Score Progression Chart */}
                    <div>
                      <h4 className="font-medium mb-2">Score Progression</h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={subject.score_progression.slice(-10)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="quiz_title" tick={false} />
                          <YAxis />
                          <Tooltip formatter={(value, name) => [`${value}%`, 'Score']} />
                          <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Topics Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Mastered ({subject.topics_mastered.length})
                        </h5>
                        <div className="space-y-1">
                          {subject.topics_mastered.slice(0, 3).map((topic, i) => (
                            <Badge key={i} variant="outline" className="bg-green-50 text-green-700 text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-orange-600 mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Need Practice ({subject.topics_struggling.length})
                        </h5>
                        <div className="space-y-1">
                          {subject.topics_struggling.slice(0, 3).map((topic, i) => (
                            <Badge key={i} variant="outline" className="bg-orange-50 text-orange-700 text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* All Quizzes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  All Quizzes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {quizPerformance.map(quiz => (
                    <div key={quiz.quiz_id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{quiz.quiz_title}</h4>
                        <div className="flex gap-2">
                          <Badge className={getScoreBadgeColor(quiz.best_score)}>
                            Best: {Math.round(quiz.best_score)}%
                          </Badge>
                          {quiz.recommended_retake && (
                            <Badge variant="destructive">Retake</Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                        <span>Avg: {Math.round(quiz.average_score)}%</span>
                        <span>{quiz.total_attempts} attempts</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          View Details
                        </Button>
                        {quiz.recommended_retake && (
                          <Button 
                            size="sm" 
                            onClick={() => retakeQuizWithMistakeFocus(quiz.quiz_id)}
                            className="flex-1"
                          >
                            Retake
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {quizPerformance.length === 0 && (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No quizzes completed yet.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Study Plan Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Study Plan Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subjectImprovements.map(subject => (
                    <div key={subject.subject} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{subject.subject}</h4>
                        <span className="text-sm font-medium">
                          {Math.round((subject.topics_mastered.length / (subject.topics_mastered.length + subject.topics_struggling.length)) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={(subject.topics_mastered.length / (subject.topics_mastered.length + subject.topics_struggling.length)) * 100} 
                        className="h-2" 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{subject.topics_mastered.length} mastered</span>
                        <span>{subject.topics_struggling.length} to practice</span>
                      </div>
                      
                      {subject.topics_struggling.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-orange-600 mb-1">Next to practice:</p>
                          <div className="flex flex-wrap gap-1">
                            {subject.topics_struggling.slice(0, 3).map((topic, i) => (
                              <Badge key={i} variant="outline" className="bg-orange-50 text-orange-700 text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {subjectImprovements.length === 0 && (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No study plan data available.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};