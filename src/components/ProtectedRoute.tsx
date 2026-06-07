import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChildrenManagement } from '@/components/onboarding/ChildrenManagement';
import { UserRoleSelector } from '@/components/onboarding/UserRoleSelector';

// Roles a route can require. A user's effective roles are derived from
// server-backed signals (school_accounts / is_school_teacher RPC / user_roles),
// not from any client-set flag.
export type AppRole = 'student' | 'parent' | 'teacher' | 'admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  // SECURITY (broken access control): when set, the route is gated so only users
  // holding one of these roles may enter. Authentication alone is NOT enough —
  // this stops e.g. a logged-in student from reaching admin/staff pages.
  // NOTE: this is defense-in-depth for the UI; the authoritative boundary is
  // still RLS + edge-function role checks on the data itself.
  allowedRoles?: AppRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading, isSchoolAdmin, isTeacher } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showChildrenManagement, setShowChildrenManagement] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    console.log('ProtectedRoute: Checking user setup', {
      hasUser: !!user,
      loading,
      isSchoolAdmin,
      isTeacher,
      currentPath: location.pathname
    });
    
    // Don't do anything while still loading
    if (loading) return;
    
    // School admins and teachers should never see the parent/child role selector
    if (user && (isSchoolAdmin || isTeacher)) {
      setShowRoleSelector(false);
      return;
    }
    
    // Only show role selector for non-school users on dashboard/home routes
    // Never show it on specific feature routes like /school-admin, /chat, etc.
    if (user && (location.pathname === '/' || location.pathname === '/dashboard')) {
      console.log('ProtectedRoute: User authenticated, showing role selector');
      setShowRoleSelector(true);
      setHasNavigated(false);
    }
  }, [loading, user, location.pathname, isSchoolAdmin, isTeacher]);

  // Show loading while auth is being determined, and — for role-gated routes —
  // until roles have resolved, so we never wrongly deny an admin/teacher during
  // the brief role-fetch window.
  if (loading || (allowedRoles && roleLoading)) {
    console.log('ProtectedRoute: Auth loading, showing spinner');
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center flex-col">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Verifying your session...</p>
      </div>
    );
  }

  // If not loading and no user, redirect to auth
  if (!user) {
    console.log('ProtectedRoute: No user found, redirecting to auth. Current path:', location.pathname);
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // SECURITY (broken access control / privilege escalation): enforce the route's
  // role requirement. The effective role set is built from server-backed signals
  // only (user_roles row, school_accounts admin check, is_school_teacher RPC) —
  // all of which are themselves protected by RLS — so a student cannot fake their
  // way into admin/staff pages by editing client state. Hiding the nav button was
  // never sufficient on its own.
  if (allowedRoles && allowedRoles.length > 0) {
    const effectiveRoles = new Set<AppRole>();
    if (userRole) effectiveRoles.add(userRole);
    if (isSchoolAdmin) effectiveRoles.add('admin');
    if (isTeacher) effectiveRoles.add('teacher');

    const permitted = allowedRoles.some((role) => effectiveRoles.has(role));
    if (!permitted) {
      console.warn('ProtectedRoute: role not permitted for', location.pathname, {
        required: allowedRoles,
        effective: Array.from(effectiveRoles),
      });
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full rounded-lg border border-border bg-card p-6 text-center space-y-3">
            <h1 className="text-lg font-semibold text-foreground">Access denied</h1>
            <p className="text-sm text-muted-foreground">
              You don't have permission to view this page.
            </p>
            <button
              onClick={() => navigate('/dashboard', { replace: true })}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  // Show children management if parent needs to set up children
  if (showChildrenManagement) {
    console.log('ProtectedRoute: Showing children management');
    return (
      <ChildrenManagement 
        onComplete={() => {
          setShowChildrenManagement(false);
          navigate('/monitoring', { replace: true });
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
          // Immediately navigate for child selection without any intermediate state
          if (role === 'child') {
            console.log('ProtectedRoute: Child role selected, navigating to quiz-generator');
            navigate('/quiz-generator', { replace: true });
            return;
          }
          
          console.log('ProtectedRoute: Parent role selected, checking for children');
          setShowRoleSelector(false);
          setHasNavigated(true);
          
          // Stay on current route if it's not dashboard/home, otherwise navigate based on role
          if (location.pathname !== '/dashboard' && location.pathname !== '/') {
            return;
          }
          
          // Handle parent role - check if they need to add children
          try {
            const { data: childrenData, error } = await supabase
              .from('children')
              .select('id')
              .eq('parent_id', user.id);
            
            console.log('ProtectedRoute: Children check result', { childrenData, error });
              
            if (!childrenData || childrenData.length === 0) {
              console.log('ProtectedRoute: No children found, showing children management');
              setShowChildrenManagement(true);
            } else {
              console.log('ProtectedRoute: Children found, navigating to monitoring');
              navigate('/monitoring', { replace: true });
            }
          } catch (error) {
            console.error('ProtectedRoute: Error checking children:', error);
            // If there's an error, still navigate to monitoring
            navigate('/monitoring', { replace: true });
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