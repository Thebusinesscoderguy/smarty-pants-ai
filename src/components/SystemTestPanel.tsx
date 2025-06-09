
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { runSystemTests, quickHealthCheck, type TestSuite, type TestResult } from '@/utils/systemTester';
import { toast } from '@/components/ui/use-toast';

export const SystemTestPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestSuite[]>([]);
  const [healthStatus, setHealthStatus] = useState<{status: string, message: string} | null>(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      toast({
        title: "Starting System Tests",
        description: "Running comprehensive system tests...",
      });

      const results = await runSystemTests();
      setTestResults(results);

      const totalTests = results.reduce((sum, suite) => sum + suite.totalTests, 0);
      const failedTests = results.reduce((sum, suite) => sum + suite.failedTests, 0);

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
      toast({
        title: "Test Execution Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
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
      toast({
        title: "Health Check Failed",
        description: error.message,
        variant: "destructive"
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            System Testing Panel
          </CardTitle>
          <CardDescription>
            Comprehensive testing of all APIs, database operations, and workflows
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
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Quick Health Check
            </Button>
          </div>

          {healthStatus && (
            <div className={`p-3 rounded-lg ${
              healthStatus.status === 'healthy' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {healthStatus.status === 'healthy' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {healthStatus.status === 'healthy' ? 'System Healthy' : 'System Issues Detected'}
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
    </div>
  );
};
