import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const Header = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  return (
    <header className="w-full px-6 py-4 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-xl font-semibold text-foreground hover:text-foreground/80">
          <GraduationCap className="w-6 h-6" />
          Teachly
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Home</Link>
          <Link to="/features" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Features</Link>
          <Link to="/how-it-works" className="text-foreground/70 hover:text-foreground font-medium transition-colors">How It Works</Link>
          <Link to="/pricing" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Pricing</Link>
          
          {user ? (
            <>
              <Link to="/chat" className="text-foreground/70 hover:text-foreground font-medium transition-colors">Dashboard</Link>
              <Button 
                onClick={handleSignOut}
                variant="outline" 
                size="sm"
                className="rounded-full"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => navigate('/auth')}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
            >
              Get Started
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};
