
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Loader2 } from 'lucide-react';
import { testVoiceSystem } from './VoiceTestingUtils';

const VoiceQuickTest: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);

  const handleQuickTest = async () => {
    setIsTesting(true);
    try {
      await testVoiceSystem('alloy', true);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Button
      onClick={handleQuickTest}
      disabled={isTesting}
      className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-full transition-all duration-200 flex items-center gap-2"
    >
      {isTesting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Testing...
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4" />
          Quick Voice Test
        </>
      )}
    </Button>
  );
};

export default VoiceQuickTest;
