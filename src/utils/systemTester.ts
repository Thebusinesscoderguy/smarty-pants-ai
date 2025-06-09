
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
      // Test basic connection with proper headers
      const response = await fetch('https://twfzlbockonxopuindaw.supabase.co/rest/v1/', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZnpsYm9ja29ueG9wdWluZGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MDE5NTAsImV4cCI6MjA1ODk3Nzk1MH0.MKUGpLxfF5bhtqOAo0aBs0daOMpMfkIqgwZ2ntIvQi4',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZnpsYm9ja29ueG9wdWluZGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MDE5NTAsImV4cCI6MjA1ODk3Nzk1MH0.MKUGpLxfF5bhtqOAo0aBs0daOMpMfkIqgwZ2ntIvQi4'
        }
      });
      
      if (response.ok) {
        await this.addResult('Supabase Connection', 'pass', 'Successfully connected to Supabase');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      await this.addResult('Supabase Connection', 'fail', `Connection failed: ${error.message}`);
    }
  }

  private async testDatabaseAccess() {
    try {
      const { data, error } = await supabase.from('subjects').select('id, name').limit(1);
      if (error) throw error;
      await this.addResult('Database Access', 'pass', 'Database queries working');
    } catch (error: any) {
      await this.addResult('Database Access', 'fail', `Database access failed: ${error.message}`);
    }
  }

  private async testAuthenticationFlow() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await this.addResult('Authentication', 'pass', `User authenticated: ${user.email}`);
      } else {
        await this.addResult('Authentication', 'skip', 'No user logged in - authentication tests skipped');
      }
    } catch (error: any) {
      await this.addResult('Authentication', 'fail', `Auth check failed: ${error.message}`);
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
        .single();

      if (error) throw error;
      await this.addResult('User Profile', 'pass', 'User profile exists and accessible');
    } catch (error: any) {
      await this.addResult('User Profile', 'fail', `Profile access failed: ${error.message}`);
    }
  }

  private async testOpenAITextToVoice() {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: { text: 'System test', voice: 'alloy' }
      });
      
      if (error) throw error;
      if (data && data.audioContent) {
        await this.addResult('OpenAI Text-to-Voice', 'pass', 'Voice generation working');
      } else {
        throw new Error('No audio content returned');
      }
    } catch (error: any) {
      if (error.message?.includes('OPENAI_API_KEY')) {
        await this.addResult('OpenAI Text-to-Voice', 'skip', 'OpenAI API key not configured');
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
      
      if (error) throw error;
      if (data && data.content) {
        await this.addResult('OpenAI Chat Completion', 'pass', 'Chat completion working');
      } else {
        throw new Error('No content returned');
      }
    } catch (error: any) {
      if (error.message?.includes('OPENAI_API_KEY')) {
        await this.addResult('OpenAI Chat Completion', 'skip', 'OpenAI API key not configured');
      } else {
        await this.addResult('OpenAI Chat Completion', 'fail', `Chat completion failed: ${error.message}`);
      }
    }
  }

  private async testVoiceToText() {
    try {
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: 'test_audio_data' }
      });
      
      if (error) throw error;
      if (data && data.text) {
        await this.addResult('Voice-to-Text', 'pass', 'Voice transcription working');
      } else {
        throw new Error('No transcription returned');
      }
    } catch (error: any) {
      if (error.message?.includes('OPENAI_API_KEY')) {
        await this.addResult('Voice-to-Text', 'skip', 'OpenAI API key not configured');
      } else {
        await this.addResult('Voice-to-Text', 'fail', `Voice transcription failed: ${error.message}`);
      }
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
      
      if (error) throw error;
      if (data && data.questions && data.questions.length > 0) {
        await this.addResult('Quiz Generation', 'pass', 'Quiz generation working');
      } else {
        throw new Error('No questions generated');
      }
    } catch (error: any) {
      if (error.message?.includes('OPENAI_API_KEY')) {
        await this.addResult('Quiz Generation', 'skip', 'OpenAI API key not configured');
      } else {
        await this.addResult('Quiz Generation', 'fail', `Quiz generation failed: ${error.message}`);
      }
    }
  }

  private async testQuizStorage() {
    try {
      const { data, error } = await supabase.from('quizzes').select('count').limit(1);
      if (error) throw error;
      await this.addResult('Quiz Storage', 'pass', 'Quiz database accessible');
    } catch (error: any) {
      await this.addResult('Quiz Storage', 'fail', `Quiz storage failed: ${error.message}`);
    }
  }

  private async testMessageStorage() {
    try {
      const { data, error } = await supabase.from('messages').select('count').limit(1);
      if (error) throw error;
      await this.addResult('Message Storage', 'pass', 'Message database accessible');
    } catch (error: any) {
      await this.addResult('Message Storage', 'fail', `Message storage failed: ${error.message}`);
    }
  }

  private async testFileUpload() {
    try {
      const { data, error } = await supabase.from('files').select('count').limit(1);
      if (error) throw error;
      await this.addResult('File Upload', 'pass', 'File storage database accessible');
    } catch (error: any) {
      await this.addResult('File Upload', 'fail', `File upload failed: ${error.message}`);
    }
  }

  private async testTokenUsageTracking() {
    try {
      const { data, error } = await supabase.from('token_usage').select('count').limit(1);
      if (error) throw error;
      await this.addResult('Token Usage', 'pass', 'Token usage tracking accessible');
    } catch (error: any) {
      await this.addResult('Token Usage', 'fail', `Token usage tracking failed: ${error.message}`);
    }
  }

  private async testAchievementSystem() {
    try {
      const { data, error } = await supabase.from('achievements').select('count').limit(1);
      if (error) throw error;
      await this.addResult('Achievement System', 'pass', 'Achievement system accessible');
    } catch (error: any) {
      await this.addResult('Achievement System', 'fail', `Achievement system failed: ${error.message}`);
    }
  }

  private async testQuestSystem() {
    try {
      const { data, error } = await supabase.from('quests').select('count').limit(1);
      if (error) throw error;
      await this.addResult('Quest System', 'pass', 'Quest system accessible');
    } catch (error: any) {
      await this.addResult('Quest System', 'fail', `Quest system failed: ${error.message}`);
    }
  }

  private async testLearningAnalytics() {
    try {
      const { data, error } = await supabase.from('learning_analytics').select('count').limit(1);
      if (error) throw error;
      await this.addResult('Learning Analytics', 'pass', 'Learning analytics accessible');
    } catch (error: any) {
      await this.addResult('Learning Analytics', 'fail', `Learning analytics failed: ${error.message}`);
    }
  }

  private async testProgressTracking() {
    try {
      const { data, error } = await supabase.from('user_progress').select('count').limit(1);
      if (error) throw error;
      await this.addResult('Progress Tracking', 'pass', 'Progress tracking accessible');
    } catch (error: any) {
      await this.addResult('Progress Tracking', 'fail', `Progress tracking failed: ${error.message}`);
    }
  }

  private async testEmailInvitation() {
    try {
      const { data, error } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          invitationId: 'test-id',
          studentEmail: 'test@lovable.dev',
          studentName: 'Test Student',
          schoolName: 'Test School',
          invitationCode: 'TEST123'
        }
      });
      
      if (error) {
        if (error.message?.includes('RESEND_API_KEY')) {
          await this.addResult('Email Invitation', 'skip', 'Resend API key not configured');
        } else {
          throw error;
        }
      } else {
        await this.addResult('Email Invitation', 'pass', 'Email invitation system working');
      }
    } catch (error: any) {
      if (error.message?.includes('RESEND_API_KEY')) {
        await this.addResult('Email Invitation', 'skip', 'Resend API key not configured');
      } else {
        await this.addResult('Email Invitation', 'fail', `Email invitation failed: ${error.message}`);
      }
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
        if (error.message?.includes('STRIPE_SECRET_KEY')) {
          await this.addResult('Stripe Checkout', 'skip', 'Stripe secret key not configured');
        } else {
          throw error;
        }
      } else {
        await this.addResult('Stripe Checkout', 'pass', 'Stripe checkout system working');
      }
    } catch (error: any) {
      if (error.message?.includes('STRIPE_SECRET_KEY')) {
        await this.addResult('Stripe Checkout', 'skip', 'Stripe secret key not configured');
      } else {
        await this.addResult('Stripe Checkout', 'fail', `Stripe checkout failed: ${error.message}`);
      }
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
    const { data, error } = await supabase.from('subjects').select('count').limit(1);
    if (error) throw error;
    
    const { data: { user } } = await supabase.auth.getUser();
    const authStatus = user ? 'authenticated' : 'anonymous';
    
    return {
      status: 'healthy',
      message: `System is operational. Database accessible, user ${authStatus}.`
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      message: `System issues detected: ${error.message}`
    };
  }
}
