import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  type?: 'strength' | 'weakness' | 'improvement' | 'default';
  showPercentage?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showTrend?: boolean;
  trendDirection?: 'up' | 'down' | 'stable';
}

export const ProgressBar = ({
  value,
  max = 100,
  type = 'default',
  showPercentage = true,
  label,
  size = 'md',
  animated = true,
  showTrend = false,
  trendDirection = 'stable'
}: ProgressBarProps) => {
  const percentage = Math.min((value / max) * 100, 100);

  const getBarColor = () => {
    switch (type) {
      case 'strength':
        return 'bg-gradient-to-r from-green-500 to-emerald-400';
      case 'weakness':
        return 'bg-gradient-to-r from-red-500 to-orange-400';
      case 'improvement':
        return 'bg-gradient-to-r from-blue-500 to-purple-400';
      default:
        return 'bg-gradient-to-r from-primary to-primary-glow';
    }
  };

  const getTrackColor = () => {
    switch (type) {
      case 'strength':
        return 'bg-green-900/30';
      case 'weakness':
        return 'bg-red-900/30';
      case 'improvement':
        return 'bg-blue-900/30';
      default:
        return 'bg-white/10';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-2';
      case 'lg':
        return 'h-4';
      default:
        return 'h-3';
    }
  };

  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      default:
        return '→';
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground font-medium">{label}</span>
          <div className="flex items-center gap-2">
            {showTrend && (
              <span className="text-xs text-muted-foreground">
                {getTrendIcon()}
              </span>
            )}
            {showPercentage && (
              <span className="text-muted-foreground">{Math.round(percentage)}%</span>
            )}
          </div>
        </div>
      )}
      
      <div className={cn(
        "relative w-full rounded-full overflow-hidden",
        getSizeClasses(),
        getTrackColor()
      )}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            getBarColor(),
            animated && "animate-pulse"
          )}
          style={{ 
            width: `${percentage}%`,
            transition: animated ? 'width 1s ease-out' : 'none'
          }}
        />
        
        {/* Glow effect for high values */}
        {percentage >= 80 && type === 'strength' && (
          <div 
            className="absolute top-0 h-full bg-white/20 rounded-full blur-sm"
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>

      {/* Value display for non-percentage cases */}
      {!showPercentage && (
        <div className="text-xs text-muted-foreground text-right">
          {value} / {max}
        </div>
      )}
    </div>
  );
};