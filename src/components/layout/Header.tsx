
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ApiKeyForm from '@/components/ApiKeyForm';

export const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="w-full px-4 md:px-6 py-4 flex items-center justify-between border-b border-white/10">
      <h1 className="text-xl font-bold">Teachly</h1>
      <div className="space-x-4">
        {user ? (
          <>
            <Button variant="outline" className="bg-white text-black hover:bg-gray-200">
              <Link to="/features">Dashboard</Link>
            </Button>
            <ApiKeyForm />
          </>
        ) : (
          <>
            <Button 
              variant="outline" 
              className="text-white border-white/30 hover:bg-white/10" 
              onClick={() => navigate('/auth')}
            >
              Log in
            </Button>
            <Button 
              className="bg-white text-black hover:bg-gray-200" 
              onClick={() => navigate('/auth?signup=true')}
            >
              Sign up
            </Button>
          </>
        )}
      </div>
    </header>
  );
};
