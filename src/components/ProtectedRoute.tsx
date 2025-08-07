
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
      if (!user || loading || roleLoading) return;

      // Check if user has a role in the database
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role) {
        // User has a role, navigate accordingly without page reload
        if (profile.role === 'parent') {
          const { data: childrenData } = await supabase
            .from('children')
            .select('id')
            .eq('parent_id', user.id);

          if (!childrenData || childrenData.length === 0) {
            setShowChildrenManagement(true);
            return;
          }
        }
        // For users with roles, don't show role selector again
        return;
      } else {
        // No role found, show role selector
        setShowRoleSelector(true);
      }
    };

    checkUserSetup();
  }, [user, loading, roleLoading]);

  // Show loading only when absolutely necessary
  if (loading) {
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center flex-col">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading...</p>
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
          
          // Navigate based on role selection without full page reload
          if (role === 'parent') {
            try {
              const { data: childrenData } = await supabase
                .from('children')
                .select('id')
                .eq('parent_id', user.id);

              if (!childrenData || childrenData.length === 0) {
                setShowChildrenManagement(true);
              } else {
                // Use React Router navigation instead of window.location
                window.location.replace('/monitoring');
              }
            } catch (error) {
              console.error('Error checking children:', error);
            }
          } else {
            // Use React Router navigation instead of window.location
            window.location.replace('/chat');
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
