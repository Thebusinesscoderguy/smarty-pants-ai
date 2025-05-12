
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
  const { user, loading, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      navigate('/pricing');
    }
  }, [user, loading, navigate]);

  // Check for URL hash to see if returning from OAuth
  useEffect(() => {
    const handleAuthRedirect = async () => {
      // Check for hash parameters OR query parameters (covers both scenarios)
      const hasAuthParams = (
        window.location.hash && window.location.hash.includes('access_token')
      ) || (
        window.location.search && (
          window.location.search.includes('access_token') ||
          window.location.search.includes('error') ||
          window.location.search.includes('code')
        )
      );
      
      if (hasAuthParams) {
        console.log('Detected OAuth redirect with auth parameters');
        setIsRedirecting(true);
        
        try {
          // Process the URL regardless of parameter type
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error processing OAuth redirect:', error);
            toast({
              title: "Authentication failed",
              description: error.message,
              variant: "destructive",
            });
            setIsRedirecting(false);
            return;
          }
          
          if (data.session) {
            console.log('Successfully authenticated via OAuth');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            navigate('/pricing');
          } else {
            console.error('No session found after OAuth redirect');
            setIsRedirecting(false);
            toast({
              title: "Authentication failed",
              description: "Could not establish a session. Please try again.",
              variant: "destructive",
            });
          }
        } catch (error: any) {
          console.error('Error handling OAuth redirect:', error);
          setIsRedirecting(false);
          toast({
            title: "Authentication error",
            description: error.message || "An error occurred during authentication",
            variant: "destructive",
          });
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
      setIsRedirecting(true);
      setAuthError(null);
      
      console.log("Google auth initiated");
      await signInWithGoogle();
      
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
      setIsRedirecting(false);
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
        <p>Redirecting to Google for authentication...</p>
        <p className="text-sm text-white/60 mt-4">If you're not redirected within a few seconds, please check your popup blocker.</p>
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
