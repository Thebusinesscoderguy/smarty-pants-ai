
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChildrenManagement } from '@/components/onboarding/ChildrenManagement';
import { UserRoleSelector } from '@/components/onboarding/UserRoleSelector';
import { ParentDashboard } from '@/components/dashboards/ParentDashboard';
import { StudentDashboard } from '@/components/dashboards/StudentDashboard';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showChildrenManagement, setShowChildrenManagement] = useState(false);
  const [needsChildSetup, setNeedsChildSetup] = useState(false);

  console.log('ProtectedRoute: userRole from hook:', userRole, 'roleLoading:', roleLoading);

  useEffect(() => {
    const checkUserSetup = async () => {
      if (!user || loading || roleLoading) return;

      console.log('ProtectedRoute: Current state:', {
        path: location.pathname,
        loading,
        roleLoading,
        hasUser: !!user,
        userId: user?.id,
        userRole
      });

      // Check if user has a role in the database
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role) {
        // User has a role, navigate accordingly
        console.log('ProtectedRoute: User has role:', profile.role);
        if (profile.role === 'parent') {
          // Check if they need to add children
          const { data: childrenData } = await supabase
            .from('children')
            .select('id')
            .eq('parent_id', user.id);

          if (!childrenData || childrenData.length === 0) {
            setShowChildrenManagement(true);
          } else {
            // Existing parent, go to monitoring
            window.location.href = '/monitoring';
          }
        } else {
          // Child/student, go to chat
          window.location.href = '/chat';
        }
      } else {
        // No role found, show role selector
        console.log('ProtectedRoute: No role found, showing selector');
        setShowRoleSelector(true);
      }
    };

    checkUserSetup();
  }, [loading, user, location.pathname, roleLoading, userRole]);

  // Show loading while auth or role is being determined
  if (loading || roleLoading) {
    console.log('ProtectedRoute: Loading state, showing spinner');
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center flex-col">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Verifying your session...</p>
      </div>
    );
  }

  // If not loading and no user, redirect to auth
  if (!user) {
    console.log('ProtectedRoute: No user found, redirecting to auth');
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Show children management if parent needs to set up children
  if (showChildrenManagement) {
    console.log('ProtectedRoute: Showing children management');
    return (
      <ChildrenManagement 
        onComplete={() => {
          setShowChildrenManagement(false);
          setNeedsChildSetup(false);
        }} 
      />
    );
  }

  // Show role selector - always show this to let user choose their role for this session
  if (showRoleSelector) {
    console.log('ProtectedRoute: Showing role selector');
    return (
      <UserRoleSelector 
        onRoleSelected={async (role, childId) => {
          setShowRoleSelector(false);
          
          // Save the role to the database (convert 'child' to 'student')
          const dbRole = role === 'child' ? 'student' : role;
          await supabase
            .from('profiles')
            .upsert({ 
              id: user.id, 
              role: dbRole 
            });
          
          // Navigate based on role selection
          if (role === 'parent') {
            // Check if they need to add children (new parent with no children)
            try {
              const { data: childrenData } = await supabase
                .from('children')
                .select('id')
                .eq('parent_id', user.id);

              if (!childrenData || childrenData.length === 0) {
                setShowChildrenManagement(true);
              } else {
                // Existing parent, go directly to monitoring
                window.location.href = '/monitoring';
              }
            } catch (error) {
              console.error('Error checking children:', error);
            }
          } else {
            // Child selected, go to chat
            window.location.href = '/chat';
          }
        }} 
      />
    );
  }

  // Check if we're on a dashboard route and should show role-specific dashboard
  if (location.pathname === '/dashboard' || location.pathname === '/') {
    // Don't auto-navigate here, let the role selector handle navigation
    return null;
  }

  // User is authenticated, show protected content
  console.log('ProtectedRoute: User authenticated, showing content');
  return <>{children}</>;
};

export default ProtectedRoute;
