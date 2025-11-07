
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
const Settings = () => {
  const { user } = useAuth();
  const { userRole, loading } = useUserRole();
  const { t } = useLanguage();

  const saveChanges = () => {
    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  const isParent = userRole === 'parent';
  const isChild = userRole === 'student'; // Assuming student role means child

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="px-6 py-12 max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-6xl font-bold mb-6 flex items-center">
            <SettingsIcon className="mr-6 h-16 w-16 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground text-2xl">
            {isParent && "Manage your account, subscription, and family settings"}
            {isChild && "Customize your AI learning experience"}
            {!isParent && !isChild && "Customize your learning experience and manage your account"}
          </p>
        </div>

        {/* Role indicator */}
        <Card className="bg-primary/10 border-primary/30 backdrop-blur-sm rounded-2xl shadow-xl mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary rounded-xl">
                {isParent ? <Users className="h-6 w-6 text-primary-foreground" /> : <Baby className="h-6 w-6 text-primary-foreground" />}
              </div>
              <div>
                <h3 className="text-foreground font-semibold text-lg">
                  {isParent && "Parent Account"}
                  {isChild && "Student Account"}
                  {!isParent && !isChild && "User Account"}
                </h3>
                <p className="text-muted-foreground">
                  {isParent && "Access to family management and billing features"}
                  {isChild && "Focus on learning customization and voice settings"}
                  {!isParent && !isChild && "Standard account features"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-12">
          {/* Render different settings based on user role */}
          {isParent && <ParentSettings />}
          {isChild && <ChildSettings />}
          
          {/* Default settings for users without specific roles */}
          {!isParent && !isChild && (
            <div className="space-y-8">
              <ParentSettings />
              <ChildSettings />
            </div>
          )}

          {/* Save Changes Button */}
          <div className="flex justify-center pt-8">
            <Button 
              onClick={saveChanges}
              className="bg-primary hover:bg-primary/90 px-16 py-6 rounded-2xl font-semibold text-xl shadow-2xl"
            >
              Save All Changes
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
