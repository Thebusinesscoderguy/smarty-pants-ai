
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSchoolAdmin: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user object for school admin - using a consistent ID for database operations
const DEMO_USER: User = {
  id: 'demo-school-admin-id',
  email: 'demo@school.com',
  app_metadata: {},
  user_metadata: {
    first_name: 'Demo',
    last_name: 'Admin',
    full_name: 'Demo Admin'
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  role: 'authenticated',
  updated_at: new Date().toISOString()
} as User;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSchoolAdmin, setIsSchoolAdmin] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    console.log('AuthContext: Setting up auth state management...');
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('AuthContext: Auth state changed:', {
          event,
          hasSession: !!currentSession,
          userId: currentSession?.user?.id,
          userEmail: currentSession?.user?.email,
          isDemoMode
        });
        
        if (!isDemoMode) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          // Check if user is a school admin
          if (currentSession?.user) {
            const { data: schoolData } = await supabase
              .from('school_accounts')
              .select('id')
              .eq('admin_user_id', currentSession.user.id)
              .single();
            
            setIsSchoolAdmin(!!schoolData);
          } else {
            setIsSchoolAdmin(false);
          }
        }
        
        setLoading(false);
      }
    );

    // Then check for existing session
    const checkSession = async () => {
      try {
        console.log('AuthContext: Checking for existing session...');
        
        if (isDemoMode) {
          setLoading(false);
          return;
        }
        
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
          const { data: schoolData } = await supabase
            .from('school_accounts')
            .select('id')
            .eq('admin_user_id', currentSession.user.id)
            .single();
          
          setIsSchoolAdmin(!!schoolData);
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
  }, [isDemoMode]);

  const enableDemoMode = async () => {
    console.log('AuthContext: Enabling demo mode...');
    setIsDemoMode(true);
    setUser(DEMO_USER);
    setIsSchoolAdmin(true);
    setLoading(false);
    
    // Create/ensure demo school account exists for real database operations
    try {
      const { data: existingSchool } = await supabase
        .from('school_accounts')
        .select('id')
        .eq('admin_user_id', DEMO_USER.id)
        .single();
      
      if (!existingSchool) {
        const { error } = await supabase
          .from('school_accounts')
          .insert({
            admin_user_id: DEMO_USER.id,
            school_name: 'Demo School',
            plan_type: 'school',
            student_limit: 1000,
            is_active: true
          });
        
        if (error) {
          console.error('Failed to create demo school account:', error);
        } else {
          console.log('Demo school account created successfully');
        }
      } else {
        console.log('Demo school account already exists');
      }
    } catch (error) {
      console.error('Error setting up demo school:', error);
    }
  };

  const disableDemoMode = () => {
    console.log('AuthContext: Disabling demo mode...');
    setIsDemoMode(false);
    setUser(null);
    setIsSchoolAdmin(false);
    setLoading(true);
    // This will trigger the auth state check again
  };

  const signIn = async (email: string, password: string) => {
    if (isDemoMode) {
      disableDemoMode();
    }
    
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
    if (isDemoMode) {
      disableDemoMode();
    }
    
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
    if (isDemoMode) {
      disableDemoMode();
    } else {
      await supabase.auth.signOut();
    }
  };

  const value = {
    user,
    loading,
    isSchoolAdmin,
    isDemoMode,
    signIn,
    signUp,
    signOut,
    enableDemoMode,
    disableDemoMode,
  };

  console.log('AuthContext: Current state:', {
    hasUser: !!user,
    hasSession: !!session,
    loading,
    userId: user?.id,
    userEmail: user?.email,
    isSchoolAdmin,
    isDemoMode
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
