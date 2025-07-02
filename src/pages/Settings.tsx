
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Bell, Shield, Palette } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex flex-col">
      <Header />
      
      <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-gray-300 text-lg">
              Customize your learning experience
            </p>
          </div>

          <div className="grid gap-6">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications" className="text-white">
                    Email Notifications
                  </Label>
                  <Switch id="email-notifications" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notifications" className="text-white">
                    Push Notifications
                  </Label>
                  <Switch id="push-notifications" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="public-profile" className="text-white">
                    Public Profile
                  </Label>
                  <Switch id="public-profile" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="data-sharing" className="text-white">
                    Data Sharing
                  </Label>
                  <Switch id="data-sharing" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Palette className="mr-2 h-5 w-5" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dark-mode" className="text-white">
                    Dark Mode
                  </Label>
                  <Switch id="dark-mode" defaultChecked />
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
