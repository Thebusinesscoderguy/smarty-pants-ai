import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useQuestManagement } from '@/hooks/useQuestManagement';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';

const MadeByMe = () => {
  const navigate = useNavigate();
  const { quests, loading, deleteQuest } = useQuestManagement();

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this quest?')) {
      await deleteQuest(id);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/quests')}
              className="text-foreground hover:bg-muted"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quests
            </Button>
            
            <Button
              onClick={() => navigate('/quests?create=new')}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Quest
            </Button>
          </div>

          <Card className="bg-card border-border backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-foreground">My Created Quests</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : quests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No quests created yet</p>
                  <Button
                    onClick={() => navigate('/quests?create=new')}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Quest
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {quests.map((quest) => (
                    <div
                      key={quest.id}
                      className="bg-muted rounded-lg p-4 border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-foreground font-semibold">{quest.title}</h3>
                            <Badge className={getDifficultyColor(quest.difficulty)}>
                              {quest.difficulty}
                            </Badge>
                            <Badge variant="outline" className="border-border text-foreground">
                              {quest.type}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm mb-2">{quest.description}</p>
                          <p className="text-muted-foreground text-xs">
                            Target: {quest.target_value} | 
                            Rewards: {quest.rewards?.xp || 0} XP
                            {quest.expires_at && ` | Expires: ${new Date(quest.expires_at).toLocaleDateString()}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(quest.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MadeByMe;
