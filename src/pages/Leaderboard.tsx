import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Flame, Medal, Crown, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StreakDisplay } from '@/components/gamification/StreakDisplay';
import { Loader2 } from 'lucide-react';

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="h-6 w-6 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-gray-300" />;
  if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground w-6 text-center">{rank}</span>;
};

const Leaderboard = () => {
  const { entries, loading, userRank } = useLeaderboard();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground">Top learners ranked by XP</p>
        </div>

        {user && (
          <div className="mb-6">
            <StreakDisplay />
            {userRank && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                Your rank: <span className="font-bold text-foreground">#{userRank}</span>
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No entries yet. Start learning to appear on the leaderboard!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = user?.id === entry.user_id;
              return (
                <Card
                  key={entry.user_id}
                  className={`transition-all ${
                    isCurrentUser
                      ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                      : rank <= 3
                      ? 'border-yellow-500/20 bg-yellow-500/5'
                      : ''
                  }`}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-8 flex justify-center">{getRankIcon(rank)}</div>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={entry.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {(entry.display_name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {entry.display_name || 'Anonymous'}
                        {isCurrentUser && <span className="text-primary ml-1">(you)</span>}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {entry.current_streak > 0 && (
                          <span className="flex items-center gap-0.5 text-orange-400">
                            <Flame className="h-3 w-3" /> {entry.current_streak}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-bold">
                      {entry.total_xp} XP
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Leaderboard;
