
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Settings as SettingsIcon, Volume2, UserX, CreditCard, Users } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const [selectedVoice, setSelectedVoice] = useState('alloy');

  const VOICE_OPTIONS = [
    { value: 'alloy', label: 'Alloy (Default)' },
    { value: 'echo', label: 'Echo' },
    { value: 'fable', label: 'Fable' },
    { value: 'onyx', label: 'Onyx' },
    { value: 'nova', label: 'Nova' },
    { value: 'shimmer', label: 'Shimmer' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex flex-col">
      <Header />
      
      <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center">
              <SettingsIcon className="mr-3 h-10 w-10" />
              Settings
            </h1>
            <p className="text-gray-300 text-lg">
              Manage your AI chatbot voice and account settings
            </p>
          </div>

          <div className="grid gap-6">
            {/* Voice Settings */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Volume2 className="mr-2 h-5 w-5" />
                  AI Chatbot Voice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="voice" className="text-white">Select Voice</label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICE_OPTIONS.map((voice) => (
                        <SelectItem key={voice.value} value={voice.value}>
                          {voice.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-white/70">
                    Choose the voice for your AI learning assistant
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <UserX className="mr-2 h-5 w-5" />
                  Account Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col space-y-3">
                  <Button 
                    variant="outline" 
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex items-center justify-start"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Cancel Subscription
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex items-center justify-start"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Remove Student
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    className="bg-red-600 hover:bg-red-700 flex items-center justify-start"
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Save Changes */}
            <div className="flex justify-end">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
