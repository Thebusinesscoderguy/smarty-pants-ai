
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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('AuthContext: Initializing auth state management...');
    
    let isMounted = true;
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;
        
        console.log('AuthContext: Auth state changed:', {
          event,
          hasSession: !!currentSession,
          userId: currentSession?.user?.id,
          userEmail: currentSession?.user?.email,
          isInitialized
        });
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Check if user is a school admin
        if (currentSession?.user) {
          try {
            const { data: schoolData } = await supabase
              .from('school_accounts')
              .select('id')
              .eq('admin_user_id', currentSession.user.id)
              .single();
            
            if (isMounted) {
              setIsSchoolAdmin(!!schoolData);
            }
          } catch (error) {
            console.error('Error checking school admin status:', error);
            if (isMounted) {
              setIsSchoolAdmin(false);
            }
          }
        } else {
          if (isMounted) {
            setIsSchoolAdmin(false);
          }
        }
        
        // Only set loading to false after we've processed the auth state
        if (isMounted && !isInitialized) {
          console.log('AuthContext: Setting loading to false and marking as initialized');
          setLoading(false);
          setIsInitialized(true);
        }
      }
    );

    // Then check for existing session
    const checkInitialSession = async () => {
      try {
        console.log('AuthContext: Checking for existing session...');
        
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthContext: Error getting session:', error);
          if (isMounted) {
            setLoading(false);
            setIsInitialized(true);
          }
          return;
        }
        
        console.log('AuthContext: Initial session check:', {
          hasSession: !!currentSession,
          userId: currentSession?.user?.id,
          userEmail: currentSession?.user?.email
        });
        
        if (isMounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          // Check if user is a school admin
          if (currentSession?.user) {
            try {
              const { data: schoolData } = await supabase
                .from('school_accounts')
                .select('id')
                .eq('admin_user_id', currentSession.user.id)
                .single();
              
              setIsSchoolAdmin(!!schoolData);
            } catch (error) {
              console.error('Error checking school admin status:', error);
              setIsSchoolAdmin(false);
            }
          } else {
            setIsSchoolAdmin(false);
          }
          
          // Set loading to false and mark as initialized
          console.log('AuthContext: Initial check complete, setting loading to false');
          setLoading(false);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('AuthContext: Error in checkInitialSession:', error);
        if (isMounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    checkInitialSession();

    return () => {
      console.log('AuthContext: Cleaning up auth subscription');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
    hasSession: !!session,
    loading,
    isInitialized,
    userId: user?.id,
    userEmail: user?.email,
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
