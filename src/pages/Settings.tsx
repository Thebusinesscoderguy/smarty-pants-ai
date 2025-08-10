
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Volume2, UserX, CreditCard, Users, Trash2, AlertTriangle, Sparkles } from 'lucide-react';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';
import VoiceTester from '@/components/voice/VoiceTester';
const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { selectedVoice, changeVoice } = useVoiceSettings();
  const [isLoading, setIsLoading] = useState(false);

  const VOICE_OPTIONS = [
    { value: 'alloy', label: 'Alloy (Default)', description: 'Balanced and clear' },
    { value: 'echo', label: 'Echo', description: 'Deep and resonant' },
    { value: 'fable', label: 'Fable', description: 'Warm and storytelling' },
    { value: 'onyx', label: 'Onyx', description: 'Strong and confident' },
    { value: 'nova', label: 'Nova', description: 'Bright and energetic' },
    { value: 'shimmer', label: 'Shimmer', description: 'Gentle and soothing' },
  ];

  const testVoice = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: {
          text: `Hello! I'm your AI assistant speaking with the ${VOICE_OPTIONS.find(v => v.value === selectedVoice)?.label} voice. How do I sound?`,
          voice: selectedVoice
        }
      });

      if (error) {
        toast({
          title: "Voice Test Failed",
          description: "Could not test voice. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data && data.audioContent) {
        const binaryString = atob(data.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        audio.onended = () => URL.revokeObjectURL(audioUrl);
        await audio.play();
        
        toast({
          title: "Voice Test",
          description: `Testing ${VOICE_OPTIONS.find(v => v.value === selectedVoice)?.label} voice...`,
        });
      }
    } catch (error) {
      toast({
        title: "Voice Test Failed",
        description: "Could not test voice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStudent = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Student Removed",
        description: "Student has been removed from your account.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    try {
      if (user) {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (error) throw error;
        
        toast({
          title: "Account Deleted",
          description: "Your account has been deleted successfully.",
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveChanges = () => {
    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <Header />
      
      <main className="px-6 py-12 max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center">
            <SettingsIcon className="mr-6 h-16 w-16 text-blue-400" />
            Settings
          </h1>
          <p className="text-white/70 text-2xl">
            Customize your AI learning experience and manage your account
          </p>
        </div>

        <div className="grid gap-12">
          {/* AI Voice Settings */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30 backdrop-blur-sm rounded-3xl shadow-2xl">
            <CardHeader className="pb-8">
              <CardTitle className="text-white flex items-center text-3xl">
                <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mr-6">
                  <Volume2 className="h-8 w-8 text-white" />
                </div>
                AI Chatbot Voice
              </CardTitle>
              <p className="text-white/70 text-xl ml-20">
                Choose the perfect voice for your AI learning assistant
              </p>
            </CardHeader>
            <CardContent className="space-y-8 ml-20">
              <div className="space-y-6">
                <label htmlFor="voice" className="text-white font-semibold text-xl">Select Voice Profile</label>
                <Select value={selectedVoice} onValueChange={changeVoice}>
                  <SelectTrigger className="bg-white/10 border-white/30 text-white rounded-2xl h-16 text-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {VOICE_OPTIONS.map((voice) => (
                      <SelectItem key={voice.value} value={voice.value} className="text-white hover:bg-white/10 py-4">
                        <div className="flex flex-col items-start">
                          <span className="font-semibold text-lg">{voice.label}</span>
                          <span className="text-sm text-white/70">{voice.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="p-6 bg-blue-500/20 border border-blue-500/30 rounded-2xl">
                  <p className="text-blue-200 flex items-center text-lg">
                    <Sparkles className="h-5 w-5 mr-3" />
                    Voice changes will apply to new conversations
                  </p>
                </div>
              </div>
              
              <VoiceTester />
            </CardContent>
          </Card>

          {/* Account Management */}
          <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30 backdrop-blur-sm rounded-3xl shadow-2xl">
            <CardHeader className="pb-8">
              <CardTitle className="text-white flex items-center text-3xl">
                <div className="p-4 bg-gradient-to-r from-red-500 to-orange-600 rounded-2xl mr-6">
                  <UserX className="h-8 w-8 text-white" />
                </div>
                Account Management
              </CardTitle>
              <p className="text-white/70 text-xl ml-20">
                Manage your subscription and account settings
              </p>
            </CardHeader>
            <CardContent className="space-y-8 ml-20">
              <div className="grid gap-6">
                <div className="p-8 bg-white/5 border border-white/20 rounded-2xl hover:bg-white/10 transition-all duration-200 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="p-3 bg-orange-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
                        <CreditCard className="h-6 w-6 text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-xl">Cancel Subscription</h3>
                        <p className="text-white/60 text-lg">End your current subscription plan</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleCancelSubscription}
                      disabled={isLoading}
                      variant="outline" 
                      className="bg-white/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20 hover:border-orange-500/50 px-8 py-3 text-lg"
                    >
                      {isLoading ? 'Cancelling...' : 'Cancel Plan'}
                    </Button>
                  </div>
                </div>

                <div className="p-8 bg-white/5 border border-white/20 rounded-2xl hover:bg-white/10 transition-all duration-200 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="p-3 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
                        <Users className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-xl">Remove Student</h3>
                        <p className="text-white/60 text-lg">Remove a student from your account</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleRemoveStudent}
                      disabled={isLoading}
                      variant="outline" 
                      className="bg-white/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/50 px-8 py-3 text-lg"
                    >
                      {isLoading ? 'Removing...' : 'Manage Students'}
                    </Button>
                  </div>
                </div>

                <div className="p-8 bg-red-500/10 border-2 border-red-500/30 rounded-2xl hover:bg-red-500/20 transition-all duration-200 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="p-3 bg-red-500/30 rounded-xl group-hover:scale-110 transition-transform duration-200">
                        <Trash2 className="h-6 w-6 text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-red-300 font-semibold text-xl flex items-center">
                          Delete Account
                          <AlertTriangle className="h-5 w-5 ml-3" />
                        </h3>
                        <p className="text-red-400/80 text-lg">Permanently delete your account and all data</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleDeleteAccount}
                      disabled={isLoading}
                      variant="destructive" 
                      className="bg-red-600 hover:bg-red-700 border-none shadow-lg px-8 py-3 text-lg"
                    >
                      {isLoading ? 'Deleting...' : 'Delete Account'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Changes */}
          <div className="flex justify-center pt-8">
            <Button 
              onClick={saveChanges}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-16 py-6 rounded-2xl font-semibold text-xl shadow-2xl"
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
