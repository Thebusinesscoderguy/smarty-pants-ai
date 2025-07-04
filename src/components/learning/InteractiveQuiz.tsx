
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Star, Trophy, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LearningPathService } from '@/services/learningPathService';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  estimatedTime: number;
}

interface InteractiveQuizProps {
  topic: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  chatHistory?: any[];
  onComplete?: (score: number, totalQuestions: number) => void;
}

export const InteractiveQuiz: React.FC<InteractiveQuizProps> = ({
  topic,
  difficulty = 'medium',
  chatHistory = [],
  onComplete
}) => {
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    generateQuiz();
  }, [topic, difficulty]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (quizStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizStarted, timeLeft]);

  const generateQuiz = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('smart-quiz-generator', {
        body: {
          topic,
          difficulty,
          studentId: user.id,
          chatHistory
        }
      });

      if (response.error) throw response.error;
      
      setQuiz(response.data.quiz);
      setTimeLeft(response.data.quiz.estimatedTime * 60); // Convert to seconds
    } catch (error) {
      console.error('Error generating quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (!quiz || !user) return;

    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correct) {
        correctAnswers++;
      }
    });

    const finalScore = correctAnswers;
    const percentage = (correctAnswers / quiz.questions.length) * 100;
    
    setScore(finalScore);
    setShowResult(true);
    
    if (percentage >= 80) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    // Update quiz in database
    await supabase
      .from('instant_quizzes')
      .update({
        score: finalScore,
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', quiz.id);

    // Update topic mastery
    await LearningPathService.updateTopicMastery(
      user.id,
      topic,
      quiz.questions[0]?.topic || 'General',
      percentage / 100
    );

    onComplete?.(finalScore, quiz.questions.length);
  };

  const startQuiz = () => {
    setQuizStarted(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-500';
    if (percentage >= 70) return 'text-blue-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/80">Generating your personalized quiz...</p>
        </CardContent>
      </Card>
    );
  }

  if (!quiz) {
    return (
      <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white/80">Failed to generate quiz. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  if (showResult) {
    const percentage = (score / quiz.questions.length) * 100;
    
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                initial={{
                  x: Math.random() * 400,
                  y: -10,
                  rotate: 0,
                  scale: 0
                }}
                animate={{
                  y: 500,
                  rotate: 360,
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 3,
                  delay: Math.random() * 2,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {percentage >= 80 ? (
                <Trophy className="h-16 w-16 text-yellow-400" />
              ) : percentage >= 60 ? (
                <Star className="h-16 w-16 text-blue-400" />
              ) : (
                <Zap className="h-16 w-16 text-purple-400" />
              )}
            </div>
            <CardTitle className="text-2xl text-white">Quiz Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(percentage)}`}>
                {score}/{quiz.questions.length}
              </div>
              <div className={`text-2xl font-semibold ${getScoreColor(percentage)}`}>
                {percentage.toFixed(0)}%
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-white/80">
                <span>Accuracy</span>
                <span>{percentage.toFixed(0)}%</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-green-400 font-bold text-xl">{score}</div>
                <div className="text-white/60 text-sm">Correct</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-red-400 font-bold text-xl">{quiz.questions.length - score}</div>
                <div className="text-white/60 text-sm">Incorrect</div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Take Another Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!quizStarted) {
    return (
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center">
            <Zap className="mr-3 h-8 w-8 text-purple-400" />
            {quiz.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Badge className={`${getDifficultyColor(difficulty)} text-white`}>
              {difficulty.toUpperCase()}
            </Badge>
            <div className="flex items-center text-white/80">
              <Clock className="mr-2 h-4 w-4" />
              ~{quiz.estimatedTime} min
            </div>
          </div>
          
          <div className="text-white/80">
            Test your knowledge on <span className="text-purple-400 font-semibold">{topic}</span> with {quiz.questions.length} personalized questions.
          </div>

          <Button
            onClick={startQuiz}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg py-6"
          >
            Start Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentQ = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <motion.div
      key={currentQuestion}
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="text-white/80">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </div>
            <div className="flex items-center text-white/80">
              <Clock className="mr-2 h-4 w-4" />
              {formatTime(timeLeft)}
            </div>
          </div>
          <Progress value={progress} className="h-2 mb-4" />
          <CardTitle className="text-xl text-white leading-relaxed">
            {currentQ.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {currentQ.options.map((option, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedAnswers[currentQuestion] === index
                    ? 'border-purple-500 bg-purple-500/20 text-white'
                    : 'border-white/20 bg-white/5 text-white/80 hover:border-purple-400 hover:bg-purple-400/10'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedAnswers[currentQuestion] === index
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-white/40'
                  }`}>
                    {selectedAnswers[currentQuestion] === index && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  {option}
                </div>
              </motion.button>
            ))}
          </div>

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Previous
            </Button>
            <Button
              onClick={handleNextQuestion}
              disabled={selectedAnswers[currentQuestion] === undefined}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {currentQuestion === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
