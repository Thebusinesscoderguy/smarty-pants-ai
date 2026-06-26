
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TopicData {
  topic: string;
  past_score: number;
  current_score: number;
  improvement: number;
}

interface StrengthsWeaknessesChartProps {
  studentId: string;
  studentName: string;
  data: TopicData[];
}

export const StrengthsWeaknessesChart = ({ studentId, studentName, data }: StrengthsWeaknessesChartProps) => {
  const { t } = useLanguage();
  const getBarColor = (current: number, past: number) => {
    if (current > past) return '#10b981'; // green for improvement
    if (current < past) return '#ef4444'; // red for decline
    return '#f59e0b'; // yellow for no change
  };

  const getImprovementIcon = (improvement: number) => {
    if (improvement > 0) return <ArrowUp className="h-4 w-4 text-green-400" />;
    if (improvement < 0) return <ArrowDown className="h-4 w-4 text-red-400" />;
    return <div className="h-4 w-4" />; // empty space for no change
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-white">{label}</p>
          <p className="text-sm text-gray-300">
            {t('swc.past')} <span className="text-violet-400">{data.past_score}%</span>
          </p>
          <p className="text-sm text-gray-300">
            {t('swc.current')} <span className="text-blue-400">{data.current_score}%</span>
          </p>
          <p className="text-sm">
            {t('swc.change')} <span className={data.improvement >= 0 ? 'text-green-400' : 'text-red-400'}>
              {data.improvement > 0 ? '+' : ''}{data.improvement}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <TrendingUp className="h-5 w-5" />
          {studentName} - {t('swc.titleSuffix')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="topic" 
                stroke="#9ca3af"
                fontSize={11}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="past_score" fill="#f59e0b" name={t('swc.pastPerformance')} opacity={0.6} />
              <Bar dataKey="current_score" name={t('swc.currentPerformance')}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.current_score, entry.past_score)} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-medium text-foreground mb-3">{t('swc.topicDetails')}</h3>
          {data.map((topic, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                {getImprovementIcon(topic.improvement)}
                <div>
                  <p className="font-medium text-foreground">{topic.topic}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('swc.was')} {topic.past_score}% → {t('swc.now')} {topic.current_score}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${topic.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {topic.improvement > 0 ? '+' : ''}{topic.improvement}%
                </p>
                <p className="text-xs text-muted-foreground">{t('swc.changeWord')}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">{t('swc.mostImproved')}</p>
              <p className="font-medium text-foreground">
                {data.length > 0 ? data.reduce((prev, current) =>
                  prev.improvement > current.improvement ? prev : current
                ).topic : t('swc.noData')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-sm text-muted-foreground">{t('swc.needsFocus')}</p>
              <p className="font-medium text-foreground">
                {data.length > 0 ? data.reduce((prev, current) =>
                  prev.improvement < current.improvement ? prev : current
                ).topic : t('swc.noData')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
