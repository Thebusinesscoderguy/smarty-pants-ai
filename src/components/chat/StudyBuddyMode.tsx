import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface StudyBuddyModeProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const StudyBuddyMode = ({ enabled, onToggle }: StudyBuddyModeProps) => {
  const { t } = useLanguage();
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
      enabled 
        ? 'bg-primary/10 border-primary/30' 
        : 'bg-muted/50 border-border'
    }`}>
      <Brain className={`h-4 w-4 transition-colors ${enabled ? 'text-primary' : 'text-muted-foreground'}`} />
      <Label htmlFor="study-buddy" className="text-xs font-medium cursor-pointer">
        {t('studyBuddy.label')}
      </Label>
      <Switch
        id="study-buddy"
        checked={enabled}
        onCheckedChange={onToggle}
        className="scale-75"
      />
    </div>
  );
};

export const useStudyBuddyContext = () => {
  const { user } = useAuth();
  const [memory, setMemory] = useState<Record<string, string>>({});
  const [analytics, setAnalytics] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const loadContext = async () => {
      const { data: memData } = await supabase
        .from('study_buddy_memory')
        .select('memory_key, memory_value')
        .eq('user_id', user.id);
      
      if (memData) {
        const mem: Record<string, string> = {};
        memData.forEach(m => { mem[m.memory_key] = m.memory_value; });
        setMemory(mem);
      }

      const { data: analyticsData } = await supabase
        .from('learning_analytics')
        .select('topic_name, strength_score, total_attempts')
        .eq('user_id', user.id)
        .order('last_updated', { ascending: false })
        .limit(20);
      
      if (analyticsData) setAnalytics(analyticsData);
    };

    loadContext();
  }, [user]);

  const saveMemory = async (key: string, value: string) => {
    if (!user) return;
    await supabase
      .from('study_buddy_memory')
      .upsert({ user_id: user.id, memory_key: key, memory_value: value, updated_at: new Date().toISOString() }, 
        { onConflict: 'user_id,memory_key' });
    setMemory(prev => ({ ...prev, [key]: value }));
  };

  const getSystemPrompt = () => {
    const strengths = analytics.filter(a => a.strength_score > 0.7).map(a => a.topic_name);
    const weaknesses = analytics.filter(a => a.strength_score < 0.5).map(a => a.topic_name);
    
    let prompt = 'You are a personalized AI study buddy. You remember the student and adapt to their learning style.\n\n';
    
    if (strengths.length > 0) {
      prompt += `Student's strong topics: ${strengths.join(', ')}.\n`;
    }
    if (weaknesses.length > 0) {
      prompt += `Topics needing improvement: ${weaknesses.join(', ')}. Give extra attention to these.\n`;
    }
    
    Object.entries(memory).forEach(([key, value]) => {
      prompt += `Remembered: ${key} = ${value}\n`;
    });

    prompt += '\nBe encouraging, remember context from the conversation, and adapt explanations based on their level.';
    return prompt;
  };

  return { memory, analytics, saveMemory, getSystemPrompt };
};
