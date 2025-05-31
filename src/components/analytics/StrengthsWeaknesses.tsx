
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useQuests } from '@/hooks/useQuests';
import { useAuth } from '@/contexts/AuthContext';

// Demo data for non-logged in users
const demoAnalytics = {
  strengths: [
    {
      id: '1',
      topic_name: 'Basic Arithmetic',
      strength_score: 0.85,
      total_attempts: 20,
      correct_attempts: 17,
      subjects: { name: 'Mathematics' }
    },
    {
      id: '2',
      topic_name: 'Reading Comprehension',
      strength_score: 0.90,
      total_attempts: 15,
      correct_attempts: 14,
      subjects: { name: 'English' }
    },
    {
      id: '3',
      topic_name: 'Chemical Reactions',
      strength_score: 0.75,
      total_attempts: 12,
      correct_attempts: 9,
      subjects: { name: 'Science' }
    }
  ],
  weaknesses: [
    {
      id: '4',
      topic_name: 'Algebra',
      strength_score: 0.35,
      total_attempts: 15,
      correct_attempts: 5,
      subjects: { name: 'Mathematics' }
    },
    {
      id: '5',
      topic_name: 'Essay Writing',
      strength_score: 0.40,
      total_attempts: 10,
      correct_attempts: 4,
      subjects: { name: 'English' }
    },
    {
      id: '6',
      topic_name: 'Physics Concepts',
      strength_score: 0.30,
      total_attempts: 18,
      correct_attempts: 5,
      subjects: { name: 'Science' }
    }
  ]
};

export const StrengthsWeaknesses = () => {
  const { user } = useAuth();
  const { strengths, weaknesses, isLoading } = useQuests();

  // Use demo data if user is not logged in
  const displayStrengths = user ? strengths : demoAnalytics.strengths;
  const displayWeaknesses = user ? weaknesses : demoAnalytics.weaknesses;
  const displayLoading = user ? isLoading : false;

  if (displayLoading) {
    return <div className="animate-pulse">Loading analytics...</div>;
  }

  const formatPercentage = (score: number) => Math.round(score * 100);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Strengths */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Strengths
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayStrengths.length > 0 ? (
            <div className="space-y-4">
              {displayStrengths.map((strength) => (
                <div key={strength.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{strength.topic_name}</h4>
                      <p className="text-sm text-gray-600">{strength.subjects?.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {formatPercentage(strength.strength_score)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {strength.correct_attempts}/{strength.total_attempts} correct
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
            <p className="text-gray-500 text-center py-4">
              Complete some lessons to see your strengths!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Weaknesses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            Areas for Improvement
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayWeaknesses.length > 0 ? (
            <div className="space-y-4">
              {displayWeaknesses.map((weakness) => (
                <div key={weakness.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{weakness.topic_name}</h4>
                      <p className="text-sm text-gray-600">{weakness.subjects?.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600">
                        {formatPercentage(weakness.strength_score)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {weakness.correct_attempts}/{weakness.total_attempts} correct
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
            <p className="text-gray-500 text-center py-4">
              Complete some lessons to identify areas for improvement!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
