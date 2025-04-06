
import { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

const Tokens = () => {
  const { user } = useAuth();
  const [inputTokens, setInputTokens] = useState(0);
  const [outputTokens, setOutputTokens] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const monthlyLimit = 20000;
  
  const totalTokens = inputTokens + outputTokens;
  const usagePercentage = (totalTokens / monthlyLimit) * 100;

  useEffect(() => {
    if (user) {
      fetchTokenUsage();
    }
  }, [user]);

  const fetchTokenUsage = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('token_usage')
        .select('tokens_used, feature')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      if (data) {
        let inputCount = 0;
        let outputCount = 0;
        
        data.forEach(token => {
          if (token.feature === 'user_input') {
            inputCount += token.tokens_used;
          } else {
            outputCount += token.tokens_used;
          }
        });
        
        setInputTokens(inputCount);
        setOutputTokens(outputCount);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching token usage",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col max-h-screen">
        <header className="p-4 border-b border-white/20">
          <h1 className="text-xl font-bold">Token Usage</h1>
        </header>
        
        <main className="flex-1 p-6">
          <Card className="bg-black border border-white/20 text-white mb-6">
            <CardHeader>
              <CardTitle>Monthly Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Usage</span>
                  <span>{isLoading ? 'Loading...' : `${totalTokens} / ${monthlyLimit} tokens`}</span>
                </div>
                <Progress value={isLoading ? 0 : usagePercentage} className="h-2 bg-white/10" />
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-black border border-white/20 text-white">
              <CardHeader>
                <CardTitle>Input Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{isLoading ? 'Loading...' : inputTokens}</div>
                <p className="text-white/70 mt-2">
                  Tokens used for your messages
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-black border border-white/20 text-white">
              <CardHeader>
                <CardTitle>Output Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{isLoading ? 'Loading...' : outputTokens}</div>
                <p className="text-white/70 mt-2">
                  Tokens used for AI responses
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-black border border-white/20 text-white mt-6">
            <CardHeader>
              <CardTitle>Token Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Tokens are the units of measurement for API usage. Each prompt and response consumes tokens based on its length.
              </p>
              <p>
                Your token usage resets at the beginning of each monthly billing cycle.
              </p>
              <p className="text-white/70 text-sm">
                Approximately 1 token = 4 characters or 0.75 words in English.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Tokens;
