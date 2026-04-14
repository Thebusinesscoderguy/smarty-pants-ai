
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from '@/components/ui/use-toast';
import { Settings as SettingsIcon, Users, Baby } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ParentSettings } from '@/components/settings/ParentSettings';
import { ChildSettings } from '@/components/settings/ChildSettings';
import { ReferralProgram } from '@/components/gamification/ReferralProgram';

const Settings = () => {
  const { user } = useAuth();
  const { userRole, loading } = useUserRole();
  const { t } = useLanguage();

  const saveChanges = () => {
    toast({
      title: t('settings.saved'),
      description: t('settings.savedDesc'),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('settings.loading')}</p>
        </div>
      </div>
    );
  }

  const isParent = userRole === 'parent';
  const isChild = userRole === 'student';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="px-4 md:px-6 py-8 md:py-12 max-w-6xl mx-auto">
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-6xl font-bold mb-4 md:mb-6 flex items-center">
            <SettingsIcon className="mr-4 md:mr-6 h-8 md:h-16 w-8 md:w-16 text-primary" />
            {t('settings.title')}
          </h1>
          <p className="text-muted-foreground text-lg md:text-2xl">
            {isParent && t('settings.parentSubtitle')}
            {isChild && t('settings.studentSubtitle')}
            {!isParent && !isChild && t('settings.defaultSubtitle')}
          </p>
        </div>

        {/* Role indicator */}
        <Card className="bg-primary/10 border-primary/30 backdrop-blur-sm rounded-2xl shadow-xl mb-8">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary rounded-xl">
                {isParent ? <Users className="h-6 w-6 text-primary-foreground" /> : <Baby className="h-6 w-6 text-primary-foreground" />}
              </div>
              <div>
                <h3 className="text-foreground font-semibold text-lg">
                  {isParent && t('settings.parentAccount')}
                  {isChild && t('settings.studentAccount')}
                  {!isParent && !isChild && t('settings.userAccount')}
                </h3>
                <p className="text-muted-foreground">
                  {isParent && t('settings.parentAccess')}
                  {isChild && t('settings.studentAccess')}
                  {!isParent && !isChild && t('settings.defaultAccess')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 md:gap-12">
          {isParent && <ParentSettings />}
          {isChild && <ChildSettings />}
          
          {!isParent && !isChild && (
            <div className="space-y-8">
              <ParentSettings />
              <ChildSettings />
            </div>
          )}

          {/* Referral Program */}
          {user && <ReferralProgram />}

          {/* Save Changes Button */}
          <div className="flex justify-center pt-8">
            <Button 
              onClick={saveChanges}
              className="bg-primary hover:bg-primary/90 px-8 md:px-16 py-4 md:py-6 rounded-2xl font-semibold text-lg md:text-xl shadow-2xl"
            >
              {t('settings.saveChanges')}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
