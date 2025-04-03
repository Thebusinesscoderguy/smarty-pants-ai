
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Handle access tokens in the URL hash for OAuth callbacks
    const handleHashParams = async () => {
      // If URL has a hash with access_token, we need to process it
      if (location.hash && location.hash.includes('access_token')) {
        try {
          // Let Supabase Auth handle the token exchange
          const { data, error } = await supabase.auth.getSessionFromUrl();
          
          if (error) {
            console.error('Error getting session from URL:', error);
          } else if (data?.session) {
            console.log('Successfully authenticated from OAuth provider');
            // Remove the hash params from the URL
            window.history.replaceState({}, document.title, location.pathname);
            // Navigate to the pricing page
            navigate('/pricing');
          }
        } catch (error) {
          console.error('Error processing auth callback:', error);
        }
      }
    };

    handleHashParams();
  }, [location.hash, navigate, location.pathname]);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
