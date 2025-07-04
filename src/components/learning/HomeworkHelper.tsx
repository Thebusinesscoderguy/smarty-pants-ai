
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  HelpCircle, 
  Lightbulb, 
  ArrowRight,
  CheckCircle,
  Clock,
  Brain,
  MessageCircle,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface HomeworkStep {
  step: number;
  question: string;
  hint: string;
  concept: string;
  completed?: boolean;
}

interface HomeworkGuidance {
  problemType: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  concepts: string[];
  steps: HomeworkStep[];
  estimatedTime: number;
}

interface HomeworkHelperProps {
  onComplete?: (sessionId: string) => void;
}

export const HomeworkHelper: React.FC<HomeworkHelperProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<HomeworkGuidance | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [studentResponse, setStudentResponse] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsLoading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `homework/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('study_materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('study_materials')
        .getPublicUrl(filePath);

      setUploadedFileUrl(urlData.publicUrl);

      // If it's an image, extract text using OCR (mock implementation)
      if (file.type.startsWith('image/')) {
        // In a real implementation, you'd use OCR service like Google Vision API
        const mockExtractedText = "Solve for x: 2x + 5 = 13";
        setProblem(mockExtractedText);
      }

    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeHomework = async () => {
    if (!problem || !user) return;

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('homework-helper', {
        body: {
          problem,
          studentId: user.id,
          fileUrl: uploadedFileUrl,
          sessionId: sessionId || undefined
        }
      });

      if (response.error) throw response.error;

      setGuidance(response.data.guidance);
      setSessionId(response.data.sessionId);
      setCompletedSteps(new Array(response.data.guidance.steps.length).fill(false));
      setCurrentStep(0);
    } catch (error) {
      console.error('Error analyzing homework:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepComplete = async () => {
    if (!guidance || !sessionId) return;

    const newCompletedSteps = [...completedSteps];
    newCompletedSteps[currentStep] = true;
    setCompletedSteps(newCompletedSteps);

    // Update session in database
    await supabase
      .from('homework_sessions')
      .update({
        steps_completed: newCompletedSteps.filter(Boolean).length,
        session_data: {
          ...guidance,
          studentResponses: {
            ...((guidance as any).studentResponses || {}),
            [currentStep]: studentResponse
          }
        }
      })
      .eq('id', sessionId);

    if (currentStep < guidance.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setShowHint(false);
      setStudentResponse('');
    } else {
      // All steps completed
      await supabase
        .from('homework_sessions')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          success_rate: newCompletedSteps.filter(Boolean).length / guidance.steps.length
        })
        .eq('id', sessionId);
      
      onComplete?.(sessionId);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'from-green-500 to-emerald-500';
      case 'medium': return 'from-yellow-500 to-orange-500';
      case 'hard': return 'from-red-500 to-pink-500';
      default: return 'from-blue-500 to-purple-500';
    }
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'math':
      case 'mathematics':
        return '🔢';
      case 'science':
      case 'physics':
      case 'chemistry':
        return '🔬';
      case 'english':
      case 'literature':
        return '📚';
      case 'history':
        return '🏛️';
      default:
        return '📖';
    }
  };

  if (!problem && !uploadedFileUrl) {
    return (
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center">
            <Brain className="mr-3 h-8 w-8 text-purple-400" />
            Homework Helper
          </CardTitle>
          <p className="text-white/70">
            Get step-by-step guidance without giving away answers
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full h-20 border-2 border-dashed border-purple-400/50 hover:border-purple-400 bg-purple-400/5 hover:bg-purple-400/10 text-white"
              disabled={isLoading}
            >
              <div className="text-center">
                {isLoading ? (
                  <div className="animate-spin h-8 w-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                    <div className="text-lg font-semibold">Upload Your Homework</div>
                    <div className="text-sm text-white/60">Images, PDFs, or documents</div>
                  </>
                )}
              </div>
            </Button>
          </div>

          <div className="text-center text-white/60">or</div>

          {/* Text Input */}
          <div className="space-y-4">
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Describe your homework problem here..."
              className="w-full h-32 p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            
            <Button
              onClick={analyzeHomework}
              disabled={!problem || isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg py-3"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Get Help with This Problem
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/80">Analyzing your homework problem...</p>
        </CardContent>
      </Card>
    );
  }

  if (!guidance) {
    return (
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="space-y-4">
            <div className="text-white">
              <h3 className="text-lg font-semibold mb-2">Your Problem:</h3>
              <div className="bg-white/5 p-4 rounded-lg border border-white/20">
                {uploadedFileUrl && (
                  <div className="flex items-center mb-3">
                    <ImageIcon className="h-5 w-5 text-blue-400 mr-2" />
                    <span className="text-blue-300">File uploaded</span>
                  </div>
                )}
                <p className="text-white/80">{problem}</p>
              </div>
            </div>
            
            <Button
              onClick={analyzeHomework}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Start Getting Help
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = (completedSteps.filter(Boolean).length / guidance.steps.length) * 100;
  const currentStepData = guidance.steps[currentStep];
  const allStepsCompleted = completedSteps.every(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-white flex items-center">
                <span className="text-2xl mr-3">{getSubjectIcon(guidance.subject)}</span>
                {guidance.subject} Problem
              </CardTitle>
              <div className="flex items-center space-x-4 mt-2">
                <Badge className={`bg-gradient-to-r ${getDifficultyColor(guidance.difficulty)} text-white`}>
                  {guidance.difficulty}
                </Badge>
                <div className="flex items-center text-white/60">
                  <Clock className="h-4 w-4 mr-1" />
                  ~{guidance.estimatedTime}min
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm text-white/70 mb-2">
              <span>Progress: {completedSteps.filter(Boolean).length} of {guidance.steps.length} steps</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {!allStepsCompleted ? (
        /* Current Step */
        <motion.div
          key={currentStep}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-white flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    {currentStep + 1}
                  </div>
                  Step {currentStep + 1} of {guidance.steps.length}
                </CardTitle>
                <Badge variant="outline" className="border-blue-400 text-blue-300">
                  {currentStepData.concept}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-white">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <HelpCircle className="mr-2 h-5 w-5 text-blue-400" />
                  Think About This:
                </h3>
                <p className="text-white/80 text-lg leading-relaxed">
                  {currentStepData.question}
                </p>
              </div>

              <div className="space-y-4">
                <textarea
                  value={studentResponse}
                  onChange={(e) => setStudentResponse(e.target.value)}
                  placeholder="Write your thoughts or answer here..."
                  className="w-full h-24 p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex items-center justify-between">
                  <Button
                    onClick={() => setShowHint(!showHint)}
                    variant="outline"
                    className="border-yellow-400/30 text-yellow-300 hover:bg-yellow-400/10"
                  >
                    <Lightbulb className="mr-2 h-4 w-4" />
                    {showHint ? 'Hide Hint' : 'Need a Hint?'}
                  </Button>

                  <Button
                    onClick={handleStepComplete}
                    disabled={!studentResponse.trim()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {currentStep === guidance.steps.length - 1 ? 'Complete Problem' : 'Next Step'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {showHint && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4"
                  >
                    <div className="flex items-start">
                      <Lightbulb className="h-5 w-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-yellow-300 font-semibold mb-1">Hint:</h4>
                        <p className="text-yellow-100/80">{currentStepData.hint}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        /* Completion */
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Great Work!</h2>
              <p className="text-white/80 mb-6">
                You've worked through all the steps. You should now have a better understanding of how to solve this type of problem.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">{guidance.steps.length}</div>
                  <div className="text-white/60">Steps Completed</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400">{guidance.concepts.length}</div>
                  <div className="text-white/60">Concepts Learned</div>
                </div>
              </div>

              <Button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                Help with Another Problem
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Concepts Learned */}
      {guidance.concepts.length > 0 && (
        <Card className="bg-gradient-to-br from-white/5 to-white/1 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center">
              <Brain className="mr-2 h-5 w-5 text-purple-400" />
              Key Concepts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {guidance.concepts.map(concept => (
                <Badge key={concept} variant="outline" className="border-purple-400/30 text-purple-300">
                  {concept}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
