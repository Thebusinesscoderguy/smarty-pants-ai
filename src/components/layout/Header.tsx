
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
    <header className="w-full bg-black/30 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 text-white hover:text-purple-300 transition-colors group"
          >
            <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl group-hover:from-purple-500 group-hover:to-blue-500 transition-all duration-300">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              TeachlyAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <nav className="flex items-center space-x-6">
              <Link 
                to="/features" 
                className="text-white/80 hover:text-white transition-colors text-lg font-medium hover:scale-105 transform duration-200"
              >
                Features
              </Link>
              <Link 
                to="/how-it-works" 
                className="text-white/80 hover:text-white transition-colors text-lg font-medium hover:scale-105 transform duration-200"
              >
                How it Works
              </Link>
              <Link 
                to="/pricing" 
                className="text-white/80 hover:text-white transition-colors text-lg font-medium hover:scale-105 transform duration-200"
              >
                Pricing
              </Link>
              {user && (
                <div className="flex items-center space-x-4 ml-6 pl-6 border-l border-white/20">
                  <Link to="/chat">
                    <Button
                      variant="outline"
                      className="border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 hover:text-white transition-all duration-300 rounded-xl flex items-center space-x-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Chat</span>
                    </Button>
                  </Link>
                  <Link to="/monitoring">
                    <Button
                      variant="outline"
                      className="border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-200 hover:text-white transition-all duration-300 rounded-xl flex items-center space-x-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Monitoring</span>
                    </Button>
                  </Link>
                  <Link 
                    to="/progress" 
                    className="text-white/80 hover:text-white transition-colors text-lg font-medium hover:scale-105 transform duration-200"
                  >
                    Dashboard
                  </Link>
                </div>
              )}
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-white/90 text-sm font-medium block">
                      Welcome back
                    </span>
                    <span className="text-purple-300 text-lg font-semibold">
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
                    className="border-white/30 bg-white/10 hover:bg-red-500/20 hover:border-red-400/30 text-white hover:text-red-200 rounded-xl transition-all duration-300"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link 
                    to="/demo" 
                    className="text-yellow-300 hover:text-yellow-200 transition-colors text-lg font-medium hover:scale-105 transform duration-200"
                  >
                    Try Demo
                  </Link>
                  <Link to="/auth">
                    <Button 
                      variant="outline" 
                      className="border-white/30 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth?signup=true">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
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
            className="md:hidden text-white hover:bg-white/10 rounded-xl"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-6 pt-6 border-t border-white/20 bg-black/20 backdrop-blur-sm rounded-xl p-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/features" 
                className="text-white/80 hover:text-white transition-colors text-lg font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                to="/how-it-works" 
                className="text-white/80 hover:text-white transition-colors text-lg font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                How it Works
              </Link>
              <Link 
                to="/pricing" 
                className="text-white/80 hover:text-white transition-colors text-lg font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>
              {user && (
                <>
                  <div className="border-t border-white/20 pt-4 mt-4">
                    <Link to="/chat" onClick={() => setIsMenuOpen(false)}>
                      <Button
                        variant="outline"
                        className="w-full border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 hover:text-white mb-2"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                    </Link>
                    <Link to="/monitoring" onClick={() => setIsMenuOpen(false)}>
                      <Button
                        variant="outline"
                        className="w-full border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-200 hover:text-white mb-2"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Monitoring
                      </Button>
                    </Link>
                  </div>
                  <Link 
                    to="/progress" 
                    className="text-white/80 hover:text-white transition-colors text-lg font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </>
              )}
              
              {user ? (
                <div className="flex flex-col space-y-4 pt-4 border-t border-white/20">
                  <div className="text-center">
                    <span className="text-white/90 text-sm">Welcome back</span>
                    <p className="text-purple-300 text-lg font-semibold">{getDisplayName()}</p>
                  </div>
                  <Button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    variant="outline"
                    className="border-white/30 bg-white/10 hover:bg-red-500/20 text-white self-start"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-4 pt-4 border-t border-white/20">
                  <Link 
                    to="/demo" 
                    className="text-yellow-300 hover:text-yellow-200 transition-colors text-lg font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Try Demo
                  </Link>
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    <Button 
                      variant="outline" 
                      className="border-white/30 bg-white/10 hover:bg-white/20 text-white w-full"
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
