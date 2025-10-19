import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQuestManagement } from '@/hooks/useQuestManagement';

const AIGenerateQuest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createQuest } = useQuestManagement();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast({ title: 'Enter a prompt', description: 'Describe what kind of quest you want to create.', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-quest', {
        body: { prompt: prompt.trim(), userId: user?.id }
      });

      if (error) throw error;

      if (data?.quest) {
        await createQuest({
          title: data.quest.title,
          description: data.quest.description,
          type: data.quest.type || 'daily',
          difficulty: data.quest.difficulty || 'medium',
          target_value: data.quest.target_value || 1,
          rewards: data.quest.rewards || { xp: 25 },
          requirements: data.quest.requirements || {},
          assigned_children: null
        });

        toast({ title: 'Quest created!', description: 'Your AI-generated quest has been created.' });
        navigate('/quests/made-by-me');
      } else {
        throw new Error('No quest data returned');
      }
    } catch (error: any) {
      console.error('Error generating quest:', error);
      toast({ 
        title: 'Generation failed', 
        description: error.message || 'Could not generate quest. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/quests')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quests
          </Button>

          <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-blue-400" />
                AI Quest Generator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-white">
                    Describe the quest you want to create
                  </Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., 'Create a daily quest for practicing multiplication tables' or 'Make a weekly reading challenge for middle school students'"
                    required
                    rows={6}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  />
                  <p className="text-sm text-white/60">
                    The AI will generate a complete quest with title, description, difficulty, and rewards.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isGenerating}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isGenerating ? 'Generating...' : 'Generate Quest'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/quests')}
                    className="border-white/20 text-white hover:bg-white/20"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AIGenerateQuest;
