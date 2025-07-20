
import React, { useState } from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Volume, VolumeX, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import TokenUsageDisplay from '@/components/voice/TokenUsageDisplay';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const OPENAI_VOICES = [
  { label: 'Alloy (Default)', value: 'alloy' },
  { label: 'Echo', value: 'echo' },
  { label: 'Fable', value: 'fable' },
  { label: 'Onyx', value: 'onyx' },
  { label: 'Nova', value: 'nova' },
  { label: 'Shimmer', value: 'shimmer' },
];

interface VoiceSettingsProps {
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  isQuizMode: boolean;
  setIsQuizMode: (isQuizMode: boolean) => void;
  totalTokensUsed: number;
  monthlyLimit: number;
  inputTokens: number;
  outputTokens: number;
  isTokenLimitReached: boolean;
  isVoiceEnabled: boolean;
  onToggleVoice: () => void;
}

const VoiceSettings = ({
  selectedVoice,
  setSelectedVoice,
  isQuizMode,
  setIsQuizMode,
  totalTokensUsed,
  monthlyLimit,
  inputTokens,
  outputTokens,
  isTokenLimitReached,
  isVoiceEnabled,
  onToggleVoice
}: VoiceSettingsProps) => {
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [testingVoice, setTestingVoice] = useState<string | null>(null);
  const [voiceTestStatus, setVoiceTestStatus] = useState<{[key: string]: 'success' | 'error' | null}>({});
  const { toast } = useToast();
  const { user } = useAuth();

  const testVoice = async (voice: string, showToast: boolean = false) => {
    console.log('🎵 Starting voice test for:', voice);
    console.log('🔐 User authentication status:', { 
      hasUser: !!user, 
      userId: user?.id,
      isAuthenticated: !!user 
    });

    // Check authentication first
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in first to test voice functionality.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingVoice(true);
    setTestingVoice(voice);
    setVoiceTestStatus(prev => ({ ...prev, [voice]: null }));

    if (showToast) {
      toast({
        title: "Testing Voice",
        description: `Testing ${OPENAI_VOICES.find(v => v.value === voice)?.label} voice...`,
      });
    }

    try {
      console.log('🌐 Making request to text-to-voice function...');
      
      const testText = `Hello! This is the ${OPENAI_VOICES.find(v => v.value === voice)?.label} voice. How do I sound?`;
      console.log('🎵 Test text being sent:', testText);
      console.log('🎵 Voice parameter:', voice);
      
      // Get current session info for debugging
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔐 Current session:', { 
        hasSession: !!session, 
        sessionError,
        userId: session?.user?.id 
      });

      const startTime = performance.now();
      
      const response = await supabase.functions.invoke('text-to-voice', {
        body: {
          text: testText,
          voice: voice
        }
      });

      const endTime = performance.now();
      console.log(`📡 Function call completed in ${endTime - startTime}ms`);
      console.log('📡 Full response:', response);
      console.log('📡 Response data:', response.data);
      console.log('📡 Response error:', response.error);
      
      if (response.error) {
        console.error('❌ Supabase Function Error:', response.error);
        throw new Error(`Voice test failed: ${JSON.stringify(response.error)}`);
      }

      const data = response.data;
      console.log('✅ Voice test response received');
      console.log('🎵 Audio data check:', {
        hasAudioContent: !!data?.audioContent,
        audioContentLength: data?.audioContent?.length || 0,
        dataKeys: Object.keys(data || {})
      });

      if (!data?.audioContent) {
        throw new Error('No audio content received from server');
      }

      // Create and play audio with better error handling
      console.log('🎵 Creating audio element...');
      const audio = new Audio();
      
      // Set up comprehensive event listeners for debugging
      audio.addEventListener('loadstart', () => console.log('🎵 Audio loading started'));
      audio.addEventListener('loadeddata', () => console.log('🎵 Audio data loaded'));
      audio.addEventListener('canplay', () => console.log('🎵 Audio can play'));
      audio.addEventListener('canplaythrough', () => console.log('🎵 Audio can play through'));
      audio.addEventListener('playing', () => console.log('🎵 Audio is playing'));
      audio.addEventListener('ended', () => console.log('🎵 Audio ended'));
      audio.addEventListener('pause', () => console.log('🎵 Audio paused'));
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
        
        // If autoplay fails, offer manual download/play option
        if (playError.name === 'NotAllowedError') {
          toast({
            title: "Audio Test Complete",
            description: "Browser blocked auto-play. Audio was generated successfully. Click the audio controls to play manually.",
          });
          
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
          
          setVoiceTestStatus(prev => ({ ...prev, [voice]: 'success' }));
          return;
        } else {
          throw playError;
        }
      }

      setVoiceTestStatus(prev => ({ ...prev, [voice]: 'success' }));
      
      if (showToast) {
        toast({
          title: "Voice Test Successful",
          description: `${OPENAI_VOICES.find(v => v.value === voice)?.label} voice is working perfectly!`,
        });
      }

    } catch (error: any) {
      console.error('❌ Voice test failed with error:', error);
      console.error('❌ Error stack:', error.stack);
      setVoiceTestStatus(prev => ({ ...prev, [voice]: 'error' }));
      
      let errorMessage = 'Unknown error occurred';
      let errorTitle = 'Voice Test Failed';
      
      // Enhanced error categorization
      if (!user) {
        errorTitle = 'Authentication Required';
        errorMessage = 'Please log in to test voice functionality';
      } else if (error.message?.includes('API key') || error.message?.includes('api_key_error')) {
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

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsTestingVoice(false);
      setTestingVoice(null);
      
      // Clear status after 5 seconds
      setTimeout(() => {
        setVoiceTestStatus(prev => ({ ...prev, [voice]: null }));
      }, 5000);
    }
  };

  const getVoiceStatusIcon = (voice: string) => {
    if (testingVoice === voice && isTestingVoice) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
    }
    
    const status = voiceTestStatus[voice];
    if (status === 'success') {
      return <CheckCircle className="h-4 w-4 text-green-400" />;
    } else if (status === 'error') {
      return <XCircle className="h-4 w-4 text-red-400" />;
    }
    
    return null;
  };

  // Show authentication warning if not logged in
  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 mb-2 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span className="font-semibold">Authentication Required</span>
        </div>
        <p className="text-sm text-red-300 text-center">
          Please log in to access voice settings and test voice functionality.
        </p>
        <Button 
          onClick={() => window.location.href = '/auth'}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center gap-4 mb-2">
      <TokenUsageDisplay
        totalTokensUsed={totalTokensUsed}
        monthlyLimit={monthlyLimit}
        inputTokens={inputTokens}
        outputTokens={outputTokens}
      />
      
      <div className="flex items-center gap-2">
        <label htmlFor="voice-toggle" className="text-sm font-medium text-white/80">Voice:</label>
        <Button
          id="voice-toggle"
          variant="outline"
          size="sm"
          onClick={onToggleVoice}
          className={`bg-white/5 border-white/20 hover:bg-white/10 ${isVoiceEnabled ? 'text-green-400' : 'text-red-400'}`}
          disabled={isTokenLimitReached}
        >
          {isVoiceEnabled ? <Volume className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          {isVoiceEnabled ? 'On' : 'Off'}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="voice-select" className="text-sm font-medium text-white/80">Voice Type:</label>
        <Select 
          value={selectedVoice} 
          onValueChange={(value) => {
            console.log('🔄 Voice selection changed to:', value);
            setSelectedVoice(value);
            // Auto-test the new voice when selected (only if authenticated)
            if (user) {
              testVoice(value);
            }
          }} 
          disabled={isTokenLimitReached || isTestingVoice}
        >
          <SelectTrigger 
            id="voice-select" 
            className={`w-[140px] bg-white/5 border-white/20 ${(!isVoiceEnabled || isTestingVoice) ? 'opacity-50' : ''}`}
          >
            <SelectValue placeholder="Choose voice" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 z-50">
            {OPENAI_VOICES.map(voice => (
              <SelectItem key={voice.value} value={voice.value} className="flex items-center justify-between">
                <span>{voice.label}</span>
                {getVoiceStatusIcon(voice.value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedVoice && (
          <div className="flex items-center gap-2">
            {isTestingVoice && testingVoice === selectedVoice ? (
              <span className="text-xs text-blue-400 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Testing...
              </span>
            ) : (
              <>
                {voiceTestStatus[selectedVoice] === 'success' && (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Ready
                  </span>
                )}
                {voiceTestStatus[selectedVoice] === 'error' && (
                  <span className="text-xs text-red-400 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Failed
                  </span>
                )}
                {!voiceTestStatus[selectedVoice] && (
                  <span className="text-xs text-green-400">
                    ✓ {OPENAI_VOICES.find(v => v.value === selectedVoice)?.label}
                  </span>
                )}
              </>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => testVoice(selectedVoice, true)}
              disabled={isTestingVoice || isTokenLimitReached}
              className="bg-white/5 border-white/20 hover:bg-white/10 text-white/80 px-2 py-1 text-xs"
            >
              {isTestingVoice && testingVoice === selectedVoice ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Test'
              )}
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <label htmlFor="quiz-mode" className="text-sm font-medium text-white/80">
          Quiz Mode:
        </label>
        <Select value={isQuizMode ? "on" : "off"} onValueChange={(value) => setIsQuizMode(value === "on")}>
          <SelectTrigger id="quiz-mode" className="w-[100px] bg-white/5 border-white/20">
            <SelectValue placeholder="Quiz Mode" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 z-50">
            <SelectItem value="on">On</SelectItem>
            <SelectItem value="off">Off</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default VoiceSettings;
