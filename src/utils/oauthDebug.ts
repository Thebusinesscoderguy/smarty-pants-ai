import { supabase } from '@/integrations/supabase/client';

export interface OAuthDebugInfo {
  currentUrl: string;
  redirectUrl: string;
  supabaseUrl: string;
  expectedCallback: string;
  possibleIssues: string[];
  recommendations: string[];
}

export const getOAuthDebugInfo = (): OAuthDebugInfo => {
  const currentUrl = window.location.origin;
  const redirectUrl = `${currentUrl}/chat`;
  const supabaseUrl = 'https://twfzlbockonxopuindaw.supabase.co';
  const expectedCallback = `${supabaseUrl}/auth/v1/callback`;
  
  const possibleIssues: string[] = [];
  const recommendations: string[] = [];
  
  // Check for common issues
  if (currentUrl.includes('localhost')) {
    possibleIssues.push('Running on localhost - ensure localhost URLs are in Google Console');
    recommendations.push('Add http://localhost:3000 to authorized origins in Google Console');
    recommendations.push('Add http://localhost:3000/auth/callback to authorized redirect URIs');
  }
  
  if (currentUrl.includes('lovable.dev')) {
    recommendations.push('Add https://lovable.dev to authorized origins in Google Console');
  }
  
  // General recommendations
  recommendations.push(`Ensure ${expectedCallback} is in Google Console authorized redirect URIs`);
  recommendations.push('Verify Google provider is enabled in Supabase Auth settings');
  recommendations.push('Check that OAuth consent screen is configured and published');
  
  return {
    currentUrl,
    redirectUrl,
    supabaseUrl,
    expectedCallback,
    possibleIssues,
    recommendations
  };
};

export const logOAuthDebugInfo = () => {
  const debugInfo = getOAuthDebugInfo();
  
  console.group('🔍 OAuth Debug Information');
  console.log('Current URL:', debugInfo.currentUrl);
  console.log('Redirect URL:', debugInfo.redirectUrl);
  console.log('Supabase URL:', debugInfo.supabaseUrl);
  console.log('Expected Callback:', debugInfo.expectedCallback);
  
  if (debugInfo.possibleIssues.length > 0) {
    console.warn('⚠️ Possible Issues:');
    debugInfo.possibleIssues.forEach(issue => console.warn(`  - ${issue}`));
  }
  
  console.info('💡 Recommendations:');
  debugInfo.recommendations.forEach(rec => console.info(`  - ${rec}`));
  
  console.groupEnd();
  
  return debugInfo;
};

export const testOAuthConfiguration = async () => {
  try {
    console.log('🧪 Testing OAuth configuration...');
    
    // Test Supabase connection
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Current session:', sessionData.session ? 'Active' : 'None');
    
    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    console.log('Current user:', userData.user ? userData.user.email : 'None');
    
    // Log debug info
    const debugInfo = logOAuthDebugInfo();
    
    return {
      success: true,
      hasSession: !!sessionData.session,
      hasUser: !!userData.user,
      debugInfo
    };
  } catch (error) {
    console.error('❌ OAuth configuration test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};