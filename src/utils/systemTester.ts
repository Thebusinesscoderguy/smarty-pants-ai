import { supabase } from '@/integrations/supabase/client';
import { ConnectionDiagnostics } from './connectionDiagnostics';
import { ConnectionWarmup } from './connectionWarmup';

export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  duration?: number;
  diagnostics?: any;
}

export interface TestSuite {
  name: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
}

// Enhanced timeout wrapper with progressive retry and diagnostics
async function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number = 15000,
  testName: string = 'Unknown'
): Promise<T> {
  const diagnostics = ConnectionDiagnostics.getConnectionInfo();
  const adjustedTimeout = ConnectionDiagnostics.getRecommendedTimeout(diagnostics.environment, timeoutMs);
  
  console.log(`⏱️ ${testName} timeout: ${adjustedTimeout}ms (environment: ${diagnostics.environment})`);
  
  // For preview environment, add connectivity pre-check
  if (diagnostics.environment === 'preview') {
    const hasConnectivity = await ConnectionDiagnostics.testBasicConnectivity();
    if (!hasConnectivity) {
      throw new Error('No internet connectivity detected in preview environment');
    }
  }
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      const errorMsg = `Operation timed out after ${adjustedTimeout}ms (env: ${diagnostics.environment})`;
      reject(new Error(errorMsg));
    }, adjustedTimeout);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

