import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStreak } from '@/hooks/useStreak';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Share2, Flame, Trophy, Target, BookOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export const ShareableProgressCard = () => {
  const { user } = useAuth();
  const { streak } = useStreak();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState({ quizzesCompleted: 0, questsCompleted: 0, totalXP: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [quizRes, questRes] = await Promise.all([
        supabase.from('quiz_attempts').select('score').eq('user_id', user.id),
        supabase.from('user_quest_progress').select('id').eq('user_id', user.id).eq('completed', true),
      ]);
      const quizXP = (quizRes.data || []).reduce((sum, q) => sum + (q.score || 0), 0);
      const questXP = (questRes.data || []).length * 10;
      setStats({
        quizzesCompleted: quizRes.data?.length || 0,
        questsCompleted: questRes.data?.length || 0,
        totalXP: quizXP + questXP + streak.total_active_days * 5,
      });
    };
    fetchStats();
  }, [user, streak]);

  const generateCard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setGenerating(true);

    const ctx = canvas.getContext('2d')!;
    const w = 600, h = 400;
    canvas.width = w;
    canvas.height = h;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(0.5, '#16213e');
    grad.addColorStop(1, '#0f3460');
    ctx.fillStyle = grad;
    ctx.roundRect(0, 0, w, h, 20);
    ctx.fill();

    // Decorative circles
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#e94560';
    ctx.beginPath(); ctx.arc(500, 50, 100, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#533483';
    ctx.beginPath(); ctx.arc(100, 350, 80, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // Brand
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('TEACHLY AI', 30, 40);

    // Name
    const profile = await supabase.from('profiles').select('display_name').eq('id', user!.id).single();
    const name = profile.data?.display_name || 'Student';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText(name, 30, 90);

    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#aaaacc';
    ctx.fillText('Learning Progress Report', 30, 115);

    // Stats grid
    const statsData = [
      { icon: '🔥', label: 'Day Streak', value: streak.current_streak.toString() },
      { icon: '🏆', label: 'Best Streak', value: streak.longest_streak.toString() },
      { icon: '📝', label: 'Quizzes', value: stats.quizzesCompleted.toString() },
      { icon: '⭐', label: 'Quests', value: stats.questsCompleted.toString() },
    ];

    statsData.forEach((s, i) => {
      const x = 30 + (i % 2) * 270;
      const y = 150 + Math.floor(i / 2) * 90;

      // Card bg
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.roundRect(x, y, 250, 70, 12);
      ctx.fill();

      ctx.font = '24px system-ui, sans-serif';
      ctx.fillText(s.icon, x + 15, y + 40);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.fillText(s.value, x + 55, y + 35);

      ctx.fillStyle = '#8888aa';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(s.label, x + 55, y + 55);
    });

    // XP badge
    ctx.fillStyle = '#e94560';
    ctx.roundRect(30, 345, 120, 35, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(`${stats.totalXP} XP`, 55, 368);

    // Date
    ctx.fillStyle = '#666688';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), 430, 375);

    setGenerating(false);
  }, [user, streak, stats]);

  useEffect(() => {
    if (user) generateCard();
  }, [generateCard, user]);

  const downloadCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'teachly-progress.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast({ title: 'Downloaded!', description: 'Share it on social media 🎉' });
  };

  const shareCard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'teachly-progress.png', { type: 'image/png' });
        if (navigator.share) {
          await navigator.share({ files: [file], title: 'My Teachly Progress', text: 'Check out my learning progress on Teachly AI!' });
        } else {
          downloadCard();
        }
      });
    } catch {
      downloadCard();
    }
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Share2 className="h-5 w-5" />
          Share Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg border border-border"
          style={{ maxWidth: 600, aspectRatio: '3/2' }}
        />
        <div className="flex gap-2">
          <Button onClick={downloadCard} variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" /> Download
          </Button>
          <Button onClick={shareCard} className="flex-1">
            <Share2 className="h-4 w-4 mr-2" /> Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
