
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export const Header = () => {
  const navigate = useNavigate();
  const { user, loading, isSchoolAdmin, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    console.log('Header: Auth state updated:', {
      hasUser: !!user,
      loading,
      userId: user?.id,
      userEmail: user?.email,
      isSchoolAdmin
    });
  }, [user, loading, isSchoolAdmin]);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    try {
      console.log('Header: Starting sign out process...');
      setIsSigningOut(true);
      
      await signOut();
      
      console.log('Header: Sign out successful, navigating to home');
      navigate('/', { replace: true });
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      console.error('Header: Sign out error:', error);
      toast({
        title: "Sign out failed",
        description: "There was an error signing you out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  console.log('Header: Rendering with user state:', {
    hasUser: !!user,
    loading,
    showAuthButtons: !user,
    showUserButtons: !!user,
    isSchoolAdmin,
    isSigningOut
  });

  return (
    <header className="w-full px-4 md:px-6 py-4 flex items-center justify-between border-b border-white/10">
      <div className="flex items-center space-x-8">
        <Link to="/">
          <h1 className="text-2xl md:text-3xl font-bold">TeachlyAI</h1>
        </Link>
        {!user && (
          <nav className="hidden md:flex space-x-6">
            <Link to="/how-it-works" className="text-white/80 hover:text-white transition-colors">
              How it Works
            </Link>
            <Link to="/pricing" className="text-white/80 hover:text-white transition-colors">
              Pricing
            </Link>
          </nav>
        )}
      </div>
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            {isSchoolAdmin ? (
              <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                <Link to="/admin">School Dashboard</Link>
              </Button>
            ) : (
              <Button variant="outline" className="bg-white text-black hover:bg-gray-200">
                <Link to="/progress">Dashboard</Link>
              </Button>
            )}
            <Button variant="outline" className="bg-green-600 text-white hover:bg-green-700">
              <Link to="/chat">AI Tutor</Link>
            </Button>
            <Button variant="outline" className="bg-purple-600 text-white hover:bg-purple-700">
              <Link to="/pricing-checkout">Subscription</Link>
            </Button>
            <Button 
              variant="outline" 
              className="text-white border-white/30 hover:bg-white/10"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </Button>
          </>
        ) : (
          <>
            <Button 
              variant="outline" 
              className="text-white border-white/30 hover:bg-white/10" 
              onClick={() => navigate('/auth')}
            >
              Log in
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
