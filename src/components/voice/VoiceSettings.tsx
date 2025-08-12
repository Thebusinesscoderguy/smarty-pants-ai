import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useVoiceSettings } from '@/hooks/useVoiceSettings';

const VOICE_OPTIONS = [
  { value: 'alloy', label: 'Alloy (OpenAI)' },
  { value: 'echo', label: 'Echo (OpenAI)' },
  { value: 'fable', label: 'Fable (OpenAI)' },
  { value: 'onyx', label: 'Onyx (OpenAI)' },
  { value: 'nova', label: 'Nova (OpenAI)' },
  { value: 'shimmer', label: 'Shimmer (OpenAI)' },
];

const VoiceSettings: React.FC = () => {
  const { isVoiceEnabled, toggleVoice, selectedVoice, changeVoice } = useVoiceSettings();

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="voice-enabled">Enable voice responses</Label>
        </div>
        <Switch id="voice-enabled" checked={isVoiceEnabled} onCheckedChange={toggleVoice} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="voice-select">Voice</Label>
        <Select value={selectedVoice} onValueChange={changeVoice}>
          <SelectTrigger id="voice-select">
            <SelectValue placeholder="Select a voice" />
          </SelectTrigger>
          <SelectContent>
            {VOICE_OPTIONS.map((v) => (
              <SelectItem key={v.value} value={v.value}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
};

export default VoiceSettings;
