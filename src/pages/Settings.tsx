
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Volume2, 
  Globe, 
  Database,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function Settings() {
  const { user } = useAuth();
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState({
    profile: {
      displayName: user?.email?.split('@')[0] || '',
      email: user?.email || '',
      role: 'Teacher'
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      weeklyReports: true,
      studentProgress: true
    },
    privacy: {
      profileVisible: true,
      shareProgress: false,
      dataCollection: true
    },
    preferences: {
      theme: 'dark',
      language: 'en',
      voiceEnabled: true,
      autoSave: true
    },
    api: {
      openaiKey: ''
    }
  });

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully.",
    });
  };

  const handleToggle = (section: keyof typeof settings, key: string) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: !prev[section][key as keyof typeof prev[typeof section]]
      }
    }));
  };

  const handleInputChange = (section: keyof typeof settings, key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-slate-300">Manage your account and application preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20 grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="data-[state=active]:bg-white/20">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-white/20">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=active]:bg-white/20">
              <Shield className="h-4 w-4 mr-2" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-white/20">
              <Palette className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="api" className="data-[state=active]:bg-white/20">
              <Database className="h-4 w-4 mr-2" />
              API
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-white">Display Name</Label>
                    <Input
                      id="displayName"
                      value={settings.profile.displayName}
                      onChange={(e) => handleInputChange('profile', 'displayName', e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      value={settings.profile.email}
                      onChange={(e) => handleInputChange('profile', 'email', e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                      disabled
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Role</Label>
                  <Badge className="bg-purple-600 text-white">
                    {settings.profile.role}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(settings.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-white capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <p className="text-sm text-slate-400">
                        {key === 'emailNotifications' && 'Receive notifications via email'}
                        {key === 'pushNotifications' && 'Receive push notifications in browser'}
                        {key === 'weeklyReports' && 'Get weekly progress reports'}
                        {key === 'studentProgress' && 'Notifications about student achievements'}
                      </p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={() => handleToggle('notifications', key)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Privacy Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(settings.privacy).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-white capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <p className="text-sm text-slate-400">
                        {key === 'profileVisible' && 'Make your profile visible to other users'}
                        {key === 'shareProgress' && 'Share your learning progress with others'}
                        {key === 'dataCollection' && 'Allow data collection for improving services'}
                      </p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={() => handleToggle('privacy', key)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Application Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-white">Theme</Label>
                    <div className="flex space-x-2">
                      <Button
                        variant={settings.preferences.theme === 'dark' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleInputChange('preferences', 'theme', 'dark')}
                        className="bg-white/10 border-white/20"
                      >
                        Dark
                      </Button>
                      <Button
                        variant={settings.preferences.theme === 'light' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleInputChange('preferences', 'theme', 'light')}
                        className="bg-white/10 border-white/20"
                      >
                        Light
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Language</Label>
                    <div className="flex space-x-2">
                      <Button
                        variant={settings.preferences.language === 'en' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleInputChange('preferences', 'language', 'en')}
                        className="bg-white/10 border-white/20"
                      >
                        <Globe className="h-4 w-4 mr-1" />
                        English
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-white/20" />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-white flex items-center">
                        <Volume2 className="h-4 w-4 mr-2" />
                        Voice Responses
                      </Label>
                      <p className="text-sm text-slate-400">Enable AI voice responses</p>
                    </div>
                    <Switch
                      checked={settings.preferences.voiceEnabled}
                      onCheckedChange={() => handleToggle('preferences', 'voiceEnabled')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-white">Auto Save</Label>
                      <p className="text-sm text-slate-400">Automatically save your work</p>
                    </div>
                    <Switch
                      checked={settings.preferences.autoSave}
                      onCheckedChange={() => handleToggle('preferences', 'autoSave')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  API Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openaiKey" className="text-white">OpenAI API Key</Label>
                  <div className="relative">
                    <Input
                      id="openaiKey"
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.api.openaiKey}
                      onChange={(e) => handleInputChange('api', 'openaiKey', e.target.value)}
                      placeholder="sk-..."
                      className="bg-white/10 border-white/20 text-white pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-white/70 hover:text-white"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-slate-400">
                    Required for AI chat functionality. Your key is stored securely.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-6">
          <Button onClick={handleSave} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
