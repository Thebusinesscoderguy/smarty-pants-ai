
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { testVoiceSystem } from './VoiceTestingUtils';

const VoiceSystemStatus: React.FC = () => {
  const [isTestingSystem, setIsTestingSystem] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'unknown' | 'working' | 'failed'>('unknown');
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);

  const runSystemTest = async () => {
    setIsTestingSystem(true);
    try {
      const result = await testVoiceSystem('alloy', false);
      setSystemStatus(result ? 'working' : 'failed');
      setLastTestTime(new Date());
    } catch (error) {
      setSystemStatus('failed');
      setLastTestTime(new Date());
    } finally {
      setIsTestingSystem(false);
    }
  };

  useEffect(() => {
    // Auto-test on component mount
    runSystemTest();
  }, []);

  const getStatusIcon = () => {
    if (isTestingSystem) {
      return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
    }
    
    switch (systemStatus) {
      case 'working':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusText = () => {
    if (isTestingSystem) return 'Testing system...';
    
    switch (systemStatus) {
      case 'working':
        return 'Voice system is working';
      case 'failed':
        return 'Voice system needs attention';
      default:
        return 'Voice system status unknown';
    }
  };

  const getStatusColor = () => {
    if (isTestingSystem) return 'border-blue-500/30 bg-blue-900/20';
    
    switch (systemStatus) {
      case 'working':
        return 'border-green-500/30 bg-green-900/20';
      case 'failed':
        return 'border-red-500/30 bg-red-900/20';
      default:
        return 'border-yellow-500/30 bg-yellow-900/20';
    }
  };

  return (
    <Card className={`p-4 ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <div className="text-white font-medium">{getStatusText()}</div>
            {lastTestTime && (
              <div className="text-sm text-gray-400">
                Last tested: {lastTestTime.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
        
        <Button
          onClick={runSystemTest}
          disabled={isTestingSystem}
          variant="outline"
          size="sm"
          className="bg-white/5 border-white/20 hover:bg-white/10 text-white"
        >
          {isTestingSystem ? 'Testing...' : 'Test Again'}
        </Button>
      </div>
    </Card>
  );
};

export default VoiceSystemStatus;
