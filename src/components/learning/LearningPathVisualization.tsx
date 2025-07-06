import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  ArrowRight, 
  Clock, 
  Star, 
  CheckCircle2, 
  Circle,
  Lightbulb,
  Target,
  TrendingUp,
  BookOpen,
  Brain,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdaptiveLearningPath } from './AdaptiveLearningPath';
import { LearningPathService, LearningPathSuggestion } from '@/services/learningPathService';
import { useAuth } from '@/contexts/AuthContext';

interface LearningPathVisualizationProps {
  onTopicSelect?: (topic: string) => void;
}

export const LearningPathVisualization: React.FC<LearningPathVisualizationProps> = ({
  onTopicSelect
}) => {
  const { user } = useAuth();
  const [useAdaptiveMode, setUseAdaptiveMode] = useState(true);
  const [suggestions, setSuggestions] = useState<LearningPathSuggestion[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<LearningPathSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [masteryData, setMasteryData] = useState<any[]>([]);
  const [currentSubject, setCurrentSubject] = useState('Mathematics');
  const [currentGoal, setCurrentGoal] = useState('Master Core Concepts');

  useEffect(() => {
    if (user && !useAdaptiveMode) {
      loadLegacyLearningPath();
    }
  }, [user, useAdaptiveMode]);

  const loadLegacyLearningPath = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const [pathSuggestions, mastery] = await Promise.all([
        LearningPathService.generateLearningPath(user.id),
        LearningPathService.getStudentMastery(user.id)
      ]);
      
      setSuggestions(pathSuggestions);
      setMasteryData(mastery);
    } catch (error) {
      console.error('Error loading learning path:', error);
    } finally {
      setIsLoading(false);
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

  const getPriorityIcon = (priority: number) => {
    if (priority >= 8) return <Star className="h-5 w-5 text-yellow-400" />;
    if (priority >= 6) return <Target className="h-5 w-5 text-blue-400" />;
    return <Circle className="h-5 w-5 text-gray-400" />;
  };

  const getTopicMastery = (topicName: string) => {
    const mastery = masteryData.find(m => 
      m.topic_name.toLowerCase().includes(topicName.toLowerCase())
    );
    return mastery?.mastery_level || 0;
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="mr-3 h-8 w-8 text-purple-400" />
              Learning Path System
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={useAdaptiveMode ? "default" : "outline"}
                onClick={() => setUseAdaptiveMode(true)}
                className="text-sm"
              >
                <Brain className="mr-2 h-4 w-4" />
                AI Adaptive
              </Button>
              <Button
                variant={!useAdaptiveMode ? "default" : "outline"}
                onClick={() => setUseAdaptiveMode(false)}
                className="text-sm"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Traditional
              </Button>
            </div>
          </CardTitle>
          <p className="text-white/70">
            {useAdaptiveMode 
              ? "AI-powered adaptive learning that evolves with your progress" 
              : "Classic structured learning path based on curriculum"
            }
          </p>
        </CardHeader>
        {useAdaptiveMode && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/70 mb-2 block">Subject</label>
                <select 
                  value={currentSubject}
                  onChange={(e) => setCurrentSubject(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="History">History</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-white/70 mb-2 block">Learning Goal</label>
                <select 
                  value={currentGoal}
                  onChange={(e) => setCurrentGoal(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                >
                  <option value="Master Core Concepts">Master Core Concepts</option>
                  <option value="Improve Problem Solving">Improve Problem Solving</option>
                  <option value="Prepare for Test">Prepare for Test</option>
                  <option value="Explore Advanced Topics">Explore Advanced Topics</option>
                </select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Render Appropriate Path System */}
      {useAdaptiveMode ? (
        <AdaptiveLearningPath
          subject={currentSubject}
          goal={currentGoal}
          onNodeSelect={(node) => {
            console.log('Selected node:', node);
            onTopicSelect?.(node.title);
          }}
          onPathComplete={(pathId) => {
            console.log('Path completed:', pathId);
          }}
        />
      ) : (
        <div>
          {/* Legacy Path Visualization */}
          {isLoading ? (
            <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-white/80">Analyzing your learning journey...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="text-center text-white/60 text-sm mb-6">
                Traditional curriculum-based learning path (Legacy Mode)
              </div>
              
              {/* Learning Path Visualization */}
              <div className="relative">
                {/* Connection Lines */}
                <div className="absolute left-8 top-16 bottom-16 w-0.5 bg-gradient-to-b from-purple-500 to-blue-500 opacity-30"></div>
                
                <div className="space-y-6">
                  {suggestions.map((suggestion, index) => {
                    const mastery = getTopicMastery(suggestion.topic);
                    const isCompleted = mastery >= 0.8;
                    const isInProgress = mastery >= 0.3 && mastery < 0.8;
                    
                    return (
                      <motion.div
                        key={suggestion.topic}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative"
                      >
                        {/* Progress Node */}
                        <div className="absolute left-6 top-6 z-10">
                          <div className={`w-6 h-6 rounded-full border-4 ${
                            isCompleted 
                              ? 'bg-green-500 border-green-400' 
                              : isInProgress
                              ? 'bg-yellow-500 border-yellow-400'
                              : 'bg-gray-600 border-gray-500'
                          } flex items-center justify-center`}>
                            {isCompleted && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </div>
                        </div>

                        <Card 
                          className={`ml-16 cursor-pointer transition-all duration-300 hover:scale-105 ${
                            selectedTopic?.topic === suggestion.topic
                              ? 'ring-2 ring-purple-500 bg-gradient-to-br from-purple-500/20 to-blue-500/20'
                              : 'bg-gradient-to-br from-white/5 to-white/1 hover:from-white/10 hover:to-white/5'
                          } border-white/20 backdrop-blur-sm`}
                          onClick={() => setSelectedTopic(suggestion)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  {getPriorityIcon(suggestion.priority)}
                                  <h3 className="text-xl font-semibold text-white">
                                    {suggestion.topic}
                                  </h3>
                                  <Badge 
                                    className={`bg-gradient-to-r ${getDifficultyColor(suggestion.difficulty)} text-white border-0`}
                                  >
                                    {suggestion.difficulty}
                                  </Badge>
                                </div>
                                <p className="text-sm text-blue-300 mb-2">{suggestion.subject}</p>
                                <p className="text-white/70 text-sm leading-relaxed">
                                  {suggestion.reason}
                                </p>
                              </div>
                              
                              <div className="text-right ml-4">
                                <div className="flex items-center text-white/60 text-sm mb-2">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {suggestion.estimatedTime}min
                                </div>
                                {mastery > 0 && (
                                  <div className="text-right">
                                    <div className="text-xs text-white/60 mb-1">Progress</div>
                                    <div className="w-20">
                                      <Progress value={mastery * 100} className="h-2" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Prerequisites */}
                            {suggestion.prerequisites.length > 0 && (
                              <div className="flex items-center space-x-2 mb-3">
                                <span className="text-xs text-white/60">Prerequisites:</span>
                                <div className="flex flex-wrap gap-1">
                                  {suggestion.prerequisites.map(prereq => (
                                    <Badge key={prereq} variant="outline" className="text-xs border-white/20 text-white/70">
                                      {prereq}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                              <div className="flex items-center space-x-4 text-sm text-white/60">
                                <div className="flex items-center">
                                  <TrendingUp className="h-4 w-4 mr-1" />
                                  Priority: {suggestion.priority}/10
                                </div>
                              </div>
                              
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTopicSelect?.(suggestion.topic);
                                }}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                              >
                                Start Learning
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Topic Detail Modal */}
              <AnimatePresence>
                {selectedTopic && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedTopic(null)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-2xl w-full border border-white/20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h2 className="text-3xl font-bold text-white mb-2">{selectedTopic.topic}</h2>
                          <p className="text-blue-300">{selectedTopic.subject}</p>
                        </div>
                        <Badge className={`bg-gradient-to-r ${getDifficultyColor(selectedTopic.difficulty)} text-white`}>
                          {selectedTopic.difficulty}
                        </Badge>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                            <Lightbulb className="mr-2 h-5 w-5 text-yellow-400" />
                            Why This Topic?
                          </h3>
                          <p className="text-white/80 leading-relaxed">{selectedTopic.reason}</p>
                        </div>

                        {selectedTopic.prerequisites.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                              <BookOpen className="mr-2 h-5 w-5 text-blue-400" />
                              Prerequisites
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedTopic.prerequisites.map(prereq => (
                                <Badge key={prereq} variant="outline" className="border-blue-400 text-blue-300">
                                  {prereq}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-6 border-t border-white/20">
                          <div className="text-white/60">
                            <Clock className="inline h-4 w-4 mr-1" />
                            Estimated time: {selectedTopic.estimatedTime} minutes
                          </div>
                          <div className="space-x-3">
                            <Button
                              variant="outline"
                              onClick={() => setSelectedTopic(null)}
                              className="border-white/20 text-white hover:bg-white/10"
                            >
                              Close
                            </Button>
                            <Button
                              onClick={() => {
                                onTopicSelect?.(selectedTopic.topic);
                                setSelectedTopic(null);
                              }}
                              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            >
                              Start Learning
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Refresh Button */}
              <div className="text-center">
                <Button
                  onClick={loadLegacyLearningPath}
                  variant="outline"
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Refresh Learning Path
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
