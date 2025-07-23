
import React from 'react';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VoiceTestNavButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate('/voice-test')}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-2"
    >
      <Volume2 className="w-4 h-4" />
      Test Voice
    </Button>
  );
};

export default VoiceTestNavButton;
