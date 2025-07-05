
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, ArrowRight, CheckCircle, Upload, Brain, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface HomeworkStep {
  step: number;
  question: string;
  hint: string;
  concept: string;
  completed?: boolean;
}

interface HomeworkSession {
  problemType: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  concepts: string[];
  steps: HomeworkStep[];
  estimatedTime: number;
  sessionId?: string;
}

interface HomeworkHelperProps {
  initialProblem?: string;
  onComplete?: (sessionId: string) => void;
}

export const HomeworkHelper: React.FC<HomeworkHelperProps> = ({
  initialProblem,
  onComplete
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [problem, setProblem] = useState(initialProblem || '');
  const [session, setSession] = useState<HomeworkSession | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [studentResponses, setStudentResponses] = useState<{[key: number]: string}>({});
  const [showHint, setShowHint] = useState<{[key: number]: boolean}>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const analyzeProblem = async (problemText: string, fileUrl?: string) => {
    if (!user) return;
    
    setIsAnalyzing(true);
    try {
      const response = await supabase.functions.invoke('homework-helper', {
        body: {
          problem: problemText,
          studentId: user.id,
          fileUrl,
          sessionId: `hw_${Date.now()}`
        }
      });

      if (response.error) throw response.error;
      
      const { guidance, sessionId } = response.data;
      setSession({
        ...guidance,
        sessionId
      });
      
    } catch (error: any) {
      toast({
        title: "Analysis Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    const fileUrl = URL.createObjectURL(uploadedFile);
    await analyzeProblem(`Problem from uploaded file: ${uploadedFile.name}`, fileUrl);
  };

  const handleStepResponse = (stepIndex: number, response: string) => {
    setStudentResponses(prev => ({
      ...prev,
      [stepIndex]: response
    }));
  };

  const completeStep = async (stepIndex: number) => {
    if (!session) return;
    
    const updatedSteps = [...session.steps];
    updatedSteps[stepIndex].completed = true;
    
    setSession({
      ...session,
      steps: updatedSteps
    });

    // Update database
    if (session.sessionId && user) {
      const sessionData = {
        studentResponses,
        problemType: session.problemType,
        subject: session.subject,
        difficulty: session.difficulty,
        concepts: session.concepts,
        steps: session.steps,
        estimatedTime: session.estimatedTime
      };

      await supabase
        .from('homework_sessions')
        .update({
          steps_completed: stepIndex + 1,
          session_data: JSON.stringify(sessionData)
        })
        .eq('id', session.sessionId);
    }

    if (stepIndex < session.steps.length - 1) {
      setCurrentStep(stepIndex + 1);
    } else {
      // Session completed
      handleSessionComplete();
    }
  };

  const handleSessionComplete = () => {
    if (session?.sessionId) {
      onComplete?.(session.sessionId);
    }
    
    toast({
      title: "Homework Complete! 🎉",
      description: "Great job working through this problem step by step!",
    });
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  if (!session && !isAnalyzing) {
    return (
      <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center">
            <Brain className="mr-3 h-8 w-8 text-blue-400" />
            Homework Helper
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-white/80">
            Get step-by-step guidance on your homework problems. I'll help you understand the concepts and work through solutions together.
          </div>

          <div className="space-y-4">
            <Textarea
              placeholder="Describe your homework problem or paste the question here..."
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder-white/50"
              rows={4}
            />

            <div className="flex items-center justify-center p-6 border-2 border-dashed border-white/20 rounded-lg">
              <label htmlFor="homework-file" className="cursor-pointer text-center">
                <Upload className="h-12 w-12 text-white/60 mx-auto mb-2" />
                <p className="text-white/80">Upload homework image or document</p>
                <input
                  id="homework-file"
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>

            <Button
              onClick={() => analyzeProblem(problem)}
              disabled={!problem.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-6"
            >
              Start Homework Help
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isAnalyzing) {
    return (
      <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/80">Analyzing your problem and creating a step-by-step guide...</p>
        </CardContent>
      </Card>
    );
  }

  if (!session) return null;

  const progress = ((currentStep + 1) / session.steps.length) * 100;
  const currentStepData = session.steps[currentStep];

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="space-y-6"
    >
      {/* Session Header */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-white flex items-center">
              <Brain className="mr-3 h-6 w-6 text-blue-400" />
              {session.subject} Problem
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge className={`${getDifficultyColor(session.difficulty)} text-white`}>
                {session.difficulty.toUpperCase()}
              </Badge>
              <div className="flex items-center text-white/60">
                <Clock className="mr-1 h-4 w-4" />
                ~{session.estimatedTime} min
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-2 mt-4" />
          <div className="text-white/60 text-sm">
            Step {currentStep + 1} of {session.steps.length}
          </div>
        </CardHeader>
      </Card>

      {/* Current Step */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Step {currentStepData.step}: {currentStepData.concept}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-white/90 text-lg leading-relaxed">
                {currentStepData.question}
              </div>

              <Textarea
                placeholder="Write your answer or thoughts here..."
                value={studentResponses[currentStep] || ''}
                onChange={(e) => handleStepResponse(currentStep, e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-white/50"
                rows={4}
              />

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setShowHint(prev => ({ ...prev, [currentStep]: !prev[currentStep] }))}
                  className="border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
                >
                  <Lightbulb className="mr-2 h-4 w-4" />
                  {showHint[currentStep] ? 'Hide Hint' : 'Show Hint'}
                </Button>

                <Button
                  onClick={() => completeStep(currentStep)}
                  disabled={!studentResponses[currentStep]?.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {currentStep === session.steps.length - 1 ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Complete
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Next Step
                    </>
                  )}
                </Button>
              </div>

              {showHint[currentStep] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4"
                >
                  <div className="flex items-start">
                    <Lightbulb className="h-5 w-5 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-yellow-200">{currentStepData.hint}</p>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Concepts Overview */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="text-white/80 text-sm mb-2">Key Concepts:</div>
          <div className="flex flex-wrap gap-2">
            {session.concepts.map((concept, index) => (
              <Badge key={index} variant="outline" className="border-purple-400/30 text-purple-300">
                {concept}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
