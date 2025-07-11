import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import type { TestSuite } from '@/utils/systemTester';

const TestResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const testResults = location.state?.testResults as TestSuite[] || [];

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

  const totalTests = testResults.reduce((sum, suite) => sum + suite.totalTests, 0);
  const passedTests = testResults.reduce((sum, suite) => sum + suite.passedTests, 0);
  const failedTests = testResults.reduce((sum, suite) => sum + suite.failedTests, 0);
  const skippedTests = testResults.reduce((sum, suite) => sum + suite.skippedTests, 0);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar />
      
      <div className="flex-1 overflow-hidden">
        <header className="p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/system-test')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Tests
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Test Results</h1>
              <p className="text-muted-foreground mt-1">
                Complete test execution results
              </p>
            </div>
          </div>
        </header>
        
        <main className="p-6">
          {/* Summary Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
              <CardDescription>Overall test execution results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {totalTests} Total Tests
                </Badge>
                <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
                  {passedTests} Passed
                </Badge>
                {failedTests > 0 && (
                  <Badge className="bg-red-100 text-red-800 text-lg px-4 py-2">
                    {failedTests} Failed
                  </Badge>
                )}
                {skippedTests > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-lg px-4 py-2">
                    {skippedTests} Skipped
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResults.length > 0 ? (
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
                          className="flex items-start justify-between p-3 border rounded-lg bg-card"
                        >
                          <div className="flex items-start gap-3 flex-1">
                            {getStatusIcon(result.status)}
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{result.name}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(result.status)}>
                              {result.status}
                            </Badge>
                            {result.duration && (
                              <span className="text-xs text-muted-foreground">
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
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No test results available</p>
                <Button 
                  onClick={() => navigate('/system-test')} 
                  className="mt-4"
                >
                  Run Tests
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default TestResults;