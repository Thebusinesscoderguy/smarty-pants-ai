import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Baby } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface RoleSelectorProps {
  onRoleSelected: (role: 'parent' | 'child') => void;
}

export const RoleSelector = ({ onRoleSelected }: RoleSelectorProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleRoleSelection = async (role: 'parent' | 'child') => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update the profile with the selected role
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          role: role === 'parent' ? 'parent' : 'student',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      onRoleSelected(role);
      toast({
        title: t('roleSelector.roleSelected'),
        description: `${t('roleSelector.welcomeRole')} ${role}.`
      });
    } catch (error) {
      console.error('Error setting role:', error);
      toast({
        title: t('roleSelector.error'),
        description: t('roleSelector.errorDescription'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">
            {t('roleSelector.welcome')}
          </h1>
          <p className="text-muted-foreground">
            {t('roleSelector.selectRole')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card 
            className="bg-primary/10 border-primary/30 hover:bg-primary/20 transition-all cursor-pointer group backdrop-blur-sm"
            onClick={() => handleRoleSelection('parent')}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-primary/20 rounded-full w-fit group-hover:bg-primary/30 transition-colors">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>{t('roleSelector.imParent')}</CardTitle>
              <CardDescription>
                {t('roleSelector.parentDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li>• {t('roleSelector.viewRealProgress')}</li>
                <li>• {t('roleSelector.monitorAnalytics')}</li>
                <li>• {t('roleSelector.trackAchievements')}</li>
                <li>• {t('roleSelector.manageStudyPlans')}</li>
              </ul>
              <Button 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoleSelection('parent');
                }}
                disabled={loading}
              >
                {t('roleSelector.continueAsParent')}
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="bg-primary/10 border-primary/30 hover:bg-primary/20 transition-all cursor-pointer group backdrop-blur-sm"
            onClick={() => handleRoleSelection('child')}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-primary/20 rounded-full w-fit group-hover:bg-primary/30 transition-colors">
                <Baby className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>{t('roleSelector.imStudent')}</CardTitle>
              <CardDescription>
                {t('roleSelector.studentDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li>• {t('roleSelector.interactiveChat')}</li>
                <li>• {t('roleSelector.funLearning')}</li>
                <li>• {t('roleSelector.earnAchievements')}</li>
                <li>• {t('roleSelector.completeQuests')}</li>
              </ul>
              <Button 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoleSelection('child');
                }}
                disabled={loading}
              >
                {t('roleSelector.continueAsStudent')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