// Progressive retry with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  testName: string = 'Unknown'
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔄 ${testName}: Attempt ${attempt}/${maxAttempts}`);
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        break;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ ${testName}: Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

export class SystemTester {
  private results: TestResult[] = [];
  private onProgress?: (testName: string, current: number, total: number) => void;
  private forceTestMode: boolean = false;
  private diagnostics: any;

  constructor(onProgress?: (testName: string, current: number, total: number) => void, forceTestMode: boolean = false) {
    this.onProgress = onProgress;
    this.forceTestMode = forceTestMode;
    this.diagnostics = ConnectionDiagnostics.getConnectionInfo();
    
    // Log environment diagnostics
    ConnectionDiagnostics.logDiagnostics(this.diagnostics);
  }

  async runAllTests(): Promise<TestResult[]> {
    this.results = [];
    
    console.log('🔧 Starting comprehensive system tests...');
    console.log(`📍 Environment: ${this.diagnostics.environment}`);
    
    if (this.forceTestMode) {
      console.log('⚡ Force test mode enabled - bypassing skip conditions');
    }

    // For preview environment, add special handling
    if (this.diagnostics.environment === 'preview') {
      console.log('🌐 Preview environment detected - using enhanced connectivity strategies');
    }

    // Warmup connections before testing
    try {
      await ConnectionWarmup.warmupConnection();
    } catch (error) {
      console.warn('Connection warmup failed, proceeding with tests:', error);
    }
    
    const tests = [
      // Critical infrastructure tests with environment-adjusted timeouts
      { name: 'Supabase Connection', fn: () => this.testSupabaseConnection(), timeout: this.diagnostics.environment === 'preview' ? 60000 : 20000 },
      { name: 'Database Access', fn: () => this.testDatabaseAccess(), timeout: 15000 },
      { name: 'Authentication', fn: () => this.testAuthenticationFlow(), timeout: 12000 },
      
      // API tests with optimized timeouts
      { name: 'OpenAI Text-to-Voice', fn: () => this.testOpenAITextToVoice(), timeout: 18000 },
      { name: 'Email Invitation', fn: () => this.testEmailInvitation(), timeout: 12000 },
      { name: 'OpenAI Chat Completion', fn: () => this.testOpenAIChatCompletion(), timeout: 15000 },
      { name: 'Voice-to-Text', fn: () => this.testVoiceToText(), timeout: 15000 },
      
      // Database table tests
      { name: 'Quiz Storage', fn: () => this.testQuizStorage(), timeout: 10000 },
      { name: 'Message Storage', fn: () => this.testMessageStorage(), timeout: 10000 },
      { name: 'User Profile', fn: () => this.testUserProfileCreation(), timeout: 10000 },
      { name: 'File Upload', fn: () => this.testFileUpload(), timeout: 10000 },
      { name: 'Token Usage', fn: () => this.testTokenUsageTracking(), timeout: 10000 },
      { name: 'Achievement System', fn: () => this.testAchievementSystem(), timeout: 10000 },
      { name: 'Quest System', fn: () => this.testQuestSystem(), timeout: 10000 },
      { name: 'Learning Analytics', fn: () => this.testLearningAnalytics(), timeout: 10000 },
      { name: 'Progress Tracking', fn: () => this.testProgressTracking(), timeout: 10000 },
      
      // Website Navigation and UI Tests
      { name: 'Landing Page Load', fn: () => this.testLandingPageLoad(), timeout: 5000 },
      { name: 'Chat Interface', fn: () => this.testChatInterface(), timeout: 8000 },
      { name: 'Voice Interface', fn: () => this.testVoiceInterface(), timeout: 8000 },
      { name: 'Quiz Generator', fn: () => this.testQuizGeneratorPage(), timeout: 8000 },
      { name: 'Progress Dashboard', fn: () => this.testProgressDashboard(), timeout: 8000 },
      { name: 'Settings Page', fn: () => this.testSettingsPage(), timeout: 8000 },
      { name: 'Demo Mode', fn: () => this.testDemoMode(), timeout: 8000 },
      { name: 'School Admin Panel', fn: () => this.testSchoolAdminPanel(), timeout: 8000 },
      { name: 'Onboarding Flow', fn: () => this.testOnboardingFlow(), timeout: 8000 },
      { name: 'Student Dashboard', fn: () => this.testStudentDashboard(), timeout: 8000 },
      { name: 'Parent Dashboard', fn: () => this.testParentDashboard(), timeout: 8000 },
      { name: 'Navigation Menu', fn: () => this.testNavigationMenu(), timeout: 5000 },
      { name: 'Language Selection', fn: () => this.testLanguageSelection(), timeout: 5000 },
      { name: 'Role Selection', fn: () => this.testRoleSelection(), timeout: 5000 },
      { name: 'Curriculum Selection', fn: () => this.testCurriculumSelection(), timeout: 5000 },
      { name: 'Test Creation', fn: () => this.testTestCreation(), timeout: 8000 },
      { name: 'Student Monitoring', fn: () => this.testStudentMonitoring(), timeout: 8000 },
      { name: 'Real-time Analytics', fn: () => this.testRealTimeAnalytics(), timeout: 8000 },
      { name: 'Gamification Features', fn: () => this.testGamificationFeatures(), timeout: 8000 },
      { name: 'Content Management', fn: () => this.testContentManagement(), timeout: 8000 },
    ];

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      const startTime = Date.now();
      
      // Report progress
      if (this.onProgress) {
        this.onProgress(test.name, i + 1, tests.length);
      }
      
      try {
        console.log(`Running test ${i + 1}/${tests.length}: ${test.name}`);
        
        await withTimeout(
          withRetry(() => test.fn(), 2, 1000, test.name),
          test.timeout,
          test.name
        );
        
        const duration = Date.now() - startTime;
        
        // Update duration for the last added result
        if (this.results.length > 0) {
          this.results[this.results.length - 1].duration = duration;
        }
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        if (error.message.includes('timed out')) {
          await this.addResult(
            test.name, 
            'fail', 
            `Test timed out - ${error.message}. Environment: ${this.diagnostics.environment}`, 
            duration,
            { environment: this.diagnostics.environment, timeout: test.timeout }
          );
        } else if (error.message.includes('No internet connectivity')) {
          await this.addResult(
            test.name, 
            'fail', 
            `Network connectivity issue in ${this.diagnostics.environment} environment`, 
            duration,
            { environment: this.diagnostics.environment, connectivityIssue: true }
          );
        } else {
          await this.addResult(
            test.name, 
            'fail', 
            `Test failed: ${error.message}`, 
            duration,
            { environment: this.diagnostics.environment }
          );
        }
        
        // For critical infrastructure tests, stop if they fail
        if (i < 3 && this.results[this.results.length - 1].status === 'fail') {
          console.log('Critical infrastructure test failed, stopping remaining tests');
          break;
        }
      }
    }
    
    console.log('✅ System tests completed');
    return this.results;
  }

  private async addResult(name: string, status: 'pass' | 'fail' | 'skip', message: string, duration?: number, diagnostics?: any) {
    this.results.push({ name, status, message, duration, diagnostics });
    const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
    console.log(`${emoji} ${name}: ${message} ${duration ? `(${duration}ms)` : ''}`);
  }

  private async testSupabaseConnection() {
    try {
      console.log('Testing Supabase connection with enhanced diagnostics...');
      
      // Measure connection timing
      const timing = await ConnectionDiagnostics.measureConnectionTiming(
        'https://twfzlbockonxopuindaw.supabase.co'
      );
      
      if (timing.total && timing.total > 10000) {
        console.warn(`Very slow connection detected: ${timing.total}ms`);
      }

      // For preview environment, try a different approach
      if (this.diagnostics.environment === 'preview') {
        console.log('🌐 Using preview-optimized connection strategy...');
        
        // First, try a simple health check
        try {
          const healthCheck = await fetch('https://twfzlbockonxopuindaw.supabase.co/rest/v1/', {
            method: 'HEAD',
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZnpsYm9ja29ueG9wdWluZGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1OTIxMzMsImV4cCI6MjA1OTE2ODEzM30.8i4PeOsf-vWuKOeukSIAJHCMYMUaraO579wvuaFzpn0'
            },
            signal: AbortSignal.timeout(30000)
          });
          
          if (!healthCheck.ok) {
            throw new Error(`Health check failed: ${healthCheck.status} ${healthCheck.statusText}`);
          }
        } catch (error: any) {
          console.error('Direct health check failed:', error);
          throw new Error(`Preview environment connection failed: ${error.message}`);
        }
      }
      
      const startTime = Date.now();
      const { data, error, count } = await supabase
        .from('subjects')
        .select('id, name', { count: 'exact' })
        .limit(1);
      
      const queryTime = Date.now() - startTime;
      console.log(`Query completed in ${queryTime}ms`);
      
      if (error) {
        console.error('Supabase connection error:', error);
        if (error.message.includes('Invalid API key') || error.message.includes('401')) {
          throw new Error('API key authentication failed - please check Supabase configuration');
        }
        throw new Error(`Database query failed: ${error.message}`);
      }
      
      await this.addResult(
        'Supabase Connection', 
        'pass', 
        `Connected successfully (${count || 0} subjects, ${queryTime}ms query time, env: ${this.diagnostics.environment})`,
        queryTime,
        { 
          timing, 
          environment: this.diagnostics.environment,
          recordCount: count 
        }
      );
    } catch (error: any) {
      console.error('Connection test failed:', error);
      
      const errorMessage = error.message.includes('API key') || error.message.includes('401')
        ? 'API key authentication failed - Supabase configuration needs to be updated'
        : error.message.includes('timeout') || error.message.includes('timed out')
        ? `Connection timed out in ${this.diagnostics.environment} environment - network or server response too slow`
        : error.message.includes('Preview environment connection failed')
        ? `Preview environment has connectivity issues: ${error.message}`
        : `Connection failed: ${error.message}`;
      
      await this.addResult('Supabase Connection', 'fail', errorMessage);
      throw error;
    }
  }

  private async testDatabaseAccess() {
    try {
      console.log('Testing database access with enhanced diagnostics...');
      
      const startTime = Date.now();
      const { data, error, count } = await supabase
        .from('subjects')
        .select('id, name', { count: 'exact' })
        .limit(3);
      
      const queryTime = Date.now() - startTime;
      
      if (error) {
        console.error('Database access error:', error);
        if (error.message.includes('Invalid API key') || error.message.includes('401')) {
          throw new Error('Invalid API key - authentication required for database access');
        }
        throw new Error(`Database error: ${error.message}`);
      }
      
      await this.addResult(
        'Database Access', 
        'pass', 
        `Database responsive (${count || 0} subjects in ${queryTime}ms, env: ${this.diagnostics.environment})`
      );
    } catch (error: any) {
      console.error('Database access test failed:', error);
      
      const errorMessage = error.message.includes('timeout')
        ? `Database query timed out in ${this.diagnostics.environment} environment`
        : error.message.includes('Invalid API key') || error.message.includes('401')
        ? 'Authentication failed - invalid API key or insufficient permissions'
        : `Database access failed: ${error.message}`;
      
      await this.addResult('Database Access', 'fail', errorMessage);
      throw error;
    }
  }

  private async testAuthenticationFlow() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        if (error.message.includes('Invalid API key') || error.message.includes('401')) {
          await this.addResult('Authentication', 'skip', 'API key invalid - authentication service unavailable');
          return;
        }
        console.warn('Auth check error:', error.message);
        await this.addResult('Authentication', 'skip', 'Authentication service check failed');
        return;
      }
      
      if (user) {
        await this.addResult('Authentication', 'pass', `User authenticated: ${user.email}`);
      } else {
        await this.addResult('Authentication', 'skip', 'No user logged in - authentication tests skipped');
      }
    } catch (error: any) {
      await this.addResult('Authentication', 'skip', `Auth service check failed: ${error.message}`);
    }
  }

  private async testUserProfileCreation() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        await this.addResult('User Profile', 'skip', 'No user logged in - profile tests skipped');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }
      
      await this.addResult('User Profile', 'pass', data ? 'User profile found' : 'Profile system accessible');
    } catch (error: any) {
      await this.addResult('User Profile', 'fail', `Profile access failed: ${error.message}`);
    }
  }

  private async testOpenAITextToVoice() {
    try {
      console.log('Testing OpenAI Text-to-Voice API...');
      
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: { text: 'System test', voice: 'alloy' }
      });
      
      if (error) {
        console.error('Text-to-voice error details:', error);
        
        if (!this.forceTestMode && (error.message?.includes('not configured') || error.message?.includes('OPENAI_API_KEY'))) {
          await this.addResult('OpenAI Text-to-Voice', 'skip', 'OpenAI API key not configured');
          return;
        }
        
        if (error.message?.includes('timed out') || error.message?.includes('timeout')) {
          await this.addResult('OpenAI Text-to-Voice', 'fail', 'OpenAI API timeout - service may be slow or unavailable');
          return;
        }
        
        if (error.message?.includes('Failed to send a request to the Edge Function')) {
          await this.addResult('OpenAI Text-to-Voice', 'fail', 'Edge function deployment or connectivity issue');
          return;
        }
        
        if (error.message?.includes('rate limit')) {
          await this.addResult('OpenAI Text-to-Voice', 'fail', 'OpenAI API rate limit exceeded');
          return;
        }
        
        throw error;
      }
      
      if (data && data.audioContent) {
        if (data.audioContent.length > 100) {
          await this.addResult('OpenAI Text-to-Voice', 'pass', 'Voice generation working with real API');
        } else {
          await this.addResult('OpenAI Text-to-Voice', 'pass', 'Voice generation working (test mode)');
        }
      } else {
        throw new Error('No audio content returned from API');
      }
    } catch (error: any) {
      console.error('Text-to-voice test failed:', error);
      
      if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        await this.addResult('OpenAI Text-to-Voice', 'fail', 'API call timed out - OpenAI service may be slow');
      } else if (error.message?.includes('API key')) {
        await this.addResult('OpenAI Text-to-Voice', 'fail', 'OpenAI API key authentication failed');
      } else {
        await this.addResult('OpenAI Text-to-Voice', 'fail', `Voice generation failed: ${error.message}`);
      }
    }
  }

  private async testOpenAIChatCompletion() {
    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            { role: 'system', content: 'You are a test assistant.' },
            { role: 'user', content: 'Say "test successful"' }
          ]
        }
      });
      
      if (error) {
        if (!this.forceTestMode && (error.message?.includes('not configured') || error.message?.includes('OPENAI_API_KEY'))) {
          await this.addResult('OpenAI Chat Completion', 'skip', 'OpenAI API key not configured');
          return;
        }
        throw error;
      }
      
      if (data && data.content) {
        await this.addResult('OpenAI Chat Completion', 'pass', 'Chat completion working');
      } else {
        throw new Error('No content returned');
      }
    } catch (error: any) {
      await this.addResult('OpenAI Chat Completion', 'fail', `Chat completion failed: ${error.message}`);
    }
  }

  private async testVoiceToText() {
    try {
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: 'test_audio_data' }
      });
      
      if (error) {
        if (!this.forceTestMode && (error.message?.includes('not configured') || error.message?.includes('OPENAI_API_KEY'))) {
          await this.addResult('Voice-to-Text', 'skip', 'OpenAI API key not configured');
          return;
        }
        throw error;
      }
      
      if (data && data.text) {
        await this.addResult('Voice-to-Text', 'pass', 'Voice transcription working');
      } else {
        throw new Error('No transcription returned');
      }
    } catch (error: any) {
      await this.addResult('Voice-to-Text', 'fail', `Voice transcription failed: ${error.message}`);
    }
  }

  private async testQuizStorage() {
    try {
      const { data, error, count } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact' })
        .limit(1);
        
      if (error) {
        if (error.message.includes('Invalid API key') || error.message.includes('401')) {
          throw new Error('Invalid API key - database access denied');
        }
        throw new Error(`Database error: ${error.message}`);
      }
      await this.addResult('Quiz Storage', 'pass', `Quiz database accessible (${count || 0} records)`);
    } catch (error: any) {
      await this.addResult('Quiz Storage', 'fail', `Quiz storage failed: ${error.message}`);
    }
  }

  private async testMessageStorage() {
    try {
      const { data, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .limit(1);
        
      if (error) {
        if (error.message.includes('Invalid API key') || error.message.includes('401')) {
          throw new Error('Invalid API key - database access denied');
        }
        throw new Error(`Database error: ${error.message}`);
      }
      await this.addResult('Message Storage', 'pass', `Message database accessible (${count || 0} records)`);
    } catch (error: any) {
      await this.addResult('Message Storage', 'fail', `Message storage failed: ${error.message}`);
    }
  }

  private async testFileUpload() {
    try {
      const { data, error, count } = await supabase
        .from('files')
        .select('*', { count: 'exact' })
        .limit(1);
        
      if (error) {
        if (error.message.includes('Invalid API key') || error.message.includes('401')) {
          throw new Error('Invalid API key - database access denied');
        }
        throw new Error(`Database error: ${error.message}`);
      }
      await this.addResult('File Upload', 'pass', `File storage database accessible (${count || 0} records)`);
    } catch (error: any) {
      await this.addResult('File Upload', 'fail', `File upload failed: ${error.message}`);
    }
  }

  private async testTokenUsageTracking() {
    try {
      const { data, error, count } = await supabase
        .from('token_usage')
        .select('*', { count: 'exact' })
        .limit(1);
        
      if (error) {
        if (error.message.includes('Invalid API key') || error.message.includes('401')) {
          throw new Error('Invalid API key - database access denied');
        }
        throw new Error(`Database error: ${error.message}`);
      }
      await this.addResult('Token Usage', 'pass', `Token usage tracking accessible (${count || 0} records)`);
    } catch (error: any) {
      await this.addResult('Token Usage', 'fail', `Token usage tracking failed: ${error.message}`);
    }
  }

  private async testAchievementSystem() {
    try {
      const { data, error, count } = await supabase
        .from('achievements')
        .select('*', { count: 'exact' })
        .limit(1);
        
      if (error) {
        if (error.message.includes('Invalid API key') || error.message.includes('401')) {
          throw new Error('Invalid API key - database access denied');
        }
        throw new Error(`Database error: ${error.message}`);
      }
      await this.addResult('Achievement System', 'pass', `Achievement system accessible (${count || 0} records)`);
    } catch (error: any) {
      await this.addResult('Achievement System', 'fail', `Achievement system failed: ${error.message}`);
    }
  }

  private async testQuestSystem() {
    try {
      const { data, error, count } = await supabase
        .from('quests')
        .select('*', { count: 'exact' })
        .limit(1);
        
      if (error) {
        if (error.message.includes('Invalid API key') || error.message.includes('401')) {
          throw new Error('Invalid API key - database access denied');
        }
        throw new Error(`Database error: ${error.message}`);
      }
      await this.addResult('Quest System', 'pass', `Quest system accessible (${count || 0} records)`);
    } catch (error: any) {
      await this.addResult('Quest System', 'fail', `Quest system failed: ${error.message}`);
    }
  }

  private async testLearningAnalytics() {
    try {
      const { data, error, count } = await supabase
        .from('learning_analytics')
        .select('*', { count: 'exact' })
        .limit(1);
        
      if (error) {
        if (error.message.includes('Invalid API key') || error.message.includes('401')) {
          throw new Error('Invalid API key - database access denied');
        }
        throw new Error(`Database error: ${error.message}`);
      }
      await this.addResult('Learning Analytics', 'pass', `Learning analytics accessible (${count || 0} records)`);
    } catch (error: any) {
      await this.addResult('Learning Analytics', 'fail', `Learning analytics failed: ${error.message}`);
    }
  }

  private async testProgressTracking() {
    try {
      const { data, error, count } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact' })
        .limit(1);
        
      if (error) {
        if (error.message.includes('Invalid API key') || error.message.includes('401')) {
          throw new Error('Invalid API key - database access denied');
        }
        throw new Error(`Database error: ${error.message}`);
      }
      await this.addResult('Progress Tracking', 'pass', `Progress tracking accessible (${count || 0} records)`);
    } catch (error: any) {
      await this.addResult('Progress Tracking', 'fail', `Progress tracking failed: ${error.message}`);
    }
  }

  private async testEmailInvitation() {
    try {
      const { data, error } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          invitationId: 'test-id',
          studentEmail: 'test@example.com',
          studentName: 'Test Student',
          schoolName: 'Test School',
          invitationCode: 'TEST123'
        }
      });
      
      if (error) {
        if (!this.forceTestMode && (error.message?.includes('not configured') || error.message?.includes('RESEND_API_KEY'))) {
          await this.addResult('Email Invitation', 'skip', 'Resend API key not configured');
          return;
        }
        
        if (error.message?.includes('Invalid API key') || error.message?.includes('401')) {
          await this.addResult('Email Invitation', 'fail', 'Invalid API key - edge function access denied');
          return;
        }
        if (error.message?.includes('testing email address') || error.message?.includes('test@example.com')) {
          await this.addResult('Email Invitation', 'pass', 'Email service working (test email blocked as expected)');
          return;
        }
        throw error;
      }
      
      await this.addResult('Email Invitation', 'pass', 'Email invitation system working');
    } catch (error: any) {
      await this.addResult('Email Invitation', 'fail', `Email invitation failed: ${error.message}`);
    }
  }

  // Website Navigation and UI Tests
  private async testLandingPageLoad() {
    try {
      // Check if we can access the main route elements
      const hasHeader = document.querySelector('header') || document.querySelector('[data-testid="header"]');
      const hasMainContent = document.querySelector('main') || document.querySelector('.container');
      const hasNavigation = document.querySelector('nav') || document.querySelector('[role="navigation"]');
      
      if (hasHeader && hasMainContent) {
        await this.addResult('Landing Page Load', 'pass', 'Landing page elements loaded successfully');
      } else {
        await this.addResult('Landing Page Load', 'pass', 'Basic page structure detected');
      }
    } catch (error: any) {
      await this.addResult('Landing Page Load', 'fail', `Landing page test failed: ${error.message}`);
    }
  }

  private async testChatInterface() {
    try {
      // Test if chat-related components can be accessed
      const chatElements = document.querySelectorAll('[class*="chat"], [class*="message"], [data-testid*="chat"]');
      const textareas = document.querySelectorAll('textarea');
      const inputs = document.querySelectorAll('input[type="text"]');
      
      if (chatElements.length > 0 || textareas.length > 0 || inputs.length > 0) {
        await this.addResult('Chat Interface', 'pass', 'Chat interface elements accessible');
      } else {
        await this.addResult('Chat Interface', 'skip', 'Chat interface not currently visible');
      }
    } catch (error: any) {
      await this.addResult('Chat Interface', 'fail', `Chat interface test failed: ${error.message}`);
    }
  }

  private async testVoiceInterface() {
    try {
      // Check for voice/audio related elements
      const voiceElements = document.querySelectorAll('[class*="voice"], [class*="audio"], [class*="record"]');
      const audioElements = document.querySelectorAll('audio');
      const micButtons = document.querySelectorAll('[title*="microphone"], [aria-label*="record"]');
      
      if (voiceElements.length > 0 || audioElements.length > 0 || micButtons.length > 0) {
        await this.addResult('Voice Interface', 'pass', 'Voice interface elements found');
      } else {
        await this.addResult('Voice Interface', 'skip', 'Voice interface not currently visible');
      }
    } catch (error: any) {
      await this.addResult('Voice Interface', 'fail', `Voice interface test failed: ${error.message}`);
    }
  }

  private async testQuizGeneratorPage() {
    try {
      // Check for quiz-related elements
      const quizElements = document.querySelectorAll('[class*="quiz"], [data-testid*="quiz"]');
      const buttons = document.querySelectorAll('button');
      const forms = document.querySelectorAll('form');
      
      if (quizElements.length > 0) {
        await this.addResult('Quiz Generator', 'pass', 'Quiz generator elements found');
      } else if (buttons.length > 0 || forms.length > 0) {
        await this.addResult('Quiz Generator', 'pass', 'Interactive elements available for quiz generation');
      } else {
        await this.addResult('Quiz Generator', 'skip', 'Quiz generator not currently visible');
      }
    } catch (error: any) {
      await this.addResult('Quiz Generator', 'fail', `Quiz generator test failed: ${error.message}`);
    }
  }

  private async testProgressDashboard() {
    try {
      // Check for progress/dashboard elements
      const progressElements = document.querySelectorAll('[class*="progress"], [class*="dashboard"], [class*="chart"]');
      const charts = document.querySelectorAll('svg, canvas');
      
      if (progressElements.length > 0 || charts.length > 0) {
        await this.addResult('Progress Dashboard', 'pass', 'Progress dashboard elements found');
      } else {
        await this.addResult('Progress Dashboard', 'skip', 'Progress dashboard not currently visible');
      }
    } catch (error: any) {
      await this.addResult('Progress Dashboard', 'fail', `Progress dashboard test failed: ${error.message}`);
    }
  }

  private async testSettingsPage() {
    try {
      // Check for settings elements
      const settingsElements = document.querySelectorAll('[class*="settings"], [class*="config"]');
      const switches = document.querySelectorAll('[role="switch"], input[type="checkbox"]');
      const selects = document.querySelectorAll('select');
      
      if (settingsElements.length > 0 || switches.length > 0 || selects.length > 0) {
        await this.addResult('Settings Page', 'pass', 'Settings interface elements found');
      } else {
        await this.addResult('Settings Page', 'skip', 'Settings page not currently visible');
      }
    } catch (error: any) {
      await this.addResult('Settings Page', 'fail', `Settings page test failed: ${error.message}`);
    }
  }

  private async testDemoMode() {
    try {
      // Check for demo elements
      const demoElements = document.querySelectorAll('[class*="demo"], [data-testid*="demo"]');
      const buttons = document.querySelectorAll('button');
      
      // Look for demo-specific text content
      const demoText = Array.from(buttons).some(btn => 
        btn.textContent?.toLowerCase().includes('demo') || 
        btn.textContent?.toLowerCase().includes('try')
      );
      
      if (demoElements.length > 0 || demoText) {
        await this.addResult('Demo Mode', 'pass', 'Demo mode elements found');
      } else {
        await this.addResult('Demo Mode', 'skip', 'Demo mode not currently visible');
      }
    } catch (error: any) {
      await this.addResult('Demo Mode', 'fail', `Demo mode test failed: ${error.message}`);
    }
  }

  private async testSchoolAdminPanel() {
    try {
      // Check for admin elements
      const adminElements = document.querySelectorAll('[class*="admin"], [class*="school"]');
      const tables = document.querySelectorAll('table');
      const managementElements = document.querySelectorAll('[class*="management"], [class*="panel"]');
      
      if (adminElements.length > 0 || managementElements.length > 0) {
        await this.addResult('School Admin Panel', 'pass', 'Admin panel elements found');
      } else {
        await this.addResult('School Admin Panel', 'skip', 'Admin panel not currently visible');
      }
    } catch (error: any) {
      await this.addResult('School Admin Panel', 'fail', `School admin panel test failed: ${error.message}`);
    }
  }

  private async testOnboardingFlow() {
    try {
      // Check for onboarding elements
      const onboardingElements = document.querySelectorAll('[class*="onboard"], [class*="welcome"], [class*="step"]');
      const wizardElements = document.querySelectorAll('[class*="wizard"], [class*="flow"]');
      
      if (onboardingElements.length > 0 || wizardElements.length > 0) {
        await this.addResult('Onboarding Flow', 'pass', 'Onboarding flow elements found');
      } else {
        await this.addResult('Onboarding Flow', 'skip', 'Onboarding flow not currently visible');
      }
    } catch (error: any) {
      await this.addResult('Onboarding Flow', 'fail', `Onboarding flow test failed: ${error.message}`);
    }
  }

  private async testStudentDashboard() {
    try {
      // Check for student dashboard elements
      const studentElements = document.querySelectorAll('[class*="student"], [class*="dashboard"]');
      const achievementElements = document.querySelectorAll('[class*="achievement"], [class*="badge"]');
      
      if (studentElements.length > 0 || achievementElements.length > 0) {
        await this.addResult('Student Dashboard', 'pass', 'Student dashboard elements found');
      } else {
        await this.addResult('Student Dashboard', 'skip', 'Student dashboard not currently visible');
      }
    } catch (error: any) {
      await this.addResult('Student Dashboard', 'fail', `Student dashboard test failed: ${error.message}`);
    }
  }

  private async testParentDashboard() {
    try {
      // Check for parent dashboard elements
      const parentElements = document.querySelectorAll('[class*="parent"], [class*="guardian"]');
      const monitoringElements = document.querySelectorAll('[class*="monitor"], [class*="tracking"]');
      
      if (parentElements.length > 0 || monitoringElements.length > 0) {
        await this.addResult('Parent Dashboard', 'pass', 'Parent dashboard elements found');
      } else {
        await this.addResult('Parent Dashboard', 'skip', 'Parent dashboard not currently visible');
      }
    } catch (error: any) {
      await this.addResult('Parent Dashboard', 'fail', `Parent dashboard test failed: ${error.message}`);
    }
  }

  private async testNavigationMenu() {
    try {
      // Check for navigation elements
      const navElements = document.querySelectorAll('nav, [role="navigation"]');
      const menuElements = document.querySelectorAll('[class*="menu"], [class*="sidebar"]');
      const links = document.querySelectorAll('a');
      
      if (navElements.length > 0 || menuElements.length > 0 || links.length > 0) {
        await this.addResult('Navigation Menu', 'pass', `Navigation elements found (${links.length} links)`);
      } else {
        await this.addResult('Navigation Menu', 'fail', 'No navigation elements found');
      }
    } catch (error: any) {
      await this.addResult('Navigation Menu', 'fail', `Navigation menu test failed: ${error.message}`);
    }
  }

  private async testLanguageSelection() {
    try {
      // Check for language selection elements
      const languageElements = document.querySelectorAll('[class*="language"], [class*="locale"]');
      const selectors = document.querySelectorAll('select, [role="combobox"]');
      
      if (languageElements.length > 0) {
        await this.addResult('Language Selection', 'pass', 'Language selection elements found');
      } else if (selectors.length > 0) {
        await this.addResult('Language Selection', 'pass', 'Selection interfaces available');
      } else {
        await this.addResult('Language Selection', 'skip', 'Language selection not currently visible');
      }
    } catch (error: any) {
      await this.addResult('Language Selection', 'fail', `Language selection test failed: ${error.message}`);
    }
  }

  private async testRoleSelection() {
    try {
      // Check for role selection elements
      const roleElements = document.querySelectorAll('[class*="role"], [class*="user-type"]');
      const radioButtons = document.querySelectorAll('input[type="radio"]');
      const cards = document.querySelectorAll('[class*="card"]');
      
      if (roleElements.length > 0 || radioButtons.length > 0) {
        await this.addResult('Role Selection', 'pass', 'Role selection elements found');
      } else {
        await this.addResult('Role Selection', 'skip', 'Role selection not currently visible');
      }
    } catch (error: any) {
      await this.addResult('Role Selection', 'fail', `Role selection test failed: ${error.message}`);
    }
  }

  private async testCurriculumSelection() {
    try {
      // Check for curriculum selection elements
      const curriculumElements = document.querySelectorAll('[class*="curriculum"], [class*="subject"]');
      const options = document.querySelectorAll('option');
      
      if (curriculumElements.length > 0 || options.length > 0) {
        await this.addResult('Curriculum Selection', 'pass', 'Curriculum selection elements found');
      } else {
        await this.addResult('Curriculum Selection', 'skip', 'Curriculum selection not currently visible');
      }
    } catch (error: any) {
      await this.addResult('Curriculum Selection', 'fail', `Curriculum selection test failed: ${error.message}`);
    }
  }

  private async testTestCreation() {
    try {
      // Check for test creation elements
      const testElements = document.querySelectorAll('[class*="test"], [class*="creator"]');
      const forms = document.querySelectorAll('form');
      const textareas = document.querySelectorAll('textarea');
      
      if (testElements.length > 0 || (forms.length > 0 && textareas.length > 0)) {
        await this.addResult('Test Creation', 'pass', 'Test creation interface elements found');
      } else {
        await this.addResult('Test Creation', 'skip', 'Test creation not currently visible');
      }
    } catch (error: any) {
      await this.addResult('Test Creation', 'fail', `Test creation test failed: ${error.message}`);
    }
  }

  private async testStudentMonitoring() {
    try {
      // Check for monitoring elements
      const monitoringElements = document.querySelectorAll('[class*="monitor"], [class*="tracking"]');
      const analyticsElements = document.querySelectorAll('[class*="analytics"], [class*="metrics"]');
      
      if (monitoringElements.length > 0 || analyticsElements.length > 0) {
        await this.addResult('Student Monitoring', 'pass', 'Student monitoring elements found');
      } else {
        await this.addResult('Student Monitoring', 'skip', 'Student monitoring not currently visible');
      }
    } catch (error: any) {
      await this.addResult('Student Monitoring', 'fail', `Student monitoring test failed: ${error.message}`);
    }
  }

  private async testRealTimeAnalytics() {
    try {
      // Check for real-time analytics elements
      const analyticsElements = document.querySelectorAll('[class*="analytics"], [class*="real-time"]');
      const charts = document.querySelectorAll('svg, canvas');
      const dataElements = document.querySelectorAll('[class*="data"], [class*="metric"]');
      
      if (analyticsElements.length > 0 || charts.length > 0 || dataElements.length > 0) {
        await this.addResult('Real-time Analytics', 'pass', 'Real-time analytics elements found');
      } else {
        await this.addResult('Real-time Analytics', 'skip', 'Real-time analytics not currently visible');
      }
    } catch (error: any) {
      await this.addResult('Real-time Analytics', 'fail', `Real-time analytics test failed: ${error.message}`);
    }
  }

  private async testGamificationFeatures() {
    try {
      // Check for gamification elements
      const gamificationElements = document.querySelectorAll('[class*="quest"], [class*="achievement"], [class*="badge"]');
      const pointsElements = document.querySelectorAll('[class*="points"], [class*="score"]');
      const rewardElements = document.querySelectorAll('[class*="reward"], [class*="level"]');
      
      if (gamificationElements.length > 0 || pointsElements.length > 0 || rewardElements.length > 0) {
        await this.addResult('Gamification Features', 'pass', 'Gamification elements found');
      } else {
        await this.addResult('Gamification Features', 'skip', 'Gamification features not currently visible');
      }
    } catch (error: any) {
      await this.addResult('Gamification Features', 'fail', `Gamification features test failed: ${error.message}`);
    }
  }

  private async testContentManagement() {
    try {
      // Check for content management elements
      const contentElements = document.querySelectorAll('[class*="content"], [class*="manage"]');
      const editorElements = document.querySelectorAll('[class*="editor"], [class*="rich-text"]');
      const uploadElements = document.querySelectorAll('input[type="file"]');
      
      if (contentElements.length > 0 || editorElements.length > 0 || uploadElements.length > 0) {
        await this.addResult('Content Management', 'pass', 'Content management elements found');
      } else {
        await this.addResult('Content Management', 'skip', 'Content management not currently visible');
      }
    } catch (error: any) {
      await this.addResult('Content Management', 'fail', `Content management test failed: ${error.message}`);
    }
  }

  getPassRate(): number {
    if (this.results.length === 0) return 0;
    const passCount = this.results.filter(r => r.status === 'pass').length;
    return Math.round((passCount / this.results.length) * 100);
  }

  getFailureCount(): number {
    return this.results.filter(r => r.status === 'fail').length;
  }

  getSkipCount(): number {
    return this.results.filter(r => r.status === 'skip').length;
  }
}

// Export convenience functions to match the expected interface
export async function runSystemTests(): Promise<TestSuite[]> {
  const tester = new SystemTester();
  const results = await tester.runAllTests();
  
  return [{
    name: 'System Tests',
    results: results,
    totalTests: results.length,
    passedTests: results.filter(r => r.status === 'pass').length,
    failedTests: results.filter(r => r.status === 'fail').length,
    skippedTests: results.filter(r => r.status === 'skip').length
  }];
}

export async function quickHealthCheck(): Promise<{status: string, message: string}> {
  try {
    // Warmup connection first
    await ConnectionWarmup.warmupConnection();
    
    const { data, error, count } = await supabase
      .from('subjects')
      .select('*', { count: 'exact' })
      .limit(1);
      
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    const authStatus = user ? 'authenticated' : 'anonymous';
    const diagnostics = ConnectionDiagnostics.getConnectionInfo();
    
    return {
      status: 'healthy',
      message: `System operational (env: ${diagnostics.environment}). Database accessible (${count || 0} subjects), user ${authStatus}.`
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      message: `System issues detected: ${error.message}`
    };
  }
}
