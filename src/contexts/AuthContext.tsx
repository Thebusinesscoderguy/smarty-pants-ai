
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSchoolAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  logout: (navigate: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSchoolAdmin, setIsSchoolAdmin] = useState(false);

  useEffect(() => {
    console.log('AuthContext: Initializing...');
    
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthContext: Error getting initial session:', error);
        } else {
          console.log('AuthContext: Initial session:', { 
            hasSession: !!initialSession, 
            userId: initialSession?.user?.id 
          });
          
          if (isMounted) {
            setSession(initialSession);
            setUser(initialSession?.user ?? null);
            
            // Check school admin status if user exists
            if (initialSession?.user) {
              await checkSchoolAdminStatus(initialSession.user.id);
            }
          }
        }
      } catch (error) {
        console.error('AuthContext: Error in initialization:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log('AuthContext: Initialization complete, loading set to false');
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;
        
        console.log('AuthContext: Auth state changed:', {
          event,
          hasSession: !!currentSession,
          userId: currentSession?.user?.id
        });
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Check school admin status
        if (currentSession?.user) {
          await checkSchoolAdminStatus(currentSession.user.id);
        } else {
          setIsSchoolAdmin(false);
        }
        
        // Set loading to false after processing auth change
        setLoading(false);
      }
    );

    // Initialize auth state
    initializeAuth();

    return () => {
      console.log('AuthContext: Cleaning up');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkSchoolAdminStatus = async (userId: string) => {
    try {
      const { data: schoolData } = await supabase
        .from('school_accounts')
        .select('id')
        .eq('admin_user_id', userId)
        .single();
      
      setIsSchoolAdmin(!!schoolData);
    } catch (error) {
      console.error('Error checking school admin status:', error);
      setIsSchoolAdmin(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const userData: any = { email, password };
      
      if (firstName || lastName) {
        userData.options = {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName || ''} ${lastName || ''}`.trim()
          }
        };
      }

      const { data, error } = await supabase.auth.signUp(userData);
      return { data, error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    console.log('AuthContext: Signing out...');
    await supabase.auth.signOut();
  };

  const logout = async (navigate: any) => {
    console.log('AuthContext: Logging out...');
    await supabase.auth.signOut();
    navigate('/');
  };

  const value = {
    user,
    loading,
    isSchoolAdmin,
    signIn,
    signUp,
    signOut,
    logout,
  };

  console.log('AuthContext: Current state:', {
    hasUser: !!user,
    loading,
    userId: user?.id,
    isSchoolAdmin
  });

  return (
    <AuthContext.Provider value={value}>
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
