
import { useEffect, useState } from 'react';
import { executeSystemTests } from '@/utils/runSystemTestsDirectly';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';

interface TestResults {
  healthCheck: { status: string; message: string };
  testResults?: any[];
  summary?: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    successRate: number;
  };
  error?: string;
}

export const AutoSystemTest = () => {
  const [results, setResults] = useState<TestResults | null>(null);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    const runTests = async () => {
      console.log('🔄 Auto-executing system tests...');
      const testResults = await executeSystemTests();
      setResults(testResults);
      setIsRunning(false);
    };

    runTests();
  }, []);

  if (isRunning) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Running Comprehensive System Tests...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Testing all APIs, workflows, and integrations. Check console for detailed progress.</p>
        </CardContent>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Test Execution Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Failed to execute system tests. Check console for details.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Health Check Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {results.healthCheck.status === 'healthy' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            System Health Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-3 rounded-lg ${
            results.healthCheck.status === 'healthy' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className="text-sm">{results.healthCheck.message}</p>
          </div>
        </CardContent>
      </Card>

      {/* Test Summary */}
      {results.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{results.summary.totalTests}</div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.summary.passedTests}</div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{results.summary.failedTests}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{results.summary.skippedTests}</div>
                <div className="text-sm text-gray-600">Skipped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{results.summary.successRate}%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results */}
      {results.testResults && results.testResults.length > 0 && (
        <div className="space-y-4">
          {results.testResults.map((suite, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{suite.name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">{suite.totalTests} total</Badge>
                    <Badge className="bg-green-100 text-green-800">
                      {suite.passedTests} passed
                    </Badge>
                    {suite.failedTests > 0 && (
                      <Badge className="bg-red-100 text-red-800">
                        {suite.failedTests} failed
                      </Badge>
                    )}
                    {suite.skippedTests > 0 && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {suite.skippedTests} skipped
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {suite.results.map((result: any, resultIndex: number) => (
                    <div 
                      key={resultIndex}
                      className="flex items-start justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        {result.status === 'pass' && <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />}
                        {result.status === 'fail' && <XCircle className="h-4 w-4 text-red-600 mt-0.5" />}
                        {result.status === 'skip' && <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{result.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          result.status === 'pass' ? 'bg-green-100 text-green-800' :
                          result.status === 'fail' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {result.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {result.duration}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error Display */}
      {results.error && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              System Testing Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <p className="text-sm text-red-800">{results.error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
