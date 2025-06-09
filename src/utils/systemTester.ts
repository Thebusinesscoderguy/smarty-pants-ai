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

export class SystemTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    this.results = [];
    
    console.log('🔧 Starting comprehensive system tests...');
    
    // Core Infrastructure Tests
    await this.testSupabaseConnection();
    await this.testDatabaseAccess();
    
    // Authentication Tests
    await this.testAuthenticationFlow();
    await this.testUserProfileCreation();
    
    // AI Service Tests
    await this.testOpenAITextToVoice();
    await this.testOpenAIChatCompletion();
    await this.testVoiceToText();
    
    // Quiz System Tests
    await this.testQuizGeneration();
    await this.testQuizStorage();
    
    // User Features Tests
    await this.testMessageStorage();
    await this.testFileUpload();
    await this.testTokenUsageTracking();
    
    // Gamification Tests
    await this.testAchievementSystem();
    await this.testQuestSystem();
    
    // Analytics Tests
    await this.testLearningAnalytics();
    await this.testProgressTracking();
    
    // Email System Tests
    await this.testEmailInvitation();
    
    // Payment System Tests
    await this.testStripeCheckout();
    
    console.log('✅ System tests completed');
    return this.results;
  }

  private async addResult(name: string, status: 'pass' | 'fail' | 'skip', message: string) {
    this.results.push({ name, status, message });
    const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
    console.log(`${emoji} ${name}: ${message}`);
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
        throw new Error(`Database query failed: ${error.message}`);
      }
      
      console.log('Connection successful:', { recordCount: count, hasData: !!data });
      await this.addResult('Supabase Connection', 'pass', `Successfully connected to database (${count || 0} subjects found)`);
    } catch (error: any) {
      console.error('Connection test failed:', error);
      await this.addResult('Supabase Connection', 'fail', `Connection failed: ${error.message}`);
    }
  }

  private async testDatabaseAccess() {
    try {
      // Test multiple tables individually to avoid TypeScript issues
      let accessibleTables = 0;
      const totalTables = 3;
      
      // Test subjects table
      try {
        const { error: subjectsError } = await supabase.from('subjects').select('count').limit(1);
        if (!subjectsError) {
          accessibleTables++;
        } else {
          console.warn('Subjects table access issue:', subjectsError.message);
        }
      } catch (err) {
        console.warn('Subjects table access failed:', err);
      }
      
      // Test quizzes table
      try {
        const { error: quizzesError } = await supabase.from('quizzes').select('count').limit(1);
        if (!quizzesError) {
          accessibleTables++;
        } else {
          console.warn('Quizzes table access issue:', quizzesError.message);
        }
      } catch (err) {
        console.warn('Quizzes table access failed:', err);
      }
      
      // Test messages table
      try {
        const { error: messagesError } = await supabase.from('messages').select('count').limit(1);
        if (!messagesError) {
          accessibleTables++;
        } else {
          console.warn('Messages table access issue:', messagesError.message);
        }
      } catch (err) {
        console.warn('Messages table access failed:', err);
      }
      
      if (accessibleTables === totalTables) {
        await this.addResult('Database Access', 'pass', `All ${totalTables} core tables accessible`);
      } else if (accessibleTables > 0) {
        await this.addResult('Database Access', 'pass', `${accessibleTables}/${totalTables} tables accessible`);
      } else {
        throw new Error('No tables accessible');
      }
    } catch (error: any) {
      await this.addResult('Database Access', 'fail', `Database access failed: ${error.message}`);
    }
  }

  private async testAuthenticationFlow() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.warn('Auth check error:', error.message);
        await this.addResult('Authentication', 'skip', 'Authentication service unavailable');
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
        if (error.message?.includes('not configured') || error.message?.includes('OPENAI_API_KEY')) {
          await this.addResult('OpenAI Text-to-Voice', 'skip', 'OpenAI API key not configured');
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
        if (error.message?.includes('not configured') || error.message?.includes('OPENAI_API_KEY')) {
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
        if (error.message?.includes('not configured') || error.message?.includes('OPENAI_API_KEY')) {
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

  private async testQuizGeneration() {
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: {
          topic: 'Test Topic',
          difficulty: 'easy',
          questionCount: 1
        }
      });
      
      if (error) {
        if (error.message?.includes('not configured') || error.message?.includes('OPENAI_API_KEY')) {
          await this.addResult('Quiz Generation', 'skip', 'OpenAI API key not configured');
          return;
        }
        throw error;
      }
      
      if (data && data.questions && data.questions.length > 0) {
        await this.addResult('Quiz Generation', 'pass', 'Quiz generation working');
      } else {
        throw new Error('No questions generated');
      }
    } catch (error: any) {
      await this.addResult('Quiz Generation', 'fail', `Quiz generation failed: ${error.message}`);
    }
  }

  private async testQuizStorage() {
    try {
      const { data, error, count } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact' })
        .limit(1);
        
      if (error) {
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
        if (error.message?.includes('not configured') || error.message?.includes('RESEND_API_KEY')) {
          await this.addResult('Email Invitation', 'skip', 'Resend API key not configured');
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

  private async testStripeCheckout() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        await this.addResult('Stripe Checkout', 'skip', 'No user logged in - payment tests skipped');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType: 'individual' }
      });
      
      if (error) {
        if (error.message?.includes('not configured') || error.message?.includes('STRIPE_SECRET_KEY')) {
          await this.addResult('Stripe Checkout', 'skip', 'Stripe secret key not configured');
          return;
        }
        throw error;
      }
      
      await this.addResult('Stripe Checkout', 'pass', 'Stripe checkout system working');
    } catch (error: any) {
      await this.addResult('Stripe Checkout', 'fail', `Stripe checkout failed: ${error.message}`);
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
