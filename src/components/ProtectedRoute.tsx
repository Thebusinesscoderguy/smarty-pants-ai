
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

  useEffect(() => {
    const checkUserSetup = async () => {
      if (!user || roleLoading) return;

      console.log('ProtectedRoute: Current state:', {
        path: location.pathname,
        loading,
        hasUser: !!user,
        userId: user?.id,
        userRole,
        roleLoading
      });

      // If no role set, show role selector
      if (!userRole) {
        setShowRoleSelector(true);
        return;
      }

      // Reset other states if role is set
      setShowRoleSelector(false);
      setShowChildrenManagement(false);
      setNeedsChildSetup(false);
    };

    checkUserSetup();
  }, [loading, user, location.pathname, userRole, roleLoading]);

  // Show loading only while auth is being determined
  if (loading || roleLoading) {
    console.log('ProtectedRoute: Auth/Role loading, showing spinner');
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

  // Show role selector if needed
  if (showRoleSelector) {
    console.log('ProtectedRoute: Showing role selector');
    return (
      <UserRoleSelector 
        onRoleSelected={async (role, childId) => {
          setShowRoleSelector(false);
          // If parent role selected, check if they need to add children (new user)
          if (role === 'parent') {
            try {
              const { data: childrenData } = await supabase
                .from('parent_child_relationships')
                .select('child_id')
                .eq('parent_id', user.id);

              if (!childrenData || childrenData.length === 0) {
                setShowChildrenManagement(true);
              }
            } catch (error) {
              console.error('Error checking children:', error);
            }
          }
        }} 
      />
    );
  }

  // Check if we're on a dashboard route and should show role-specific dashboard
  if (location.pathname === '/dashboard' || location.pathname === '/') {
    if (userRole === 'parent') {
      return <ParentDashboard />;
    } else if (userRole === 'student') {
      return <StudentDashboard />;
    }
  }

  // User is authenticated, show protected content
  console.log('ProtectedRoute: User authenticated, showing content');
  return <>{children}</>;
};

export default ProtectedRoute;
