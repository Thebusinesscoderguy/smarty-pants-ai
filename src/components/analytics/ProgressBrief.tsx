
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, Target, TrendingUp } from 'lucide-react';

interface ProgressBriefProps {
  studentName: string;
  completionPercentage: number;
  totalTimeSpent: number;
  strengths: string[];
  weakAreas: string[];
  lastActivity: string;
}

export const ProgressBrief = ({ 
  studentName, 
  completionPercentage, 
  totalTimeSpent, 
  strengths, 
  weakAreas, 
  lastActivity 
}: ProgressBriefProps) => {
  
  const generateBrief = () => {
    const hoursSpent = Math.round(totalTimeSpent / 60);
    const performanceLevel = completionPercentage >= 80 ? 'excellent' : 
                           completionPercentage >= 60 ? 'good' : 'needs improvement';
    
    const strengthText = strengths.length > 0 ? 
      `showing particular strength in ${strengths.slice(0, 2).join(' and ')}` : 
      'building foundational skills across subjects';
    
    const weaknessText = weakAreas.length > 0 ? 
      `Areas for focused attention include ${weakAreas.slice(0, 2).join(' and ')}.` : 
      'No significant weak areas identified.';
    
    const activityText = lastActivity ? 
      `Last active ${new Date(lastActivity).toLocaleDateString()}.` : 
      'No recent activity recorded.';

    return `${studentName} has achieved ${completionPercentage}% completion with ${performanceLevel} performance over ${hoursSpent} hours of study time, ${strengthText}. ${weaknessText} ${activityText} Continue encouraging consistent practice and consider additional support in challenging areas to maintain steady progress.`;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileText className="h-5 w-5" />
          Progress Brief - {studentName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Completion</p>
              <p className="font-medium text-foreground">{completionPercentage}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Study Time</p>
              <p className="font-medium text-foreground">{Math.round(totalTimeSpent / 60)}h</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Strengths</p>
              <p className="font-medium text-foreground">{strengths.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-xs text-muted-foreground">Focus Areas</p>
              <p className="font-medium text-foreground">{weakAreas.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-muted rounded-lg p-4">
          <p className="text-foreground leading-relaxed">
            {generateBrief()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
