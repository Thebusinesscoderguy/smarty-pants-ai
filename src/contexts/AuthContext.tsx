
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSchoolAdmin, setIsSchoolAdmin] = useState(false);

  useEffect(() => {
    console.log('AuthContext: Setting up auth state management...');
    
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
