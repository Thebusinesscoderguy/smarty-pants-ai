import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Volume2, Play, Sparkles, TestTube } from 'lucide-react';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';
import { useLanguage } from '@/contexts/LanguageContext';

// ElevenLabs voices from the useful context
const ELEVENLABS_VOICES = [
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria', description: 'Friendly and energetic' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', description: 'Warm and reassuring' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Clear and professional' },
  { id: 'FGY2WhTYpPnrRacOk9x', name: 'Laura', description: 'Gentle and caring' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', description: 'Playful and fun' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', description: 'Strong and confident' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', description: 'British and sophisticated' },
  { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River', description: 'Calm and flowing' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', description: 'Young and enthusiastic' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', description: 'Sweet and melodic' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', description: 'Curious and bright' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', description: 'Wise and patient' },
  { id: 'bIHbv24MWmeRgasZH58o', name: 'Will', description: 'Encouraging and supportive' },
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', description: 'Cheerful and upbeat' },
  { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric', description: 'Deep and thoughtful' },
  { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris', description: 'Friendly and approachable' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', description: 'Steady and reliable' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', description: 'Articulate and clear' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', description: 'Light and airy' },
  { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill', description: 'Experienced and wise' }
];

export const ChildSettings = () => {
  const { selectedVoice, changeVoice } = useVoiceSettings();
  const { t } = useLanguage();
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  const testVoice = async (voiceId?: string) => {
    const voiceToTest = voiceId || selectedVoice;
    const voiceInfo = ELEVENLABS_VOICES.find(v => v.id === voiceToTest);
    
    setIsTestingVoice(true);
    
    try {
      // For now, we'll use a simple text-to-speech test
      // In the future, this could be replaced with actual ElevenLabs integration
      const testText = `Hi there! I'm ${voiceInfo?.name}. ${voiceInfo?.description}. I'm here to help you learn and have fun together!`;
      
      // Simulate voice testing with browser speech synthesis for now
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(testText);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        speechSynthesis.speak(utterance);
        
        toast({
          title: "Voice Test",
          description: `Testing ${voiceInfo?.name} voice...`,
        });
      } else {
        toast({
          title: "Voice Preview",
          description: `Selected voice: ${voiceInfo?.name} - ${voiceInfo?.description}`,
        });
      }
    } catch (error) {
      console.error('Voice test error:', error);
      toast({
        title: "Voice Test Failed",
        description: "Could not test voice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTestingVoice(false);
    }
  };

  const handleVoiceChange = (voiceId: string) => {
    changeVoice(voiceId);
    toast({
      title: "Voice Changed",
      description: `Selected ${ELEVENLABS_VOICES.find(v => v.id === voiceId)?.name} voice`,
    });
  };

  const currentVoice = ELEVENLABS_VOICES.find(v => v.id === selectedVoice) || ELEVENLABS_VOICES[0];

  return (
    <div className="space-y-8">
      {/* Voice Settings */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 backdrop-blur-sm rounded-3xl shadow-2xl">
        <CardHeader className="pb-6">
          <CardTitle className="text-foreground flex items-center text-2xl">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl mr-4">
              <Volume2 className="h-6 w-6 text-white" />
            </div>
            {t('settings.voice.title')}
          </CardTitle>
          <p className="text-muted-foreground text-lg ml-16">
            {t('settings.voice.subtitle')}
          </p>
        </CardHeader>
        <CardContent className="space-y-6 ml-16">
          <div className="space-y-4">
            <label htmlFor="voice" className="text-foreground font-semibold text-lg">{t('settings.voice.selectFavorite')}</label>
            <Select value={selectedVoice} onValueChange={handleVoiceChange}>
              <SelectTrigger className="bg-muted/50 border-border text-foreground rounded-xl h-14 text-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-60">
                {ELEVENLABS_VOICES.map((voice) => (
                  <SelectItem 
                    key={voice.id} 
                    value={voice.id} 
                    className="text-foreground hover:bg-muted py-3 cursor-pointer"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">{voice.name}</span>
                      <span className="text-sm text-muted-foreground">{voice.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="p-4 bg-purple-500/20 border border-purple-500/30 rounded-xl">
              <p className="text-purple-300 flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                {t('settings.voice.willBeUsed')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Testing */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 backdrop-blur-sm rounded-3xl shadow-2xl">
        <CardHeader className="pb-6">
          <CardTitle className="text-foreground flex items-center text-2xl">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl mr-4">
              <TestTube className="h-6 w-6 text-white" />
            </div>
            {t('settings.voiceTest.title')}
          </CardTitle>
          <p className="text-muted-foreground text-lg ml-16">
            {t('settings.voiceTest.subtitle')}
          </p>
        </CardHeader>
        <CardContent className="space-y-6 ml-16">
          {/* Current Voice */}
          <div className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/30 rounded-lg">
                  <Volume2 className="h-6 w-6 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-foreground font-semibold text-lg">{t('settings.voiceTest.currentVoice')}: {currentVoice.name}</h3>
                  <p className="text-muted-foreground">{currentVoice.description}</p>
                </div>
              </div>
              <Button
                onClick={() => testVoice()}
                disabled={isTestingVoice}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2"
              >
                {isTestingVoice ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    {t('settings.voiceTest.testing')}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {t('settings.voiceTest.testVoice')}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Voice Tests */}
          <div className="space-y-4">
            <h4 className="text-foreground font-semibold text-lg">{t('settings.voiceTest.tryOther')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ELEVENLABS_VOICES.filter(voice => voice.id !== selectedVoice).slice(0, 6).map((voice) => (
                <div 
                  key={voice.id}
                  className="p-4 bg-muted/50 border border-border rounded-lg hover:bg-muted transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-foreground font-medium">{voice.name}</h5>
                      <p className="text-muted-foreground text-sm">{voice.description}</p>
                    </div>
                    <Button
                      onClick={() => testVoice(voice.id)}
                      disabled={isTestingVoice}
                      size="sm"
                      variant="outline"
                      className="bg-muted/50 border-border text-foreground hover:bg-muted group-hover:scale-105 transition-transform"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <p className="text-green-300 text-sm flex items-center">
              <Sparkles className="h-4 w-4 mr-2" />
              {t('settings.voiceTest.saveReminder')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};