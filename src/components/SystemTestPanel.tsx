
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Play, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { runSystemTests, quickHealthCheck, type TestSuite, type TestResult } from '@/utils/systemTester';
import { toast } from '@/components/ui/use-toast';

export const SystemTestPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestSuite[]>([]);
  const [healthStatus, setHealthStatus] = useState<{status: string, message: string} | null>(null);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleRunTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCurrentTest('');
    setProgress({ current: 0, total: 0 });
    
    try {
      toast({
        title: "Starting System Tests",
        description: "Running comprehensive system tests with timeouts...",
      });

      // Create a new SystemTester with progress callback
      const { SystemTester } = await import('@/utils/systemTester');
      const tester = new SystemTester((testName: string, current: number, total: number) => {
        setCurrentTest(testName);
        setProgress({ current, total });
      });

      // Run tests with a master timeout to prevent hanging
      const timeoutPromise = new Promise<TestResult[]>((_, reject) => {
        setTimeout(() => reject(new Error("Overall test suite timed out after 60 seconds")), 60000);
      });

      const results = await Promise.race([
        tester.runAllTests(),
        timeoutPromise
      ]);

      const suiteResults = [{
        name: 'System Tests',
        results: results,
        totalTests: results.length,
        passedTests: results.filter(r => r.status === 'pass').length,
        failedTests: results.filter(r => r.status === 'fail').length,
        skippedTests: results.filter(r => r.status === 'skip').length
      }];

      setTestResults(suiteResults);

      const totalTests = suiteResults.reduce((sum, suite) => sum + suite.totalTests, 0);
      const failedTests = suiteResults.reduce((sum, suite) => sum + suite.failedTests, 0);

      if (failedTests > 0) {
        toast({
          title: "Tests Completed with Issues",
          description: `${failedTests} out of ${totalTests} tests failed. Check results below.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "All Tests Passed!",
          description: `${totalTests} tests completed successfully.`,
        });
      }
    } catch (error: any) {
      console.error("Test execution error:", error);
      toast({
        title: "Test Execution Failed",
        description: error.message,
        variant: "destructive"
      });
      
      // Add any partial results we might have
      if (testResults.length === 0) {
        const partialResults = [{
          name: 'System Tests (Incomplete)',
          results: [],
          totalTests: 0,
          passedTests: 0,
          failedTests: 0,
          skippedTests: 0
        }];
        setTestResults(partialResults);
      }
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleQuickHealthCheck = async () => {
    try {
      const result = await quickHealthCheck();
      setHealthStatus(result);
      
      toast({
        title: "Health Check Complete",
        description: result.message,
        variant: result.status === 'healthy' ? 'default' : 'destructive'
      });
    } catch (error: any) {
      console.error("Health check error:", error);
      toast({
        title: "Health Check Failed",
        description: error.message,
        variant: "destructive"
      });
      
      setHealthStatus({
        status: 'error',
        message: `Health check failed to complete: ${error.message}`
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'skip':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
      case 'skip':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            System Testing Panel
          </CardTitle>
          <CardDescription>
            Comprehensive testing of all APIs, database operations, and workflows with timeouts and progress tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={handleRunTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Full Test Suite
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleQuickHealthCheck}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Quick Health Check
            </Button>
          </div>

          {isRunning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {currentTest || 'Initializing tests...'}
                </span>
                <span className="text-gray-500">
                  {progress.current}/{progress.total}
                </span>
              </div>
              <Progress value={progressPercentage} className="w-full" />
            </div>
          )}

          {healthStatus && (
            <div className={`p-3 rounded-lg ${
              healthStatus.status === 'healthy' 
                ? 'bg-green-50 border border-green-200' 
                : healthStatus.status === 'error'
                ? 'bg-yellow-50 border border-yellow-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {healthStatus.status === 'healthy' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : healthStatus.status === 'error' ? (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {healthStatus.status === 'healthy' 
                    ? 'System Healthy' 
                    : healthStatus.status === 'error'
                    ? 'Health Check Error'
                    : 'System Issues Detected'}
                </span>
              </div>
              <p className="text-sm mt-1 text-gray-600">{healthStatus.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <div className="space-y-4">
          {testResults.map((suite, suiteIndex) => (
            <Card key={suiteIndex}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{suite.name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {suite.totalTests} total
                    </Badge>
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
                  {suite.results.map((result, resultIndex) => (
                    <div 
                      key={resultIndex}
                      className="flex items-start justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{result.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                        {result.duration && (
                          <span className="text-xs text-gray-500">
                            {result.duration}ms
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
