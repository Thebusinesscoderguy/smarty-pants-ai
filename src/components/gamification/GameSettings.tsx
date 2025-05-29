
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Settings, Trophy, Users } from 'lucide-react';

export const GameSettings = () => {
  const [gamificationEnabled, setGamificationEnabled] = useState(true);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('gamification_enabled, leaderboard_visible')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setGamificationEnabled(data.gamification_enabled ?? true);
        setLeaderboardVisible(data.leaderboard_visible ?? false);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          gamification_enabled: gamificationEnabled,
          leaderboard_visible: leaderboardVisible,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your gamification preferences have been updated.",
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Gamification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label htmlFor="gamification" className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Enable Gamification
              </Label>
              <p className="text-sm text-gray-600">
                Show achievements, levels, and progress rewards
              </p>
            </div>
            <Switch
              id="gamification"
              checked={gamificationEnabled}
              onCheckedChange={setGamificationEnabled}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label htmlFor="leaderboard" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Show on Leaderboard
              </Label>
              <p className="text-sm text-gray-600">
                Allow others to see your progress on the leaderboard
              </p>
            </div>
            <Switch
              id="leaderboard"
              checked={leaderboardVisible}
              onCheckedChange={setLeaderboardVisible}
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={saveSettings} 
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <p className="font-medium mb-1">Privacy Note:</p>
          <p>
            Your learning progress remains private by default. Leaderboard participation 
            is optional and uses anonymous nicknames for privacy protection.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
