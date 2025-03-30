import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const Tokens = () => {
  // Simulated token data
  const inputTokens = 2345;
  const outputTokens = 8765;
  const totalTokens = inputTokens + outputTokens;
  const monthlyLimit = 20000;
  const usagePercentage = (totalTokens / monthlyLimit) * 100;

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
                  <span>{totalTokens} / {monthlyLimit} tokens</span>
                </div>
                <Progress value={usagePercentage} className="h-2 bg-white/10" />
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-black border border-white/20 text-white">
              <CardHeader>
                <CardTitle>Input Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{inputTokens}</div>
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
                <div className="text-3xl font-bold">{outputTokens}</div>
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
