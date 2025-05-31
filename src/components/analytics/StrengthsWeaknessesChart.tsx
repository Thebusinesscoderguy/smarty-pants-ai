
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SubjectData {
  subject: string;
  strength_score: number;
  weakness_score: number;
  performance: number;
}

interface StrengthsWeaknessesChartProps {
  studentId: string;
  studentName: string;
  data: SubjectData[];
}

export const StrengthsWeaknessesChart = ({ studentId, studentName, data }: StrengthsWeaknessesChartProps) => {
  const getBarColor = (performance: number) => {
    if (performance >= 80) return '#10b981'; // green
    if (performance >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <Card className="bg-white/10 border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="h-5 w-5" />
          {studentName} - Strengths & Weaknesses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="subject" 
                stroke="#9ca3af"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#fff'
                }}
                formatter={(value: number, name: string) => [
                  `${value}%`, 
                  name === 'performance' ? 'Performance' : name
                ]}
              />
              <Bar dataKey="performance" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.performance)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <div>
              <p className="text-sm text-gray-400">Top Strength</p>
              <p className="font-medium text-white">
                {data.length > 0 ? data.reduce((prev, current) => 
                  prev.performance > current.performance ? prev : current
                ).subject : 'No data'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <div>
              <p className="text-sm text-gray-400">Needs Improvement</p>
              <p className="font-medium text-white">
                {data.length > 0 ? data.reduce((prev, current) => 
                  prev.performance < current.performance ? prev : current
                ).subject : 'No data'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
