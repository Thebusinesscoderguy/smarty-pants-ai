import { Flame, Trophy, Calendar } from 'lucide-react';
import { useStreak } from '@/hooks/useStreak';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StreakDisplayProps {
  compact?: boolean;
  className?: string;
}

export const StreakDisplay = ({ compact = false, className }: StreakDisplayProps) => {
  const { streak, loading } = useStreak();

  if (loading) return null;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1.5 text-orange-400", className)}>
        <Flame className={cn("h-5 w-5", streak.current_streak > 0 && "text-orange-500 animate-pulse")} />
        <span className="font-bold text-sm">{streak.current_streak}</span>
      </div>
    );
  }

  return (
    <Card className={cn("bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full",
              streak.current_streak > 0
                ? "bg-orange-500/30 text-orange-400"
                : "bg-muted text-muted-foreground"
            )}>
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{streak.current_streak}</p>
              <p className="text-xs text-muted-foreground">Day streak</p>
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <div className="flex items-center gap-1 text-yellow-400">
                <Trophy className="h-4 w-4" />
                <span className="font-bold text-sm">{streak.longest_streak}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Best</p>
            </div>
            <div>
              <div className="flex items-center gap-1 text-blue-400">
                <Calendar className="h-4 w-4" />
                <span className="font-bold text-sm">{streak.total_active_days}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Total days</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
