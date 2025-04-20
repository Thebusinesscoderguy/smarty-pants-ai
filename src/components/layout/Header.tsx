
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from '@/components/LoginModal';
import SignupModal from '@/components/SignupModal';
import ApiKeyForm from '@/components/ApiKeyForm';
import { useState } from 'react';

export const Header = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
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
              onClick={() => setIsLoginOpen(true)}
            >
              Log in
            </Button>
            <Button 
              className="bg-white text-black hover:bg-gray-200" 
              onClick={() => setIsSignupOpen(true)}
            >
              Sign up
            </Button>
          </>
        )}
      </div>
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <SignupModal isOpen={isSignupOpen} onClose={() => setIsSignupOpen(false)} />
    </header>
  );
};
