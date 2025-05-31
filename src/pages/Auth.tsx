
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

  // Simplified OAuth redirect handling
  useEffect(() => {
    const handleAuthRedirect = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      
      const hasAuthParams = 
        hashParams.has('access_token') || 
        hashParams.has('error') ||
        searchParams.has('code') ||
        searchParams.has('error');
      
      if (hasAuthParams) {
        console.log('Detected OAuth redirect params');
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
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }

        try {
          // Get the current session - Supabase should have processed the OAuth callback
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            throw sessionError;
          }
          
          if (session) {
            console.log('Session established successfully');
            // Clean the URL and let the auth context handle the redirect
            window.history.replaceState({}, document.title, window.location.pathname);
            setIsRedirecting(false);
            // The useEffect above will handle navigation once user state updates
            return;
          }
          
          // If no session yet, wait a bit for the auth state to update
          console.log('No session found immediately, waiting for auth state change...');
          
          // Set a timeout to show error if session isn't established
          setTimeout(() => {
            supabase.auth.getSession().then(({ data: { session: laterSession } }) => {
              if (!laterSession) {
                console.error('Session still not established after delay');
                setAuthError('Authentication completed but session could not be established. Please try again.');
                toast({
                  title: "Authentication failed",
                  description: "Could not establish a session. Please try again.",
                  variant: "destructive",
                });
                setIsRedirecting(false);
                window.history.replaceState({}, document.title, window.location.pathname);
              } else {
                console.log('Session established after delay');
                setIsRedirecting(false);
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            });
          }, 3000);
          
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
      }
    };
    
    if (!loading) {
      handleAuthRedirect();
    }
  }, [loading, navigate]);

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
        <p className="text-sm text-white/60 mt-4">Please wait while we establish your session.</p>
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
            
            <div className="text-xs text-center mt-4 text-white/50">
              <p>For Google Sign In to work correctly:</p>
              <ul className="list-disc list-inside mt-1 text-left">
                <li>Make sure your application URL is added to authorized redirect URLs in Google Cloud Console.</li>
                <li>For local testing: add <code className="bg-black/40 px-1">http://localhost:5173</code> to authorized origins in Google Cloud Console.</li>
                <li>For production: add your public domain to authorized origins.</li>
                <li>The callback URL in Google Cloud Console should be <code className="bg-black/40 px-1">https://twfzlbockonxopuindaw.supabase.co/auth/v1/callback</code></li>
                <li>The site URL in Supabase must match your application URL.</li>
              </ul>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
