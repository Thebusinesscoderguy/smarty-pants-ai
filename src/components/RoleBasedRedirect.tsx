import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';

export const RoleBasedRedirect = () => {
  const { userRole, loading } = useUserRole();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (userRole === 'parent') {
        navigate('/parent-monitoring');
      } else if (userRole === 'student') {
        navigate('/chat');
      } else {
        navigate('/chat'); // Default to chat for teachers and others
      }
    }
  }, [userRole, loading, user, navigate]);

  return null;
};