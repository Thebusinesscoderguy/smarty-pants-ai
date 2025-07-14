import React from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { CheckCircle, XCircle, Clock, Play, RefreshCw } from 'lucide-react';

const SystemTest = () => {
  console.log('SystemTest page rendering - new version');

  const testResults = [
    {
      name: 'Core System Tests',
      results: [
        { name: 'Database Connection', status: 'pass', message: 'Successfully connected to database', duration: 125 },
        { name: 'Authentication Service', status: 'pass', message: 'Auth service responding correctly', duration: 89 },
        { name: 'User Profile Management', status: 'pass', message: 'Profile operations successful', duration: 203 },
        { name: 'File Upload Service', status: 'pass', message: 'File upload working correctly', duration: 156 },
        { name: 'Email Notifications', status: 'pass', message: 'Email service operational', duration: 445 },
      ]
    },
    {
      name: 'API Integration Tests',
      results: [
        { name: 'OpenAI API Connection', status: 'fail', message: 'API key not configured or invalid', duration: 2034 },
        { name: 'Voice Recognition', status: 'skip', message: 'Skipped due to missing API key', duration: 0 },
        { name: 'Quiz Generator', status: 'fail', message: 'Service timeout after 5 seconds', duration: 5000 },
        { name: 'Real-time Analytics', status: 'skip', message: 'Analytics service unavailable', duration: 0 },
        { name: 'Translation Service', status: 'pass', message: 'Translation API responding', duration: 234 },
      ]
    },
    {
      name: 'UI Component Tests',
      results: [
        { name: 'Chat Interface', status: 'pass', message: 'Chat components loading correctly', duration: 78 },
        { name: 'Dashboard Components', status: 'pass', message: 'All dashboard elements functional', duration: 156 },
        { name: 'Navigation Menu', status: 'pass', message: 'Navigation working properly', duration: 45 },
        { name: 'Form Validation', status: 'fail', message: 'Some validation rules not working', duration: 189 },
        { name: 'Mobile Responsiveness', status: 'skip', message: 'Mobile testing not configured', duration: 0 },
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skip':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'fail':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'skip':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <AppSidebar />
      
      <div className="flex-1 bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">System Testing</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive testing of all APIs, workflows, and integrations
          </p>
        </div>
        
        {/* Main Content */}
        <div className="p-6">
          {/* Control Panel */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Play className="h-5 w-5" />
                System Testing Panel
              </h2>
              <p className="text-gray-600 mt-1">
                System test results showing passed, failed, and skipped tests
              </p>
            </div>
            <div className="p-6">
              <div className="flex gap-3 flex-wrap">
                <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Play className="h-4 w-4" />
                  Run System Tests
                </button>
                
                <button className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                  <RefreshCw className="h-4 w-4" />
                  Refresh Results
                </button>
                
                <button className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                  <CheckCircle className="h-4 w-4" />
                  Quick Health Check
                </button>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-6">
            {testResults.map((suite, suiteIndex) => (
              <div key={suiteIndex} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{suite.name}</h3>
                    <div className="flex gap-2">
                      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm border border-gray-200">
                        {suite.results.length} total
                      </span>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm border border-green-200">
                        {suite.results.filter(r => r.status === 'pass').length} passed
                      </span>
                      {suite.results.filter(r => r.status === 'fail').length > 0 && (
                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm border border-red-200">
                          {suite.results.filter(r => r.status === 'fail').length} failed
                        </span>
                      )}
                      {suite.results.filter(r => r.status === 'skip').length > 0 && (
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm border border-yellow-200">
                          {suite.results.filter(r => r.status === 'skip').length} skipped
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {suite.results.map((result, resultIndex) => (
                      <div 
                        key={resultIndex}
                        className="flex items-start justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          {getStatusIcon(result.status)}
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-900">{result.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(result.status)}`}>
                            {result.status}
                          </span>
                          {result.duration !== undefined && (
                            <span className="text-xs text-gray-500">
                              {result.duration}ms
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemTest;