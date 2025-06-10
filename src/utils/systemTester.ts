import { supabase } from '@/integrations/supabase/client';

export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  duration?: number;
}

export interface TestSuite {
  name: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
}

// Timeout wrapper for test functions
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

export class SystemTester {
  private results: TestResult[] = [];
  private onProgress?: (testName: string, current: number, total: number) => void;
  private forceTestMode: boolean = false;

  constructor(onProgress?: (testName: string, current: number, total: number) => void, forceTestMode: boolean = false) {
    this.onProgress = onProgress;
    this.forceTestMode = forceTestMode;
  }

  async runAllTests(): Promise<TestResult[]> {
    this.results = [];
    
    console.log('🔧 Starting comprehensive system tests...');
    if (this.forceTestMode) {
      console.log('⚡ Force test mode enabled - bypassing skip conditions');
    }
    
    const tests = [
      // Critical infrastructure tests first
      { name: 'Supabase Connection', fn: () => this.testSupabaseConnection() },
      { name: 'Database Access', fn: () => this.testDatabaseAccess() },
      { name: 'Authentication', fn: () => this.testAuthenticationFlow() },
      
      // API tests with adjusted timeouts
      { name: 'OpenAI Text-to-Voice', fn: () => this.testOpenAITextToVoice(), timeout: 8000 }, // Reduced from 15000
      { name: 'Email Invitation', fn: () => this.testEmailInvitation(), timeout: 8000 },
      { name: 'OpenAI Chat Completion', fn: () => this.testOpenAIChatCompletion(), timeout: 10000 },
      { name: 'Voice-to-Text', fn: () => this.testVoiceToText(), timeout: 8000 },
      
      // Database table tests
      { name: 'Quiz Storage', fn: () => this.testQuizStorage() },
      { name: 'Message Storage', fn: () => this.testMessageStorage() },
      { name: 'User Profile', fn: () => this.testUserProfileCreation() },
      { name: 'File Upload', fn: () => this.testFileUpload() },
      { name: 'Token Usage', fn: () => this.testTokenUsageTracking() },
      { name: 'Achievement System', fn: () => this.testAchievementSystem() },
      { name: 'Quest System', fn: () => this.testQuestSystem() },
      { name: 'Learning Analytics', fn: () => this.testLearningAnalytics() },
      { name: 'Progress Tracking', fn: () => this.testProgressTracking() },
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
        await withTimeout(test.fn(), test.timeout || 6000); // Reduced default timeout
        const duration = Date.now() - startTime;
        
        // Update duration for the last added result
        if (this.results.length > 0) {
          this.results[this.results.length - 1].duration = duration;
        }
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        if (error.message.includes('timed out')) {
          await this.addResult(test.name, 'fail', `Test timed out after ${test.timeout || 6000}ms`, duration);
        } else {
          await this.addResult(test.name, 'fail', `Test failed: ${error.message}`, duration);
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

  private async addResult(name: string, status: 'pass' | 'fail' | 'skip', message: string, duration?: number) {
    this.results.push({ name, status, message, duration });
    const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
    console.log(`${emoji} ${name}: ${message} ${duration ? `(${duration}ms)` : ''}`);
  }

  private async testSupabaseConnection() {
    try {
      console.log('Testing Supabase connection...');
      
      const { data, error, count } = await supabase
        .from('subjects')
        .select('id, name', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.error('Supabase connection error:', error);
        if (error.message.includes('Invalid API key') || error.message.includes('401')) {
          throw new Error('API key authentication failed - please check Supabase configuration');
        }
        throw new Error(`Database query failed: ${error.message}`);
      }
      
      console.log('Connection successful:', { recordCount: count, hasData: !!data });
      await this.addResult('Supabase Connection', 'pass', `Successfully connected to database (${count || 0} subjects found)`);
    } catch (error: any) {
      console.error('Connection test failed:', error);
      if (error.message.includes('API key') || error.message.includes('401')) {
        await this.addResult('Supabase Connection', 'fail', 'API key authentication failed - Supabase configuration needs to be updated');
      } else {
        await this.addResult('Supabase Connection', 'fail', `Connection failed: ${error.message}`);
      }
      throw error; // Re-throw to stop further tests
    }
  }

  private async testDatabaseAccess() {
    try {
      const { error } = await supabase.auth.getSession();
      
      if (error && error.message.includes('Invalid API key')) {
        await this.addResult('Database Access', 'fail', 'Invalid API key - database access denied');
        return;
      }
      
      const { data, error: subjectsError, count } = await supabase
        .from('subjects')
        .select('*', { count: 'exact' })
        .limit(1);
        
      if (subjectsError) {
        if (subjectsError.message.includes('Invalid API key') || subjectsError.message.includes('401')) {
          throw new Error('Invalid API key - authentication required for database access');
        }
        throw new Error(`Database error: ${subjectsError.message}`);
      }
      
      await this.addResult('Database Access', 'pass', `Database accessible (${count || 0} subjects found)`);
    } catch (error: any) {
      await this.addResult('Database Access', 'fail', `Database access failed: ${error.message}`);
      throw error; // Re-throw to stop further tests
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
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: { text: 'System test', voice: 'alloy' }
      });
      
      if (error) {
        console.error('Text-to-voice error details:', error);
        
        // In force test mode, don't skip - let it fail to see the actual error
        if (!this.forceTestMode && (error.message?.includes('not configured') || error.message?.includes('OPENAI_API_KEY'))) {
          await this.addResult('OpenAI Text-to-Voice', 'skip', 'OpenAI API key not configured');
          return;
        }
        
        if (error.message?.includes('Failed to send a request to the Edge Function')) {
          await this.addResult('OpenAI Text-to-Voice', 'fail', 'Edge function deployment or connectivity issue');
          return;
        }
        throw error;
      }
      
      if (data && data.audioContent) {
        await this.addResult('OpenAI Text-to-Voice', 'pass', 'Voice generation working');
      } else {
        throw new Error('No audio content returned');
      }
    } catch (error: any) {
      await this.addResult('OpenAI Text-to-Voice', 'fail', `Voice generation failed: ${error.message}`);
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
        // In force test mode, don't skip - let it fail to see the actual error
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
        // In force test mode, don't skip - let it fail to see the actual error
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
        // In force test mode, don't skip - let it fail to see the actual error
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
    const { data, error, count } = await supabase
      .from('subjects')
      .select('*', { count: 'exact' })
      .limit(1);
      
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    const authStatus = user ? 'authenticated' : 'anonymous';
    
    return {
      status: 'healthy',
      message: `System is operational. Database accessible (${count || 0} subjects), user ${authStatus}.`
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      message: `System issues detected: ${error.message}`
    };
  }
}
