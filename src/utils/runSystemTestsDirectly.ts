
import { runSystemTests, quickHealthCheck } from './systemTester';

// Execute system tests immediately when this module loads
export const executeSystemTests = async () => {
  console.log('🚀 Starting comprehensive system testing...');
  
  try {
    // First run a quick health check
    console.log('📋 Running quick health check...');
    const healthResult = await quickHealthCheck();
    console.log('Health Check Result:', healthResult);
    
    // Then run the full test suite
    console.log('🔍 Running comprehensive test suite...');
    const testResults = await runSystemTests();
    
    // Summary statistics
    const totalTests = testResults.reduce((sum, suite) => sum + suite.totalTests, 0);
    const passedTests = testResults.reduce((sum, suite) => sum + suite.passedTests, 0);
    const failedTests = testResults.reduce((sum, suite) => sum + suite.failedTests, 0);
    const skippedTests = testResults.reduce((sum, suite) => sum + suite.skippedTests, 0);
    
    console.log('\n🏁 FINAL TEST RESULTS:');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⏭️ Skipped: ${skippedTests}`);
    console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    return {
      healthCheck: healthResult,
      testResults,
      summary: {
        totalTests,
        passedTests,
        failedTests,
        skippedTests,
        successRate: Math.round((passedTests / totalTests) * 100)
      }
    };
    
  } catch (error) {
    console.error('❌ System testing failed:', error);
    return {
      error: error.message,
      healthCheck: { status: 'failed', message: error.message }
    };
  }
};

// Auto-run tests when imported
executeSystemTests().then(results => {
  console.log('System testing completed. Results available in console.');
}).catch(error => {
  console.error('Failed to execute system tests:', error);
});
