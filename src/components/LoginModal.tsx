
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Login successful",
        description: "Welcome back to Teachly!",
      });

      onClose();
      navigate('/features');
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      await signInWithGoogle();
      // No need to close modal here as the redirect will happen
    } catch (error: any) {
      setIsGoogleLoading(false);
      toast({
        title: "Google login failed",
        description: error.message || "Unable to authenticate with Google",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border border-white/20 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">Log In</DialogTitle>
          <DialogDescription className="text-center text-white/70">
            Enter your credentials to access your account
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
              className="bg-transparent border-white/30 text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Password"
              className="bg-transparent border-white/30 text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-white text-black hover:bg-gray-200"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Log In"}
          </Button>
          
          <div className="relative flex justify-center text-xs uppercase my-4">
            <span className="bg-black px-2 text-white/70">Or continue with</span>
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/20"></span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full border-white/30 bg-transparent text-white hover:bg-white/10"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting to Google...
              </>
            ) : (
              <>
                <FcGoogle className="mr-2 h-4 w-4" />
                Sign in with Google
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
