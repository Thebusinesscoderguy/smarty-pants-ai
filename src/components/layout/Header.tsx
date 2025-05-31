
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ApiKeyForm from '@/components/ApiKeyForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useState } from 'react';

export const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      
      console.log("Starting Google sign-in from header...");
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/pricing`,
        },
      });

      if (error) {
        console.error('Google sign-in error:', error);
        throw error;
      }

      console.log('Google sign-in initiated successfully from header');
      
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

  return (
    <header className="w-full px-4 md:px-6 py-4 flex items-center justify-between border-b border-white/10">
      <h1 className="text-xl font-bold">Teachly</h1>
      <div className="space-x-4">
        {user ? (
          <>
            <Button variant="outline" className="bg-white text-black hover:bg-gray-200">
              <Link to="/features">Dashboard</Link>
            </Button>
            <ApiKeyForm />
          </>
        ) : (
          <>
            <Button 
              variant="outline" 
              className="text-white border-white/30 hover:bg-white/10" 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Log in"}
            </Button>
            <Button 
              className="bg-white text-black hover:bg-gray-200" 
              onClick={() => navigate('/auth?signup=true')}
            >
              Sign up
            </Button>
          </>
        )}
      </div>
    </header>
  );
};
