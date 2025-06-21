
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  // Handle URL params and redirect authenticated users
  useEffect(() => {
    console.log('Auth: Effect triggered', {
      hasUser: !!user,
      loading,
      pathname: location.pathname
    });

    // Set signup mode from URL
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('signup') === 'true') {
      setIsSignUp(true);
    }

    // Redirect authenticated users (only when auth loading is complete)
    if (!loading && user) {
      console.log('Auth: User authenticated, redirecting to onboarding');
      navigate('/onboarding', { replace: true });
    }
  }, [user, loading, navigate, location.search]);

  const getUserRole = () => {
    const urlParams = new URLSearchParams(location.search);
    return urlParams.get('role') as 'school' | 'parent' | null;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const role = getUserRole();
      
      if (isSignUp) {
        const userData: any = { 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
            data: {
              first_name: firstName,
              last_name: lastName,
              full_name: `${firstName} ${lastName}`.trim(),
              role: role || 'student'
            }
          }
        };

        const { error } = await supabase.auth.signUp(userData);

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
        
        console.log('Auth: Login successful');
        // Navigation will be handled by the useEffect when user state updates
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
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
      
      console.log("Starting Google sign-in...");
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (error) {
        console.error('Google sign-in error:', error);
        throw error;
      }

      console.log('Google sign-in initiated successfully');
      
    } catch (error: any) {
      console.error("Google auth error:", error);
      
      toast({
        title: "Google Sign In Failed",
        description: error.message || "Failed to authenticate with Google",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Show loading only while auth context is loading
  if (loading) {
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center flex-col">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading...</p>
      </div>
    );
  }

  // If user exists, show redirecting message (brief moment before redirect happens)
  if (user) {
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center flex-col">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Redirecting...</p>
      </div>
    );
  }

  // Show auth form for non-authenticated users
  const role = getUserRole();
  const roleTitle = role === 'school' ? 'School Account' : role === 'parent' ? 'Parent Account' : 'TeachlyAI';

  return (
    <div className="flex min-h-screen bg-black text-white items-center justify-center">
      <Card className="w-full max-w-md bg-black border border-white/20 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? `Create ${roleTitle}` : `Log in to ${roleTitle}`}
          </CardTitle>
          {role && (
            <p className="text-sm text-white/70 mt-2">
              {role === 'school' 
                ? 'Set up your educational institution account' 
                : 'Create an account for you and your child'
              }
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-transparent border-white/30 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-transparent border-white/30 text-white"
                    required
                  />
                </div>
              </div>
            )}
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
