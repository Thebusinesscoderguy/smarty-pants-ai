
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      console.log('User authenticated, redirecting to pricing');
      navigate('/pricing');
    }
  }, [user, loading, navigate]);

  // Improved OAuth redirect handling
  useEffect(() => {
    const handleAuthRedirect = async () => {
      // Check if we're on a redirect from OAuth
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      
      const hasAuthParams = 
        hashParams.has('access_token') || 
        hashParams.has('error') ||
        searchParams.has('code') ||
        searchParams.has('error');
      
      if (!hasAuthParams) return;
      
      console.log('Processing OAuth redirect...');
      setIsRedirecting(true);
      
      // Check for errors first
      const error = hashParams.get('error') || searchParams.get('error');
      const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
      
      if (error) {
        console.error('OAuth error:', error, errorDescription);
        setAuthError(errorDescription || error);
        toast({
          title: "Authentication failed",
          description: errorDescription || error,
          variant: "destructive",
        });
        setIsRedirecting(false);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      try {
        console.log('Getting session after OAuth redirect...');
        
        // Try to get the session multiple times with delays
        let session = null;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (!session && attempts < maxAttempts) {
          const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error on attempt', attempts + 1, ':', sessionError);
          } else if (currentSession) {
            session = currentSession;
            console.log('Session found on attempt', attempts + 1);
            break;
          }
          
          attempts++;
          if (attempts < maxAttempts) {
            console.log(`Session not found, waiting 1 second before attempt ${attempts + 1}...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (session) {
          console.log('OAuth session established successfully');
          toast({
            title: "Success!",
            description: "Successfully signed in with Google",
          });
          // Clean URL and let auth context handle redirect
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsRedirecting(false);
        } else {
          console.error('Failed to establish session after', maxAttempts, 'attempts');
          setAuthError('Authentication completed but session could not be established. Please try again.');
          toast({
            title: "Authentication failed",
            description: "Could not establish a session. Please try signing in again.",
            variant: "destructive",
          });
          setIsRedirecting(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        
      } catch (error: any) {
        console.error('Error processing OAuth redirect:', error);
        setAuthError(error.message);
        toast({
          title: "Authentication error",
          description: error.message || "An error occurred during authentication",
          variant: "destructive",
        });
        setIsRedirecting(false);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    
    if (!loading) {
      handleAuthRedirect();
    }
  }, [loading]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`
          }
        });

        if (error) throw error;
        
        toast({
          title: "Success!",
          description: "Account created. Please check your email for verification.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        navigate('/pricing');
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      setAuthError(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      console.log("Starting Google sign-in...");
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Google sign-in error:', error);
        throw error;
      }

      console.log('Google sign-in initiated successfully');
      
    } catch (error: any) {
      console.error("Google auth error:", error);
      
      const errorMessage = error.message || "Failed to authenticate with Google";
      setAuthError(errorMessage);
      
      toast({
        title: "Google Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center flex-col">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Checking authentication status...</p>
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center flex-col">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Processing authentication...</p>
        <p className="text-sm text-white/60 mt-4">Establishing your session...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black text-white items-center justify-center">
      <Card className="w-full max-w-md bg-black border border-white/20 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? "Create an account" : "Log in to Teachly"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {authError && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-800 rounded-md text-sm">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-white/30 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-white/30 text-white"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-white text-black hover:bg-gray-200"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : isSignUp ? "Sign Up" : "Log In"}
            </Button>
            
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-white/70 hover:text-white"
              >
                {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up"}
              </button>
            </div>
            
            <div className="relative flex justify-center text-xs uppercase my-4">
              <span className="bg-black px-2 text-white/70">Or continue with</span>
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20"></span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-white/30 bg-transparent text-white hover:bg-white/10"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <FcGoogle className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
