
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useState, useEffect } from 'react';

export const Header = () => {
  const navigate = useNavigate();
  const { user, loading, isSchoolAdmin } = useAuth();

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
    try {
      console.log('Header: Signing out...');
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Header: Sign out error:', error);
    }
  };

  console.log('Header: Rendering with user state:', {
    hasUser: !!user,
    loading,
    showAuthButtons: !loading && !user,
    showUserButtons: !loading && !!user,
    isSchoolAdmin
  });

  return (
    <header className="w-full px-4 md:px-6 py-4 flex items-center justify-between border-b border-white/10">
      <h1 className="text-xl font-bold">Teachly</h1>
      <div className="space-x-4">
        {loading ? (
          <div className="text-white/70">Loading...</div>
        ) : user ? (
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
