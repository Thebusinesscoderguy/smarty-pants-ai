
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const VOICE_OPTIONS = [
  { value: 'alloy', label: 'Alloy', description: 'Balanced and neutral' },
  { value: 'echo', label: 'Echo', description: 'Warm and expressive' },
  { value: 'fable', label: 'Fable', description: 'Storytelling voice' },
  { value: 'onyx', label: 'Onyx', description: 'Strong and confident' },
  { value: 'nova', label: 'Nova', description: 'Bright and energetic' },
  { value: 'shimmer', label: 'Shimmer', description: 'Gentle and soothing' }
];

const VoiceTester: React.FC = () => {
  const [selectedVoice, setSelectedVoice] = React.useState('alloy');
  const { toast } = useToast();
  const [isTestingVoice, setIsTestingVoice] = React.useState(false);

  const testVoice = async (voice: string, showToast: boolean = true) => {
    console.log('🎵 Starting voice test for:', voice);
    
    setIsTestingVoice(true);

    if (showToast) {
      toast({
        title: "Testing Voice",
        description: `Testing ${VOICE_OPTIONS.find(v => v.value === voice)?.label} voice...`,
      });
    }

    try {
      const testText = `Hello! This is the ${VOICE_OPTIONS.find(v => v.value === voice)?.label} voice. How do you like it?`;
      console.log('🎵 Test text being sent:', testText);
      
      const startTime = performance.now();
      
      const response = await supabase.functions.invoke('text-to-voice', {
        body: {
          text: testText,
          voice: voice
        }
      });

      const endTime = performance.now();
      console.log(`📡 Function call completed in ${endTime - startTime}ms`);
      console.log('📡 Response:', response);
      
      if (response.error) {
        console.error('❌ Supabase Function Error:', response.error);
        throw new Error(`Voice test failed: ${JSON.stringify(response.error)}`);
      }

      const data = response.data;
      console.log('✅ Voice test response received');
      console.log('🎵 Audio data check:', {
        hasAudioContent: !!data?.audioContent,
        audioContentLength: data?.audioContent?.length || 0
      });

      if (!data?.audioContent) {
        throw new Error('No audio content received from server');
      }

      // Create and play audio with better error handling
      console.log('🎵 Creating audio element...');
      const audio = new Audio();
      
      // Set up event listeners for debugging
      audio.addEventListener('loadstart', () => console.log('🎵 Audio loading started'));
      audio.addEventListener('canplay', () => console.log('🎵 Audio can play'));
      audio.addEventListener('playing', () => console.log('🎵 Audio is playing'));
      audio.addEventListener('ended', () => console.log('🎵 Audio ended'));
      audio.addEventListener('error', (e) => {
        console.error('🎵 Audio error event:', e);
        console.error('🎵 Audio error details:', {
          error: audio.error,
          networkState: audio.networkState,
          readyState: audio.readyState
        });
      });

      // Set audio source
      const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
      console.log('🎵 Setting audio source, first 100 chars:', audioSrc.substring(0, 100));
      audio.src = audioSrc;

      // Try to play with explicit user interaction handling
      try {
        console.log('🎵 Attempting to play audio...');
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          console.log('🎵 Audio playback started successfully');
        }
      } catch (playError) {
        console.error('🎵 Audio play error:', playError);
        
        // If autoplay fails, create a temporary audio element for manual play
        if (playError.name === 'NotAllowedError') {
          if (showToast) {
            toast({
              title: "Voice Test Complete",
              description: "Browser blocked auto-play. Click the audio controls to play manually.",
            });
          }
          
          // Create a temporary audio element that user can interact with
          const audioElement = document.createElement('audio');
          audioElement.src = audioSrc;
          audioElement.controls = true;
          audioElement.style.position = 'fixed';
          audioElement.style.top = '20px';
          audioElement.style.right = '20px';
          audioElement.style.zIndex = '9999';
          audioElement.style.backgroundColor = 'white';
          audioElement.style.border = '2px solid #333';
          audioElement.style.borderRadius = '8px';
          audioElement.style.padding = '10px';
          
          document.body.appendChild(audioElement);
          
          // Remove after 10 seconds
          setTimeout(() => {
            if (document.body.contains(audioElement)) {
              document.body.removeChild(audioElement);
            }
          }, 10000);
          
          return;
        } else {
          throw playError;
        }
      }

      if (showToast) {
        toast({
          title: "Voice Test Successful",
          description: `${VOICE_OPTIONS.find(v => v.value === voice)?.label} voice is working perfectly!`,
        });
      }

    } catch (error: any) {
      console.error('❌ Voice test failed with error:', error);
      
      let errorMessage = 'Unknown error occurred';
      let errorTitle = 'Voice Test Failed';
      
      // Enhanced error categorization
      if (error.message?.includes('API key') || error.message?.includes('api_key_error')) {
        errorTitle = 'API Configuration Error';
        errorMessage = 'OpenAI API key not configured properly. Please contact the administrator.';
      } else if (error.message?.includes('rate limit') || error.message?.includes('rate_limit_error')) {
        errorTitle = 'Rate Limit Exceeded';
        errorMessage = 'Too many requests. Please try again in a few minutes.';
      } else if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        errorTitle = 'Service Timeout';
        errorMessage = 'Voice service is taking too long to respond. Please try again.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorTitle = 'Network Error';
        errorMessage = 'Network connection issue. Please check your internet connection.';
      } else if (error.message?.includes('autoplay') || error.message?.includes('NotAllowedError')) {
        errorTitle = 'Browser Restriction';
        errorMessage = 'Browser blocked audio playback. The voice was generated successfully.';
      } else if (error.message?.includes('No audio content')) {
        errorTitle = 'Audio Generation Failed';
        errorMessage = 'The voice service did not return audio content. Please try again.';
      } else {
        errorMessage = error.message || 'Voice test failed. Please check console for details.';
      }

      if (showToast) {
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsTestingVoice(false);
    }
  };

  const handleVoiceChange = async (voice: string) => {
    console.log('🔄 Voice selection changed to:', voice);
    setSelectedVoice(voice);
    
    // Automatically test the new voice when selected
    await testVoice(voice, false);
    
    toast({
      title: "Voice changed",
      description: `Now using ${VOICE_OPTIONS.find(v => v.value === voice)?.label} voice`,
      duration: 2000,
    });
  };

  const selectedVoiceInfo = VOICE_OPTIONS.find(v => v.value === selectedVoice);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-purple-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-gray-800/90 backdrop-blur-sm border-gray-700 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <Volume2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">AI Chatbot Voice</h1>
            <p className="text-gray-300 text-sm">Choose the perfect voice for your AI learning assistant</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-white font-medium mb-3 block">Select Voice Profile</label>
            <Select value={selectedVoice} onValueChange={handleVoiceChange} disabled={isTestingVoice}>
              <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white">
                <SelectValue>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{selectedVoiceInfo?.label}</span>
                    <span className="text-sm text-gray-400">{selectedVoiceInfo?.description}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {VOICE_OPTIONS.map((voice) => (
                  <SelectItem key={voice.value} value={voice.value} className="text-white hover:bg-gray-600">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{voice.label}</span>
                      <span className="text-sm text-gray-400">{voice.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isTestingVoice && (
            <div className="bg-blue-900/50 rounded-lg p-4 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="text-blue-200 text-sm">Testing {selectedVoiceInfo?.label} voice...</span>
            </div>
          )}

          <div className="bg-blue-900/50 rounded-lg p-4 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="text-blue-200 text-sm">Voice changes will apply to new conversations</span>
          </div>

          <Button 
            onClick={() => testVoice(selectedVoice, true)}
            disabled={isTestingVoice}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-full transition-all duration-200"
          >
            {isTestingVoice ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Testing Voice...
              </>
            ) : (
              'Test Voice Again'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default VoiceTester;
