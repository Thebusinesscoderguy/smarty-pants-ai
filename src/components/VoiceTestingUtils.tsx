
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const testVoiceSystem = async (voice: string = 'alloy', showToast: boolean = true) => {
  console.log('🎵 Testing voice system with voice:', voice);
  
  if (showToast) {
    toast({
      title: "Testing Voice System",
      description: `Testing ${voice} voice...`,
    });
  }

  try {
    const testText = `Hello! This is a test of the ${voice} voice. The system is working correctly!`;
    console.log('🎵 Sending test text:', testText);
    
    const startTime = performance.now();
    
    const response = await supabase.functions.invoke('text-to-voice', {
      body: {
        text: testText,
        voice: voice
      }
    });

    const endTime = performance.now();
    console.log(`📡 Voice test completed in ${endTime - startTime}ms`);
    console.log('📡 Response:', response);
    
    if (response.error) {
      console.error('❌ Voice test failed:', response.error);
      throw new Error(`Voice test failed: ${JSON.stringify(response.error)}`);
    }

    const data = response.data;
    console.log('✅ Voice test response received');
    
    if (!data?.audioContent) {
      throw new Error('No audio content received from server');
    }

    // Create and play audio
    console.log('🎵 Creating audio element...');
    const audio = new Audio();
    const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
    audio.src = audioSrc;

    try {
      await audio.play();
      console.log('🎵 Audio played successfully');
      
      if (showToast) {
        toast({
          title: "Voice Test Successful!",
          description: `${voice} voice is working perfectly!`,
        });
      }
      
      return true;
    } catch (playError) {
      console.error('🎵 Audio play error:', playError);
      
      if (playError.name === 'NotAllowedError') {
        // Create manual audio element for user interaction
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
        
        setTimeout(() => {
          if (document.body.contains(audioElement)) {
            document.body.removeChild(audioElement);
          }
        }, 10000);
        
        if (showToast) {
          toast({
            title: "Voice Generated Successfully",
            description: "Browser blocked auto-play. Click the audio controls to play manually.",
          });
        }
        
        return true;
      } else {
        throw playError;
      }
    }

  } catch (error: any) {
    console.error('❌ Voice test failed:', error);
    
    let errorMessage = 'Unknown error occurred';
    let errorTitle = 'Voice Test Failed';
    
    if (error.message?.includes('API key')) {
      errorTitle = 'API Configuration Error';
      errorMessage = 'OpenAI API key not configured. Please set it in Supabase secrets.';
    } else if (error.message?.includes('rate limit')) {
      errorTitle = 'Rate Limit Exceeded';
      errorMessage = 'Too many requests. Please try again in a few minutes.';
    } else if (error.message?.includes('timeout')) {
      errorTitle = 'Service Timeout';
      errorMessage = 'Voice service timed out. Please try again.';
    } else if (error.message?.includes('network')) {
      errorTitle = 'Network Error';
      errorMessage = 'Network connection issue. Please check your connection.';
    } else {
      errorMessage = error.message || 'Voice test failed. Check console for details.';
    }

    if (showToast) {
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    return false;
  }
};
