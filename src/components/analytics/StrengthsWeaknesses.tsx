import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { isMockDataEnabled, mockAnalytics } from '@/utils/mockData';

export const StrengthsWeaknesses = () => {
  const [strengths, setStrengths] = useState<any[]>([]);
  const [weaknesses, setWeaknesses] = useState<any[]>([]);
  const [improvementParagraph, setImprovementParagraph] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (isMockDataEnabled()) {
      setIsLoading(true);
      setStrengths(mockAnalytics.strengths);
      setWeaknesses(mockAnalytics.weaknesses);
      setImprovementParagraph(mockAnalytics.improvement_paragraph);
      setIsLoading(false);
      return;
    }

    if (user) {
      fetchAnalytics();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Fetch learning analytics for strengths and weaknesses
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('learning_analytics')
        .select(`
          *,
          subjects (
            name
          )
        `)
        .eq('user_id', user?.id);

      if (analyticsError) throw analyticsError;

      // Process strengths and weaknesses
      const strengthsList = analyticsData?.filter(item => item.strength_score >= 0.7) || [];
      const weaknessesList = analyticsData?.filter(item => item.strength_score < 0.5) || [];

      setStrengths(strengthsList);
      setWeaknesses(weaknessesList);

      // Generate improvement paragraph
      const improvementParagraph = generateImprovementParagraph(
        strengthsList,
        weaknessesList
      );
      setImprovementParagraph(improvementParagraph);

    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateImprovementParagraph = (
    strengths: any[],
    weaknesses: any[]
  ): string => {
    let paragraph = "Based on your recent activity, here's a summary of your strengths and areas for improvement. ";

    if (strengths.length > 0) {
      const topStrength = strengths[0];
      paragraph += `You're showing strong skills in ${topStrength.topic_name} with a strength score of ${Math.round(topStrength.strength_score * 100)}%. `;
    }

    if (weaknesses.length > 0) {
      const topWeakness = weaknesses[0];
      paragraph += `To improve, focus on ${topWeakness.topic_name} where additional practice would be beneficial. `;
    }

    paragraph += "Consistent practice and engagement will help you build a solid foundation!";

    return paragraph;
  };

  if (isLoading) {
    return <div className="animate-pulse text-white">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Learning Analytics</h2>
        <p className="text-gray-400">
          Understand your strengths and weaknesses to improve learning
        </p>
      </div>

      {/* Improvement Paragraph */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Brain className="h-5 w-5" />
            Learning Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 leading-relaxed">
            {improvementParagraph}
          </p>
        </CardContent>
      </Card>

      {/* Strengths and Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            {strengths.length > 0 ? (
              <div className="space-y-4">
                {strengths.map((strength, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-white">{strength.topic_name}</h4>
                        <p className="text-sm text-gray-400">{strength.subjects?.name}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-400">
                          {Math.round(strength.strength_score * 100)}%
                        </div>
                      </div>
                    </div>
                    <Progress
                      value={strength.strength_score * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">
                No strengths identified yet. Keep learning to discover your strengths!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingDown className="h-5 w-5 text-orange-500" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weaknesses.length > 0 ? (
              <div className="space-y-4">
                {weaknesses.map((weakness, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-white">{weakness.topic_name}</h4>
                        <p className="text-sm text-gray-400">{weakness.subjects?.name}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-orange-400">
                          {Math.round(weakness.strength_score * 100)}%
                        </div>
                      </div>
                    </div>
                    <Progress
                      value={weakness.strength_score * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">
                No significant weaknesses detected. Keep up the great work!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
