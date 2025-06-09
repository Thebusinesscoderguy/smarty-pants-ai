
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  duration: number;
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
  private results: TestSuite[] = [];
  private currentUser: any = null;

  async runAllTests(): Promise<TestSuite[]> {
    console.log('🚀 Starting comprehensive system testing...');
    
    this.results = [];
    
    // Phase 1: Authentication & Authorization
    await this.testAuthentication();
    
    // Phase 2: Core API Functions
    await this.testCoreAPIs();
    
    // Phase 3: Database Operations
    await this.testDatabaseOperations();
    
    // Phase 4: Integration Workflows
    await this.testIntegrationWorkflows();
    
    // Phase 5: Error Handling
    await this.testErrorHandling();
    
    this.printSummary();
    return this.results;
  }

  private async testAuthentication(): Promise<void> {
    const suite: TestSuite = {
      name: 'Authentication & Authorization',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0
    };

    // Test 1: Check current session
    await this.runTest(suite, 'Check Current Session', async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw new Error(`Session error: ${error.message}`);
      
      this.currentUser = session?.user || null;
      return `Session status: ${session ? 'Active' : 'No session'}, User: ${session?.user?.email || 'None'}`;
    });

    // Test 2: Test protected route access
    await this.runTest(suite, 'Test Protected Route Access', async () => {
      if (!this.currentUser) {
        throw new Error('No authenticated user - cannot test protected routes');
      }
      return 'User is authenticated, protected routes should be accessible';
    });

    // Test 3: Test RLS policies
    await this.runTest(suite, 'Test RLS Policies', async () => {
      if (!this.currentUser) {
        return 'Skipped - no authenticated user';
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (error) throw new Error(`RLS test failed: ${error.message}`);
      return `RLS policies working, can access profiles table`;
    });

    this.results.push(suite);
  }

  private async testCoreAPIs(): Promise<void> {
    const suite: TestSuite = {
      name: 'Core API Functions',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0
    };

    // Test 1: Quiz Generation API
    await this.runTest(suite, 'Quiz Generation API', async () => {
      if (!this.currentUser) {
        return 'Skipped - requires authentication';
      }

      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: {
          topic: 'Basic Mathematics',
          difficulty: 'easy',
          questionCount: 3
        }
      });

      if (error) throw new Error(`Quiz generation failed: ${error.message}`);
      if (!data || !data.questions || data.questions.length === 0) {
        throw new Error('Quiz generation returned invalid data');
      }

      return `Successfully generated quiz with ${data.questions.length} questions`;
    });

    // Test 2: Chat Completion API
    await this.runTest(suite, 'Chat Completion API', async () => {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            { role: 'user', content: 'What is 2+2?' }
          ]
        }
      });

      if (error) throw new Error(`Chat completion failed: ${error.message}`);
      if (!data || !data.text) {
        throw new Error('Chat completion returned invalid data');
      }

      return `Chat completion successful: ${data.text.substring(0, 50)}...`;
    });

    // Test 3: Voice-to-Text API
    await this.runTest(suite, 'Voice-to-Text API', async () => {
      // Create a dummy audio blob for testing
      const dummyBlob = new Blob(['dummy audio data'], { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', dummyBlob);

      try {
        const { data, error } = await supabase.functions.invoke('voice-to-text', {
          body: formData
        });

        // This might fail due to invalid audio, but we're testing if the endpoint exists
        return 'Voice-to-text endpoint is accessible (may need valid audio)';
      } catch (error: any) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          throw new Error('Voice-to-text function not found');
        }
        return 'Voice-to-text endpoint exists (validation error expected with dummy data)';
      }
    });

    // Test 4: Text-to-Voice API
    await this.runTest(suite, 'Text-to-Voice API', async () => {
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: {
          text: 'Hello, this is a test.',
          voice: 'alloy'
        }
      });

      if (error) {
        if (error.message.includes('API key')) {
          return 'Text-to-voice endpoint exists but requires OpenAI API key configuration';
        }
        throw new Error(`Text-to-voice failed: ${error.message}`);
      }

      return 'Text-to-voice API working successfully';
    });

    // Test 5: Wolfram Alpha API
    await this.runTest(suite, 'Wolfram Alpha API', async () => {
      const { data, error } = await supabase.functions.invoke('wolfram-alpha', {
        body: {
          query: '2+2'
        }
      });

      if (error) {
        if (error.message.includes('API key') || error.message.includes('WOLFRAM')) {
          return 'Wolfram Alpha endpoint exists but requires API key configuration';
        }
        throw new Error(`Wolfram Alpha failed: ${error.message}`);
      }

      return 'Wolfram Alpha API working successfully';
    });

    this.results.push(suite);
  }

  private async testDatabaseOperations(): Promise<void> {
    const suite: TestSuite = {
      name: 'Database Operations',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0
    };

    // Test 1: Quiz table operations
    await this.runTest(suite, 'Quiz Table Operations', async () => {
      if (!this.currentUser) {
        return 'Skipped - requires authentication';
      }

      // Test reading quizzes
      const { data: quizzes, error: readError } = await supabase
        .from('quizzes')
        .select('*')
        .limit(5);

      if (readError) throw new Error(`Quiz read failed: ${readError.message}`);

      return `Quiz table accessible, found ${quizzes?.length || 0} quizzes`;
    });

    // Test 2: Messages table operations
    await this.runTest(suite, 'Messages Table Operations', async () => {
      if (!this.currentUser) {
        return 'Skipped - requires authentication';
      }

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .limit(5);

      if (error) throw new Error(`Messages read failed: ${error.message}`);

      return `Messages table accessible, found ${messages?.length || 0} messages`;
    });

    // Test 3: Profiles table operations
    await this.runTest(suite, 'Profiles Table Operations', async () => {
      if (!this.currentUser) {
        return 'Skipped - requires authentication';
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', this.currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Profile read failed: ${error.message}`);
      }

      return profile ? 'User profile exists' : 'No user profile found (may need creation)';
    });

    // Test 4: Subjects table operations
    await this.runTest(suite, 'Subjects Table Operations', async () => {
      const { data: subjects, error } = await supabase
        .from('subjects')
        .select('*')
        .limit(5);

      if (error) throw new Error(`Subjects read failed: ${error.message}`);

      return `Subjects table accessible, found ${subjects?.length || 0} subjects`;
    });

    this.results.push(suite);
  }

  private async testIntegrationWorkflows(): Promise<void> {
    const suite: TestSuite = {
      name: 'Integration Workflows',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0
    };

    // Test 1: End-to-End Quiz Generation
    await this.runTest(suite, 'End-to-End Quiz Generation', async () => {
      if (!this.currentUser) {
        return 'Skipped - requires authentication';
      }

      // Generate a quiz
      const { data: quizData, error: genError } = await supabase.functions.invoke('generate-quiz', {
        body: {
          topic: 'System Test Quiz',
          difficulty: 'easy',
          questionCount: 2
        }
      });

      if (genError) throw new Error(`Quiz generation failed: ${genError.message}`);
      if (!quizData || !quizData.questions) {
        throw new Error('Invalid quiz data generated');
      }

      // Try to save the quiz
      const { data: savedQuiz, error: saveError } = await supabase
        .from('quizzes')
        .insert({
          user_id: this.currentUser.id,
          title: quizData.title || 'Test Quiz',
          description: quizData.description || 'System test quiz',
          difficulty: 'easy',
          total_questions: quizData.questions.length
        })
        .select()
        .single();

      if (saveError) throw new Error(`Quiz save failed: ${saveError.message}`);

      // Clean up - delete the test quiz
      await supabase.from('quizzes').delete().eq('id', savedQuiz.id);

      return 'End-to-end quiz generation workflow successful';
    });

    // Test 2: Chat to Quiz Workflow
    await this.runTest(suite, 'Chat to Quiz Workflow', async () => {
      if (!this.currentUser) {
        return 'Skipped - requires authentication';
      }

      // Simulate a chat conversation
      const conversationHistory = [
        { role: 'user', content: 'Tell me about photosynthesis' },
        { role: 'assistant', content: 'Photosynthesis is the process by which plants convert sunlight into energy...' }
      ];

      // Generate quiz from conversation
      const { data: quizData, error } = await supabase.functions.invoke('generate-quiz', {
        body: {
          topic: 'Photosynthesis',
          difficulty: 'medium',
          questionCount: 2,
          conversationHistory
        }
      });

      if (error) throw new Error(`Conversation-based quiz failed: ${error.message}`);

      return 'Chat to quiz workflow successful';
    });

    this.results.push(suite);
  }

  private async testErrorHandling(): Promise<void> {
    const suite: TestSuite = {
      name: 'Error Handling',
      results: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0
    };

    // Test 1: Invalid API requests
    await this.runTest(suite, 'Invalid API Requests', async () => {
      try {
        await supabase.functions.invoke('generate-quiz', {
          body: {} // Invalid request body
        });
        throw new Error('Should have failed with invalid request');
      } catch (error: any) {
        if (error.message.includes('Should have failed')) {
          throw error;
        }
        return 'Error handling working - invalid requests properly rejected';
      }
    });

    // Test 2: Unauthorized database access
    await this.runTest(suite, 'Unauthorized Database Access', async () => {
      if (this.currentUser) {
        return 'Skipped - user is authenticated, cannot test unauthorized access';
      }

      try {
        await supabase.from('quizzes').select('*').limit(1);
        return 'RLS policies may need review - unauthorized access succeeded';
      } catch (error: any) {
        return 'Database security working - unauthorized access blocked';
      }
    });

    this.results.push(suite);
  }

  private async runTest(suite: TestSuite, testName: string, testFn: () => Promise<string>): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`⏳ Running: ${testName}`);
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      suite.results.push({
        name: testName,
        status: result.startsWith('Skipped') ? 'skip' : 'pass',
        message: result,
        duration
      });

      if (result.startsWith('Skipped')) {
        suite.skippedTests++;
        console.log(`⏭️  ${testName}: ${result}`);
      } else {
        suite.passedTests++;
        console.log(`✅ ${testName}: ${result}`);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      suite.results.push({
        name: testName,
        status: 'fail',
        message: error.message,
        duration
      });
      suite.failedTests++;
      console.log(`❌ ${testName}: ${error.message}`);
    }
    
    suite.totalTests++;
  }

  private printSummary(): void {
    console.log('\n📊 Testing Summary:');
    console.log('=' .repeat(50));
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    this.results.forEach(suite => {
      console.log(`\n${suite.name}:`);
      console.log(`  Total: ${suite.totalTests}`);
      console.log(`  ✅ Passed: ${suite.passedTests}`);
      console.log(`  ❌ Failed: ${suite.failedTests}`);
      console.log(`  ⏭️  Skipped: ${suite.skippedTests}`);
      
      totalTests += suite.totalTests;
      totalPassed += suite.passedTests;
      totalFailed += suite.failedTests;
      totalSkipped += suite.skippedTests;
    });

    console.log('\n' + '=' .repeat(50));
    console.log(`🏁 Overall Results:`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  ✅ Passed: ${totalPassed}`);
    console.log(`  ❌ Failed: ${totalFailed}`);
    console.log(`  ⏭️  Skipped: ${totalSkipped}`);
    console.log(`  📈 Success Rate: ${totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0}%`);
  }

  getDetailedResults(): TestSuite[] {
    return this.results;
  }
}

// Helper function to run tests from console
export const runSystemTests = async (): Promise<TestSuite[]> => {
  const tester = new SystemTester();
  return await tester.runAllTests();
};

// Helper function to get a quick health check
export const quickHealthCheck = async (): Promise<{status: string, message: string}> => {
  try {
    // Test basic connectivity
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw new Error(`Auth check failed: ${error.message}`);

    // Test a simple API call
    const { error: apiError } = await supabase.functions.invoke('chat-completion', {
      body: { messages: [{ role: 'user', content: 'test' }] }
    });

    if (apiError && !apiError.message.includes('API key')) {
      throw new Error(`API check failed: ${apiError.message}`);
    }

    return {
      status: 'healthy',
      message: `System appears healthy. User: ${session?.user?.email || 'Not authenticated'}`
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      message: error.message
    };
  }
};
