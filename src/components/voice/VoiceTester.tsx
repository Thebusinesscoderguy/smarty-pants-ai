import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles, Volume2, Loader2, Music2, Mic, PartyPopper } from 'lucide-react';

const OPENAI_VOICES = [
  { value: 'alloy', label: 'Alloy (Default)' },
  { value: 'echo', label: 'Echo' },
  { value: 'fable', label: 'Fable' },
  { value: 'onyx', label: 'Onyx' },
  { value: 'nova', label: 'Nova' },
  { value: 'shimmer', label: 'Shimmer' },
];

const SAMPLE_LINES = [
  "Hi! I'm your study buddy. Ready to learn together?",
  "Great job! Let's try the next question.",
  "Oops, almost there. Want a helpful hint?",
  "Time for a quick quiz! You can do it!",
];

const VoiceTester: React.FC = () => {
  const { selectedVoice, changeVoice } = useVoiceSettings();
  const { toast } = useToast();
  const [lineIndex, setLineIndex] = useState(0);
  const [isTesting, setIsTesting] = useState(false);

  const currentLine = useMemo(() => SAMPLE_LINES[lineIndex], [lineIndex]);

  const cycleLine = () => setLineIndex((i) => (i + 1) % SAMPLE_LINES.length);

  const testCurrent = async () => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: {
          text: currentLine,
          voice: selectedVoice,
        },
      });

      if (error) throw error;

      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        await audio.play();
        toast({ title: 'Playing test line', description: `Voice: ${selectedVoice}` });
      } else {
        throw new Error('No audio returned');
      }
    } catch (e: any) {
      toast({ title: 'Voice test failed', description: e?.message || 'Try again', variant: 'destructive' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="bg-white/5 border-white/15 rounded-2xl">
      <CardContent className="p-5 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-blue-500/20">
            <Volume2 className="h-5 w-5 text-blue-200" />
          </div>
          <div className="text-white font-semibold">Kid‑Friendly Voice Tester</div>
        </div>

        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="space-y-2">
            <label className="text-sm text-white/80">Choose a voice</label>
            <Select value={selectedVoice} onValueChange={changeVoice}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select voice" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900">
                {OPENAI_VOICES.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20 mt-0.5">
                <Sparkles className="h-4 w-4 text-purple-200" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-white/80 mb-2">Sample line</div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-white">
                  “{currentLine}”
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white/90" onClick={cycleLine}>
                    <Music2 className="h-4 w-4 mr-1.5" /> Try another line
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={testCurrent} disabled={isTesting}>
                    {isTesting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Generating…
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-1.5" /> Play sample
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-white/60 mt-2 flex items-center gap-1">
                  <PartyPopper className="h-3.5 w-3.5" /> Tip: Keep volume on and try with headphones for kids.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceTester;
