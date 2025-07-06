
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Menu, X, MessageSquare, BarChart3 } from 'lucide-react';
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
    
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    
    if (user.user_metadata?.name) {
      return user.user_metadata.name;
    }
    
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return 'User';
  };

  return (
    <header className="w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 text-gray-900 hover:text-gray-700 transition-colors group"
          >
            <div className="p-2 bg-gray-900 rounded-lg group-hover:bg-gray-800 transition-all duration-300">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-semibold">
              TeachlyAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <nav className="flex items-center space-x-8">
              <Link 
                to="/features" 
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                Features
              </Link>
              <Link 
                to="/how-it-works" 
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                How it Works
              </Link>
              <Link 
                to="/pricing" 
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                Pricing
              </Link>
              {user && (
                <div className="flex items-center space-x-4 ml-6 pl-6 border-l border-gray-200">
                  <Link to="/chat">
                    <Button
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Chat</span>
                    </Button>
                  </Link>
                  <Link to="/monitoring">
                    <Button
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Monitoring</span>
                    </Button>
                  </Link>
                </div>
              )}
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-gray-600 text-sm block">
                      Welcome back
                    </span>
                    <span className="text-gray-900 font-medium">
                      {getDisplayName()}
                    </span>
                  </div>
                  <UserAvatar 
                    avatarUrl={user.user_metadata?.avatar_url || null}
                    size="sm"
                  />
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/auth">
                    <Button variant="outline">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth?signup=true">
                    <Button>
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
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-6 pt-6 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/features" 
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                to="/how-it-works" 
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                How it Works
              </Link>
              <Link 
                to="/pricing" 
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>
              {user && (
                <>
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <Link to="/chat" onClick={() => setIsMenuOpen(false)}>
                      <Button
                        variant="outline"
                        className="w-full mb-2"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                    </Link>
                    <Link to="/monitoring" onClick={() => setIsMenuOpen(false)}>
                      <Button
                        variant="outline"
                        className="w-full"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Monitoring
                      </Button>
                    </Link>
                  </div>
                </>
              )}
              
              {user ? (
                <div className="flex flex-col space-y-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <span className="text-gray-600 text-sm">Welcome back</span>
                    <p className="text-gray-900 font-medium">{getDisplayName()}</p>
                  </div>
                  <Button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    variant="outline"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-4 pt-4 border-t border-gray-200">
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth?signup=true" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full">
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
