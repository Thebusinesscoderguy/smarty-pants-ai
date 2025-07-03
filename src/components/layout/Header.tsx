
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Menu, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getDisplayName = () => {
    if (!user) return '';
    
    // Check if user has a display name from Google sign-in or other providers
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    
    if (user.user_metadata?.name) {
      return user.user_metadata.name;
    }
    
    // Fallback to email username
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return 'User';
  };

  return (
    <header className="w-full bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 text-white hover:text-purple-300 transition-colors"
          >
            <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              TeachlyAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <nav className="flex items-center space-x-6">
              <Link 
                to="/features" 
                className="text-white/80 hover:text-white transition-colors text-lg"
              >
                Features
              </Link>
              <Link 
                to="/how-it-works" 
                className="text-white/80 hover:text-white transition-colors text-lg"
              >
                How it Works
              </Link>
              <Link 
                to="/pricing" 
                className="text-white/80 hover:text-white transition-colors text-lg"
              >
                Pricing
              </Link>
              {user && (
                <>
                  <Link 
                    to="/chat" 
                    className="text-white/80 hover:text-white transition-colors text-lg"
                  >
                    Chat
                  </Link>
                  <Link 
                    to="/progress" 
                    className="text-white/80 hover:text-white transition-colors text-lg"
                  >
                    Dashboard
                  </Link>
                </>
              )}
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-white/80 text-lg">
                    Welcome, {getDisplayName()}
                  </span>
                  <UserAvatar />
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="border-white/20 bg-white/10 hover:bg-white/20 text-white rounded-xl"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link 
                    to="/demo" 
                    className="text-white/80 hover:text-white transition-colors text-lg"
                  >
                    Try Demo
                  </Link>
                  <Link to="/auth">
                    <Button 
                      variant="outline" 
                      className="border-white/20 bg-white/10 hover:bg-white/20 text-white rounded-xl"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth?signup=true">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-white/10">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/features" 
                className="text-white/80 hover:text-white transition-colors text-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                to="/how-it-works" 
                className="text-white/80 hover:text-white transition-colors text-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                How it Works
              </Link>
              <Link 
                to="/pricing" 
                className="text-white/80 hover:text-white transition-colors text-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>
              {user && (
                <>
                  <Link 
                    to="/chat" 
                    className="text-white/80 hover:text-white transition-colors text-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Chat
                  </Link>
                  <Link 
                    to="/progress" 
                    className="text-white/80 hover:text-white transition-colors text-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </>
              )}
              
              {user ? (
                <div className="flex flex-col space-y-4 pt-4 border-t border-white/10">
                  <span className="text-white/80">Welcome, {getDisplayName()}</span>
                  <Button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    variant="outline"
                    className="border-white/20 bg-white/10 hover:bg-white/20 text-white self-start"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-4 pt-4 border-t border-white/10">
                  <Link 
                    to="/demo" 
                    className="text-white/80 hover:text-white transition-colors text-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Try Demo
                  </Link>
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    <Button 
                      variant="outline" 
                      className="border-white/20 bg-white/10 hover:bg-white/20 text-white w-full"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth?signup=true" onClick={() => setIsMenuOpen(false)}>
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white w-full">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
