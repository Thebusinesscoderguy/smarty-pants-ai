
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Users, Brain } from 'lucide-react';
import { AttendanceSummaryCard } from '@/components/attendance/AttendanceSummaryCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { isMockDataEnabled } from '@/utils/mockDataToggle';
import { mockParentDashboard } from '@/utils/mockData';

interface StudentData {
  student_id: string;
  student_name: string;
  strengths: Array<{ topic: string; score: number; subject: string }>;
  weaknesses: Array<{ topic: string; score: number; subject: string }>;
  improvement_paragraph: string;
}

export const ParentDashboard = () => {
  const { t } = useLanguage();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (isMockDataEnabled()) {
      setIsLoading(true);
      setStudentData(mockParentDashboard);
      setIsLoading(false);
      return;
    }

    if (user) {
      fetchChildData();
    }
  }, [user]);

  const fetchChildData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Get child from parent-child relationship
      const { data: relationship, error: relationshipError } = await supabase
        .from('parent_child_relationships')
        .select('child_id')
        .eq('parent_id', user.id)
        .single();

      if (relationshipError) {
        console.error('No child relationship found:', relationshipError);
        setIsLoading(false);
        return;
      }

      // Get child profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', relationship.child_id)
        .single();

      // Get learning analytics for strengths and weaknesses
      const { data: analytics, error: analyticsError } = await supabase
        .from('learning_analytics')
        .select(`
          topic_name,
          strength_score,
          total_attempts,
          correct_attempts,
          subjects (name)
        `)
        .eq('user_id', relationship.child_id);

      if (analyticsError) {
        console.error('Error fetching analytics:', analyticsError);
      }

      // Process analytics data
      const processedAnalytics = analytics || [];
      const strengths = processedAnalytics
        .filter(item => item.strength_score >= 0.75)
        .map(item => ({
          topic: item.topic_name,
          score: Math.round(item.strength_score * 100),
          subject: item.subjects?.name || t('pd2.unknown')
        }))
        .slice(0, 5);

      const weaknesses = processedAnalytics
        .filter(item => item.strength_score < 0.6)
        .map(item => ({
          topic: item.topic_name,
          score: Math.round(item.strength_score * 100),
          subject: item.subjects?.name || t('pd2.unknown')
        }))
        .slice(0, 5);

      // Generate improvement paragraph
      const improvementParagraph = generateImprovementParagraph(
        profile?.display_name || t('pd2.yourChild'),
        strengths,
        weaknesses
      );

      setStudentData({
        student_id: relationship.child_id,
        student_name: profile?.display_name || 'Your child',
        strengths,
        weaknesses,
        improvement_paragraph: improvementParagraph
      });

    } catch (error: any) {
      console.error('Error fetching child data:', error);
      toast({
        title: t('pd2.error'),
        description: t('pd2.failedLoad'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateImprovementParagraph = (
    studentName: string,
    strengths: Array<{ topic: string; score: number; subject: string }>,
    weaknesses: Array<{ topic: string; score: number; subject: string }>
  ): string => {
    let paragraph = `${studentName} ${t('pd2.paraProgress')} `;

    if (strengths.length > 0) {
      const topStrength = strengths[0];
      paragraph += `${t('pd2.paraStrongPre')} ${topStrength.topic} ${t('pd2.paraStrongMid')} ${topStrength.score}${t('pd2.paraStrongPost')} `;

      if (strengths.length > 1) {
        paragraph += `${t('pd2.paraOtherPre')} ${strengths.slice(1, 3).map(s => s.topic).join(` ${t('pd2.andWord')} `)}. `;
      }
    }

    if (weaknesses.length > 0) {
      const topWeakness = weaknesses[0];
      paragraph += `${t('pd2.paraWeakPre')} ${topWeakness.topic} ${t('pd2.paraWeakPost')} `;

      if (weaknesses.length > 1) {
        paragraph += `${t('pd2.paraReviewPre')} ${weaknesses.slice(1, 2).map(w => w.topic).join(` ${t('pd2.andWord')} `)}. `;
      }
    }

    paragraph += t('pd2.paraOutro');

    return paragraph;
  };

  if (isLoading) {
    return <div className="animate-pulse text-white">{t('pd2.loading')}</div>;
  }

  if (!studentData) {
    return (
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-white">{t('pd2.noChildTitle')}</h3>
          <p className="text-gray-300">
            {isMockDataEnabled() ? t('pd2.mockNote') : t('pd2.noChildDesc')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('pd2.title')}</h1>
        <p className="text-gray-400">
          {t('pd2.monitorPre')} {studentData.student_name}{t('pd2.monitorPost')}
        </p>
      </div>

      {/* Improvement Paragraph */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Brain className="h-5 w-5" />
            {t('pd2.summary')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 leading-relaxed">
            {studentData.improvement_paragraph}
          </p>
        </CardContent>
      </Card>

      {/* Attendance */}
      <AttendanceSummaryCard studentId={studentData.student_id} studentName={studentData.student_name} />

      {/* Strengths and Weaknesses */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-green-500" />
              {t('pd2.strengths')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentData.strengths.length > 0 ? (
              <div className="space-y-4">
                {studentData.strengths.map((strength, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-white">{strength.topic}</h4>
                        <p className="text-sm text-gray-400">{strength.subject}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-400">
                          {strength.score}%
                        </div>
                      </div>
                    </div>
                    <Progress 
                      value={strength.score} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">
                {t('pd2.keepPracticing')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingDown className="h-5 w-5 text-violet-500" />
              {t('pd2.areasImprovement')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentData.weaknesses.length > 0 ? (
              <div className="space-y-4">
                {studentData.weaknesses.map((weakness, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-white">{weakness.topic}</h4>
                        <p className="text-sm text-gray-400">{weakness.subject}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-violet-400">
                          {weakness.score}%
                        </div>
                      </div>
                    </div>
                    <Progress 
                      value={weakness.score} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">
                {t('pd2.greatJob')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
