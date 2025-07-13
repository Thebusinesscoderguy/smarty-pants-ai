import React from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertCircle, Play, RefreshCw, Activity } from 'lucide-react';

const SystemTest = () => {
  console.log('SystemTest page rendering');

  // Test results data
  const testResults = [
    {
      name: 'Core System Tests',
      results: [
        { name: 'Database Connection', status: 'pass', message: 'Successfully connected to database', duration: 125 },
        { name: 'Authentication Service', status: 'pass', message: 'Auth service responding correctly', duration: 89 },
        { name: 'User Profile Management', status: 'pass', message: 'Profile operations successful', duration: 203 },
        { name: 'File Upload Service', status: 'pass', message: 'File upload working correctly', duration: 156 },
        { name: 'Email Notifications', status: 'pass', message: 'Email service operational', duration: 445 },
      ],
      totalTests: 5,
      passedTests: 5,
      failedTests: 0,
      skippedTests: 0
    },
    {
      name: 'API Integration Tests',
      results: [
        { name: 'OpenAI API Connection', status: 'fail', message: 'API key not configured or invalid', duration: 2034 },
        { name: 'Voice Recognition', status: 'skip', message: 'Skipped due to missing API key', duration: 0 },
        { name: 'Quiz Generator', status: 'fail', message: 'Service timeout after 5 seconds', duration: 5000 },
        { name: 'Real-time Analytics', status: 'skip', message: 'Analytics service unavailable', duration: 0 },
        { name: 'Translation Service', status: 'pass', message: 'Translation API responding', duration: 234 },
      ],
      totalTests: 5,
      passedTests: 1,
      failedTests: 2,
      skippedTests: 2
    },
    {
      name: 'UI Component Tests',
      results: [
        { name: 'Chat Interface', status: 'pass', message: 'Chat components loading correctly', duration: 78 },
        { name: 'Dashboard Components', status: 'pass', message: 'All dashboard elements functional', duration: 156 },
        { name: 'Navigation Menu', status: 'pass', message: 'Navigation working properly', duration: 45 },
        { name: 'Form Validation', status: 'fail', message: 'Some validation rules not working', duration: 189 },
        { name: 'Mobile Responsiveness', status: 'skip', message: 'Mobile testing not configured', duration: 0 },
      ],
      totalTests: 5,
      passedTests: 3,
      failedTests: 1,
      skippedTests: 1
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'skip':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'fail':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'skip':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar />
      
      <div className="flex-1 overflow-hidden">
        <header className="p-6 border-b border-border bg-card">
          <h1 className="text-2xl font-bold text-card-foreground">System Testing</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive testing of all APIs, workflows, and integrations
          </p>
        </header>
        
        <main className="p-6 bg-background">
          <div className="space-y-6">
            {/* Control Panel */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Activity className="h-5 w-5" />
                  System Testing Panel
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  System test results showing passed, failed, and skipped tests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Button className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Play className="h-4 w-4" />
                    Run System Tests
                  </Button>
                  
                  <Button variant="outline" className="flex items-center gap-2 border-border text-foreground hover:bg-accent">
                    <RefreshCw className="h-4 w-4" />
                    Refresh Results
                  </Button>
                  
                  <Button variant="outline" className="flex items-center gap-2 border-border text-foreground hover:bg-accent">
                    <CheckCircle className="h-4 w-4" />
                    Quick Health Check
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Test Results */}
            <div className="space-y-4">
              {testResults.map((suite, suiteIndex) => (
                <Card key={suiteIndex} className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-card-foreground">{suite.name}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="border-border text-foreground">
                          {suite.totalTests} total
                        </Badge>
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                          {suite.passedTests} passed
                        </Badge>
                        {suite.failedTests > 0 && (
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                            {suite.failedTests} failed
                          </Badge>
                        )}
                        {suite.skippedTests > 0 && (
                          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
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
                          className="flex items-start justify-between p-3 border border-border rounded-lg bg-card"
                        >
                          <div className="flex items-start gap-3 flex-1">
                            {getStatusIcon(result.status)}
                            <div className="flex-1">
                              <h4 className="font-medium text-sm text-card-foreground">{result.name}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(result.status)}>
                              {result.status}
                            </Badge>
                            {result.duration !== undefined && (
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default SystemTest;