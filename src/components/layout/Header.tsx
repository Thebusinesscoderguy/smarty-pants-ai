
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useState, useEffect } from 'react';

export const Header = () => {
  const navigate = useNavigate();
  const { user, loading, isSchoolAdmin, isDemoMode, enableDemoMode, disableDemoMode } = useAuth();

  useEffect(() => {
    console.log('Header: Auth state updated:', {
      hasUser: !!user,
      loading,
      userId: user?.id,
      userEmail: user?.email,
      isSchoolAdmin,
      isDemoMode
    });
  }, [user, loading, isSchoolAdmin, isDemoMode]);

  const handleSignOut = async () => {
    try {
      console.log('Header: Signing out...');
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Header: Sign out error:', error);
    }
  };

  const handleDemoMode = () => {
    if (isDemoMode) {
      disableDemoMode();
      toast({
        title: "Demo Mode Disabled",
        description: "You've exited demo mode",
      });
    } else {
      enableDemoMode();
      toast({
        title: "Demo Mode Enabled",
        description: "You're now in school admin demo mode - all operations are real!",
      });
      navigate('/admin');
    }
  };

  console.log('Header: Rendering with user state:', {
    hasUser: !!user,
    loading,
    showAuthButtons: !loading && !user,
    showUserButtons: !loading && !!user,
    isSchoolAdmin,
    isDemoMode
  });

  return (
    <header className="w-full px-4 md:px-6 py-4 flex items-center justify-between border-b border-white/10">
      <h1 className="text-xl font-bold">Teachly</h1>
      <div className="space-x-4">
        {loading ? (
          <div className="text-white/70">Loading...</div>
        ) : user ? (
          <>
            {isDemoMode && (
              <div className="bg-orange-600 text-white px-2 py-1 rounded text-sm">
                DEMO MODE
              </div>
            )}
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
            <Button 
              variant="outline" 
              className="text-white border-white/30 hover:bg-white/10"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </>
        ) : (
          <>
            <Button 
              variant="outline" 
              className="bg-orange-600 text-white hover:bg-orange-700" 
              onClick={handleDemoMode}
            >
              Try School Admin Demo
            </Button>
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
