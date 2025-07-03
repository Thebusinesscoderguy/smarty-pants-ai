
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Settings as SettingsIcon, Volume2, UserX, CreditCard, Users, Trash2, AlertTriangle, Sparkles } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const [selectedVoice, setSelectedVoice] = useState('alloy');

  const VOICE_OPTIONS = [
    { value: 'alloy', label: 'Alloy (Default)', description: 'Balanced and clear' },
    { value: 'echo', label: 'Echo', description: 'Deep and resonant' },
    { value: 'fable', label: 'Fable', description: 'Warm and storytelling' },
    { value: 'onyx', label: 'Onyx', description: 'Strong and confident' },
    { value: 'nova', label: 'Nova', description: 'Bright and energetic' },
    { value: 'shimmer', label: 'Shimmer', description: 'Gentle and soothing' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <Header />
      
      <main className="px-6 py-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center">
            <SettingsIcon className="mr-4 h-12 w-12 text-blue-400" />
            Settings
          </h1>
          <p className="text-white/70 text-xl">
            Customize your AI learning experience and manage your account
          </p>
        </div>

        <div className="grid gap-8">
          {/* AI Voice Settings */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30 backdrop-blur-sm rounded-2xl shadow-xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-white flex items-center text-2xl">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mr-4">
                  <Volume2 className="h-6 w-6 text-white" />
                </div>
                AI Chatbot Voice
              </CardTitle>
              <p className="text-white/70 text-lg ml-16">
                Choose the perfect voice for your AI learning assistant
              </p>
            </CardHeader>
            <CardContent className="space-y-6 ml-16">
              <div className="space-y-4">
                <label htmlFor="voice" className="text-white font-semibold text-lg">Select Voice Profile</label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="bg-white/10 border-white/30 text-white rounded-xl h-14 text-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {VOICE_OPTIONS.map((voice) => (
                      <SelectItem key={voice.value} value={voice.value} className="text-white hover:bg-white/10">
                        <div className="flex flex-col items-start">
                          <span className="font-semibold">{voice.label}</span>
                          <span className="text-sm text-white/70">{voice.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                  <p className="text-blue-200 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Voice changes will apply to new conversations
                  </p>
                </div>
              </div>
              
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 rounded-xl font-semibold">
                Test Voice
              </Button>
            </CardContent>
          </Card>

          {/* Account Management */}
          <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30 backdrop-blur-sm rounded-2xl shadow-xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-white flex items-center text-2xl">
                <div className="p-3 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl mr-4">
                  <UserX className="h-6 w-6 text-white" />
                </div>
                Account Management
              </CardTitle>
              <p className="text-white/70 text-lg ml-16">
                Manage your subscription and account settings
              </p>
            </CardHeader>
            <CardContent className="space-y-6 ml-16">
              <div className="grid gap-4">
                <div className="p-6 bg-white/5 border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-200 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-orange-500/20 rounded-lg group-hover:scale-110 transition-transform duration-200">
                        <CreditCard className="h-5 w-5 text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg">Cancel Subscription</h3>
                        <p className="text-white/60">End your current subscription plan</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="bg-white/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20 hover:border-orange-500/50"
                    >
                      Cancel Plan
                    </Button>
                  </div>
                </div>

                <div className="p-6 bg-white/5 border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-200 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-500/20 rounded-lg group-hover:scale-110 transition-transform duration-200">
                        <Users className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg">Remove Student</h3>
                        <p className="text-white/60">Remove a student from your account</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="bg-white/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/50"
                    >
                      Manage Students
                    </Button>
                  </div>
                </div>

                <div className="p-6 bg-red-500/10 border-2 border-red-500/30 rounded-xl hover:bg-red-500/20 transition-all duration-200 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-red-500/30 rounded-lg group-hover:scale-110 transition-transform duration-200">
                        <Trash2 className="h-5 w-5 text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-red-300 font-semibold text-lg flex items-center">
                          Delete Account
                          <AlertTriangle className="h-4 w-4 ml-2" />
                        </h3>
                        <p className="text-red-400/80">Permanently delete your account and all data</p>
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      className="bg-red-600 hover:bg-red-700 border-none shadow-lg"
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Changes */}
          <div className="flex justify-center pt-4">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-12 py-4 rounded-xl font-semibold text-lg shadow-xl">
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
