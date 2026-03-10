
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface TeacherInfo {
  school_id: string;
  teacher_id: string;
  school_name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSchoolAdmin: boolean;
  isTeacher: boolean;
  teacherInfo: TeacherInfo | null;
  isSigningOut: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Sign out timeout duration (10 seconds)
const SIGN_OUT_TIMEOUT = 10000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSchoolAdmin, setIsSchoolAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Force clear auth state - used as fallback
  const forceSignOut = () => {
    console.log('AuthContext: Force clearing auth state');
    setSession(null);
    setUser(null);
    setIsSchoolAdmin(false);
    setIsTeacher(false);
    setTeacherInfo(null);
    setIsSigningOut(false);
    
    // Clear localStorage as backup
    try {
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-twfzlbockonxopuindaw-auth-token');
    } catch (error) {
      console.warn('AuthContext: Could not clear localStorage:', error);
    }
  };

  useEffect(() => {
    console.log('AuthContext: Initializing...');
    
    let isMounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;
        
        console.log('AuthContext: Auth state changed:', {
          event,
          hasSession: !!currentSession,
          userId: currentSession?.user?.id,
          timestamp: new Date().toISOString()
        });
        
        // Handle different auth events
        switch (event) {
          case 'SIGNED_OUT':
            console.log('AuthContext: Processing SIGNED_OUT event');
            setSession(null);
            setUser(null);
            setIsSchoolAdmin(false);
            setIsTeacher(false);
            setTeacherInfo(null);
            setIsSigningOut(false);
            break;
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            console.log(`AuthContext: Processing ${event} event`);
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            // Defer async calls to avoid deadlocking onAuthStateChange
            if (currentSession?.user) {
              setTimeout(() => {
                checkSchoolAdminStatus(currentSession.user.id);
                checkTeacherStatus(currentSession.user.email);
              }, 0);
            }
            break;
          default:
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            if (currentSession?.user) {
              setTimeout(() => {
                checkSchoolAdminStatus(currentSession.user.id);
                checkTeacherStatus(currentSession.user.email);
              }, 0);
            } else {
              setIsSchoolAdmin(false);
              setIsTeacher(false);
              setTeacherInfo(null);
            }
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
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
            
            if (initialSession?.user) {
              await checkSchoolAdminStatus(initialSession.user.id);
              await checkTeacherStatus(initialSession.user.email);
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
    if (isSigningOut) {
      console.log('AuthContext: Sign out already in progress, ignoring');
      return;
    }

    try {
      console.log('AuthContext: Starting sign out process...');
      const startTime = performance.now();
      setIsSigningOut(true);

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Sign out timeout'));
        }, SIGN_OUT_TIMEOUT);
      });

      // Create the sign out promise
      const signOutPromise = supabase.auth.signOut();

      // Race between sign out and timeout
      try {
        await Promise.race([signOutPromise, timeoutPromise]);
        const endTime = performance.now();
        console.log(`AuthContext: Sign out completed in ${endTime - startTime}ms`);
      } catch (error) {
        console.warn('AuthContext: Sign out timed out or failed:', error);
        // Force sign out regardless of Supabase response
        forceSignOut();
        throw error;
      }

      console.log('AuthContext: Sign out completed successfully');
    } catch (error) {
      console.error('AuthContext: Sign out failed:', error);
      // Always force clear state even if sign out failed
      forceSignOut();
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isSchoolAdmin,
    isSigningOut,
    signIn,
    signUp,
    signOut,
  };

  console.log('AuthContext: Current state:', {
    hasUser: !!user,
    loading,
    userId: user?.id,
    isSchoolAdmin,
    isSigningOut
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
