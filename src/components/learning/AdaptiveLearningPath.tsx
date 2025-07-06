
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Target, 
  Zap, 
  CheckCircle2, 
  Circle,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Lightbulb,
  Clock,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdaptiveLearningService, AdaptivePath, LearningNode } from '@/services/adaptiveLearningService';
import { useAuth } from '@/contexts/AuthContext';

interface AdaptiveLearningPathProps {
  subject: string;
  goal: string;
  onNodeSelect?: (node: LearningNode) => void;
  onPathComplete?: (pathId: string) => void;
}

export const AdaptiveLearningPath: React.FC<AdaptiveLearningPathProps> = ({
  subject,
  goal,
  onNodeSelect,
  onPathComplete
}) => {
  const { user } = useAuth();
  const [path, setPath] = useState<AdaptivePath | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      loadOrGeneratePath();
    }
  }, [user, subject, goal]);

  const loadOrGeneratePath = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Try to load existing path first
      const existingPath = await AdaptiveLearningService.getLearningPath(`${user.id}-${subject}-${goal}`);
      if (existingPath) {
        setPath(existingPath);
        setActiveNode(existingPath.currentNode);
      } else {
        await generateNewPath();
      }
    } catch (error) {
      // Path doesn't exist, generate new one
      await generateNewPath();
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewPath = async () => {
    if (!user) return;
    
    setIsGenerating(true);
    try {
      const newPath = await AdaptiveLearningService.generatePersonalizedPath(
        user.id,
        subject,
        goal
      );
      setPath(newPath);
      setActiveNode(newPath.currentNode);
    } catch (error) {
      console.error('Error generating path:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNodeInteraction = async (nodeId: string, interactionType: string, data: any) => {
    if (!path) return;

    try {
      const updatedPath = await AdaptiveLearningService.updatePathProgress(
        path.id,
        nodeId,
        { type: interactionType, data, timestamp: new Date().toISOString() }
      );
      
      setPath(updatedPath);
      setActiveNode(updatedPath.currentNode);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const getNodeStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'from-green-500 to-emerald-500';
      case 'mastered': return 'from-purple-500 to-violet-500';
      case 'in-progress': return 'from-blue-500 to-cyan-500';
      case 'available': return 'from-yellow-500 to-orange-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getNodeIcon = (node: LearningNode) => {
    switch (node.type) {
      case 'concept': return <Lightbulb className="h-5 w-5" />;
      case 'practice': return <Target className="h-5 w-5" />;
      case 'assessment': return <CheckCircle2 className="h-5 w-5" />;
      case 'project': return <Star className="h-5 w-5" />;
      default: return <Circle className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardContent className="p-8 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Brain className="h-12 w-12 text-purple-500 mx-auto mb-4" />
          </motion.div>
          <p className="text-white/80">Analyzing your learning journey...</p>
        </CardContent>
      </Card>
    );
  }

  if (!path) {
    return (
      <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
        <CardContent className="p-8 text-center">
          <p className="text-white/80 mb-4">Unable to generate learning path</p>
          <Button onClick={generateNewPath} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Try Again'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Path Overview */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center">
            <Brain className="mr-3 h-8 w-8 text-purple-400" />
            Adaptive Learning Path: {path.subject}
          </CardTitle>
          <p className="text-white/70">Goal: {path.goal}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{Math.round(path.progress.overallCompletion)}%</div>
              <div className="text-sm text-white/60">Overall Progress</div>
              <Progress value={path.progress.overallCompletion} className="mt-2 h-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{path.progress.skillsMastered}</div>
              <div className="text-sm text-white/60">Skills Mastered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{Math.round(path.progress.estimatedTimeRemaining)}h</div>
              <div className="text-sm text-white/60">Time Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{path.progress.momentum}x</div>
              <div className="text-sm text-white/60">Learning Momentum</div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
              <Zap className="mr-2 h-5 w-5 text-yellow-400" />
              AI Insights
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-sm font-medium text-green-300 mb-2">Strengths</h5>
                <ul className="text-sm text-white/70 space-y-1">
                  {path.aiInsights.strengths.map((strength, index) => (
                    <li key={index}>• {strength}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-sm font-medium text-yellow-300 mb-2">Focus Areas</h5>
                <ul className="text-sm text-white/70 space-y-1">
                  {path.aiInsights.challenges.map((challenge, index) => (
                    <li key={index}>• {challenge}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Nodes */}
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-blue-500 opacity-30"></div>
        
        <div className="space-y-4">
          <AnimatePresence>
            {path.nodes.map((node, index) => (
              <motion.div
                key={node.id}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Node Status Indicator */}
                <div className="absolute left-6 top-6 z-10">
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${getNodeStatusColor(node.status)} flex items-center justify-center`}>
                    {getNodeIcon(node)}
                  </div>
                </div>

                <Card 
                  className={`ml-16 cursor-pointer transition-all duration-300 hover:scale-105 ${
                    activeNode === node.id
                      ? 'ring-2 ring-purple-500 bg-gradient-to-br from-purple-500/20 to-blue-500/20'
                      : 'bg-gradient-to-br from-white/5 to-white/1 hover:from-white/10 hover:to-white/5'
                  } border-white/20`}
                  onClick={() => {
                    setActiveNode(node.id);
                    onNodeSelect?.(node);
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-white">{node.title}</h3>
                          <Badge className={`bg-gradient-to-r ${getNodeStatusColor(node.status)} text-white border-0`}>
                            {node.type}
                          </Badge>
                        </div>
                        <p className="text-white/70 text-sm mb-3">
                          {node.microSkills.length} micro-skills • {node.microSkills.reduce((acc, skill) => acc + skill.estimatedTime, 0)} min
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center text-white/60 text-sm mb-2">
                          <Clock className="h-4 w-4 mr-1" />
                          {node.microSkills.reduce((acc, skill) => acc + skill.estimatedTime, 0)}min
                        </div>
                      </div>
                    </div>

                    {/* Micro Skills Progress */}
                    <div className="space-y-2 mb-4">
                      {node.microSkills.slice(0, 3).map((skill, skillIndex) => (
                        <div key={skill.id} className="flex items-center justify-between">
                          <span className="text-sm text-white/70">{skill.name}</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={skill.currentLevel * 100} className="w-20 h-1" />
                            <span className="text-xs text-white/60">{Math.round(skill.currentLevel * 100)}%</span>
                          </div>
                        </div>
                      ))}
                      {node.microSkills.length > 3 && (
                        <div className="text-xs text-white/50">+{node.microSkills.length - 3} more skills</div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center space-x-2">
                        {node.status === 'available' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNodeInteraction(node.id, 'start', {});
                            }}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        {node.status === 'in-progress' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNodeInteraction(node.id, 'continue', {});
                            }}
                            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Continue
                          </Button>
                        )}
                        {(node.status === 'completed' || node.status === 'mastered') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNodeInteraction(node.id, 'review', {});
                            }}
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        )}
                      </div>
                      
                      <div className="text-xs text-white/60 capitalize">
                        {node.status.replace('-', ' ')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Regenerate Path */}
      <div className="text-center">
        <Button
          onClick={generateNewPath}
          disabled={isGenerating}
          variant="outline"
          className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          {isGenerating ? 'Regenerating...' : 'Regenerate Path'}
        </Button>
      </div>
    </div>
  );
};
