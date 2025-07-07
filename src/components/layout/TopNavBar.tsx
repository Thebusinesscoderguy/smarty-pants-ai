import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  BarChart3, 
  Settings, 
  FileInput, 
  Mic, 
  Volume2,
  LogOut 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const TopNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, isSigningOut } = useAuth();
  const isDemoMode = location.pathname.startsWith('/demo');
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    try {
      await signOut();
      navigate('/', { replace: true });
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      navigate('/', { replace: true });
      toast({
        title: "Session ended",
        description: "You have been logged out.",
        variant: "destructive",
      });
    }
  };

  const handleFileInput = () => {
    if (fileInputRef) {
      fileInputRef.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "File selected",
        description: `Selected: ${file.name}`,
      });
      // Handle file upload logic here
    }
  };

  const isActive = (path: string) => location.pathname === path;

  if (!user && !isDemoMode) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold text-white">TeachlyAI</span>
          </div>

          {/* Main Navigation */}
          <div className="flex items-center space-x-2">
            {/* File Input */}
            <Button
              onClick={handleFileInput}
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl px-4 py-2"
            >
              <FileInput className="h-4 w-4 mr-2" />
              File Input
            </Button>

            {/* Voice Input */}
            <Button
              onClick={() => navigate('/voice')}
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl px-4 py-2"
            >
              <Mic className="h-4 w-4 mr-2" />
              Voice Input
            </Button>

            {/* Voice Response */}
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl px-4 py-2"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Voice Response
            </Button>

            {/* Chat */}
            <Button
              onClick={() => navigate('/chat')}
              variant={isActive('/chat') ? 'secondary' : 'ghost'}
              size="sm"
              className={`rounded-xl px-4 py-2 ${
                isActive('/chat') 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </Button>

            {/* Dashboard */}
            <Button
              onClick={() => navigate('/progress')}
              variant={isActive('/progress') ? 'secondary' : 'ghost'}
              size="sm"
              className={`rounded-xl px-4 py-2 ${
                isActive('/progress') 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Button>

            {/* Settings */}
            <Button
              onClick={() => navigate('/settings')}
              variant={isActive('/settings') ? 'secondary' : 'ghost'}
              size="sm"
              className={`rounded-xl px-4 py-2 ${
                isActive('/settings') 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>

          {/* Sign Out - only show for authenticated users, not demo */}
          {!isDemoMode && (
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              disabled={isSigningOut}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 rounded-xl px-4 py-2"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </Button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={setFileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="*/*"
      />
    </div>
  );
};