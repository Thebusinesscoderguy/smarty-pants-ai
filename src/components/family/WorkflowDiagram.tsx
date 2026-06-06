import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowRight } from 'lucide-react';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface WorkflowDiagramProps {
  title: string;
  steps: WorkflowStep[];
  orientation?: 'vertical' | 'horizontal';
}

export const WorkflowDiagram: React.FC<WorkflowDiagramProps> = ({ 
  title, 
  steps, 
  orientation = 'vertical' 
}) => {
  const ArrowIcon = orientation === 'vertical' ? ArrowDown : ArrowRight;
  const containerClass = orientation === 'vertical' 
    ? 'flex flex-col items-center space-y-4' 
    : 'flex flex-row items-center space-x-4 overflow-x-auto';

  return (
    <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white text-xl text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={containerClass}>
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step Card */}
              <div 
                className={`relative p-6 rounded-xl border transition-all duration-300 hover:scale-105 ${
                  orientation === 'vertical' ? 'w-full max-w-md' : 'min-w-64'
                } bg-gradient-to-br ${step.color} border-white/20`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">{step.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-white/80 text-sm">{step.description}</p>
                </div>
                
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{index + 1}</span>
                </div>
              </div>
              
              {/* Arrow (except for last item) */}
              {index < steps.length - 1 && (
                <ArrowIcon className="h-6 w-6 text-white/60" />
              )}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Predefined workflow configurations
export const QuizRecoveryWorkflow = () => {
  const steps: WorkflowStep[] = [
    {
      id: 'upload',
      title: 'Upload Quiz',
      description: 'Take a photo or upload your child\'s completed quiz or describe the problem areas',
      icon: '📸',
      color: 'from-blue-500/20 to-purple-500/20'
    },
    {
      id: 'analyze',
      title: 'AI Analysis',
      description: 'Our AI identifies weak areas and learning gaps from the quiz results',
      icon: '🧠',
      color: 'from-purple-500/20 to-pink-500/20'
    },
    {
      id: 'plan',
      title: 'Study Plan Creation',
      description: 'Personalized daily lessons and practice questions are generated automatically',
      icon: '📋',
      color: 'from-pink-500/20 to-red-500/20'
    },
    {
      id: 'practice',
      title: 'Practice & Learn',
      description: 'Your child follows the study plan with interactive lessons and exercises',
      icon: '✍️',
      color: 'from-red-500/20 to-violet-500/20'
    },
    {
      id: 'track',
      title: 'Track Progress',
      description: 'Monitor improvement through detailed analytics and celebrate achievements',
      icon: '📊',
      color: 'from-violet-500/20 to-yellow-500/20'
    }
  ];

  return (
    <WorkflowDiagram 
      title="Quiz Recovery Study Plan Workflow"
      steps={steps}
      orientation="vertical"
    />
  );
};

export const QuizGeneratorWorkflow = () => {
  const steps: WorkflowStep[] = [
    {
      id: 'input',
      title: 'Choose Input Method',
      description: 'Select topic, upload materials, or describe what to practice',
      icon: '⚙️',
      color: 'from-green-500/20 to-emerald-500/20'
    },
    {
      id: 'generate',
      title: 'AI Quiz Generation',
      description: 'Custom quiz created based on your child\'s level and weak areas',
      icon: '🎯',
      color: 'from-emerald-500/20 to-teal-500/20'
    },
    {
      id: 'practice',
      title: 'Take Quiz',
      description: 'Interactive quiz with immediate feedback and explanations',
      icon: '📝',
      color: 'from-teal-500/20 to-cyan-500/20'
    },
    {
      id: 'results',
      title: 'Review Results',
      description: 'Detailed results with areas for improvement identified',
      icon: '📈',
      color: 'from-cyan-500/20 to-blue-500/20'
    }
  ];

  return (
    <WorkflowDiagram 
      title="AI Quiz Generator Workflow"
      steps={steps}
      orientation="horizontal"
    />
  );
};

export const FamilyLearningWorkflow = () => {
  const steps: WorkflowStep[] = [
    {
      id: 'setup',
      title: 'Family Setup',
      description: 'Add children and set learning goals during onboarding',
      icon: '👨‍👩‍👧‍👦',
      color: 'from-purple-500/20 to-blue-500/20'
    },
    {
      id: 'assess',
      title: 'Initial Assessment',
      description: 'Upload quizzes or let children take adaptive assessments',
      icon: '📊',
      color: 'from-blue-500/20 to-green-500/20'
    },
    {
      id: 'personalize',
      title: 'AI Personalization',
      description: 'Platform adapts to each child\'s learning style and pace',
      icon: '🎯',
      color: 'from-green-500/20 to-yellow-500/20'
    },
    {
      id: 'learn',
      title: 'Daily Learning',
      description: 'Children engage with AI tutor, voice sessions, and practice quizzes',
      icon: '🎓',
      color: 'from-yellow-500/20 to-violet-500/20'
    },
    {
      id: 'celebrate',
      title: 'Track & Celebrate',
      description: 'Parents monitor progress and celebrate achievements together',
      icon: '🎉',
      color: 'from-violet-500/20 to-red-500/20'
    }
  ];

  return (
    <WorkflowDiagram 
      title="Complete Family Learning Journey"
      steps={steps}
      orientation="vertical"
    />
  );
};