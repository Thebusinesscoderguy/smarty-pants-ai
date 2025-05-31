
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSchoolAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // TEMPORARY: Set to true to experience school admin flow
  const [isSchoolAdmin, setIsSchoolAdmin] = useState(true);

  useEffect(() => {
    console.log('AuthContext: Setting up auth state management...');
    
    // TEMPORARY: Create a mock user for school admin experience
    if (isSchoolAdmin) {
      const mockUser = {
        id: 'temp-admin-id',
        email: 'admin@school.edu',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        role: 'authenticated'
      } as User;
      
      const mockSession = {
        user: mockUser,
        access_token: 'temp-token',
        refresh_token: 'temp-refresh',
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer'
      } as Session;
      
      setUser(mockUser);
      setSession(mockSession);
      setLoading(false);
      return;
    }

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('AuthContext: Auth state changed:', {
          event,
          hasSession: !!currentSession,
          userId: currentSession?.user?.id,
          userEmail: currentSession?.user?.email
        });
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    // Then check for existing session
    const checkSession = async () => {
      try {
        console.log('AuthContext: Checking for existing session...');
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthContext: Error getting session:', error);
        } else {
          console.log('AuthContext: Initial session check:', {
            hasSession: !!currentSession,
            userId: currentSession?.user?.id,
            userEmail: currentSession?.user?.email
          });
        }
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error('AuthContext: Error in checkSession:', error);
        setLoading(false);
      }
    };

    checkSession();

    return () => {
      console.log('AuthContext: Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [isSchoolAdmin]);

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
    if (isSchoolAdmin) {
      // TEMPORARY: Just reset the mock state
      setUser(null);
      setSession(null);
      setIsSchoolAdmin(false);
    } else {
      await supabase.auth.signOut();
    }
  };

  const value = {
    user,
    loading,
    isSchoolAdmin,
    signIn,
    signUp,
    signOut,
  };

  console.log('AuthContext: Current state:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
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
