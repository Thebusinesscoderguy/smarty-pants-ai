import { useState } from 'react';
import { 
  Settings, 
  Volume2, 
  CreditCard, 
  LogOut, 
  Trash2, 
  ChevronDown,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const VOICE_OPTIONS = [
  { value: 'alloy', label: 'Alloy (Default)', description: 'Balanced and clear' },
  { value: 'echo', label: 'Echo', description: 'Deep and resonant' },
  { value: 'fable', label: 'Fable', description: 'Warm and storytelling' },
  { value: 'onyx', label: 'Onyx', description: 'Strong and confident' },
  { value: 'nova', label: 'Nova', description: 'Bright and energetic' },
  { value: 'shimmer', label: 'Shimmer', description: 'Gentle and soothing' },
];

interface SettingsBarProps {
  className?: string;
  variant?: 'default' | 'compact';
}

const SettingsBar = ({ className = '', variant = 'default' }: SettingsBarProps) => {
  const { user, signOut, isSigningOut } = useAuth();
  const navigate = useNavigate();
  
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);

  const handleLogout = async () => {
    if (isSigningOut) return;
    
    try {
      await signOut();
      navigate('/', { replace: true });
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/', { replace: true });
      toast({
        title: "Session ended",
        description: "You have been logged out. If issues persist, please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    try {
      // Update subscription status in database
      if (user) {
        const { error } = await supabase
          .from('subscribers')
          .update({ 
            subscribed: false,
            subscription_end: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;
      }

      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully.",
      });
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      if (user) {
        // Delete user data and account
        const { error } = await supabase.rpc('delete_user_account', {
          user_id: user.id
        });
        
        if (error) {
          // Fallback to auth deletion if RPC doesn't exist
          const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
          if (authError) throw authError;
        }
        
        toast({
          title: "Account Deleted",
          description: "Your account has been deleted successfully.",
        });
        navigate('/');
      }
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleVoiceChange = (voice: string) => {
    setSelectedVoice(voice);
    // Store voice preference in localStorage or user preferences
    localStorage.setItem('preferredVoice', voice);
    toast({
      title: "Voice Updated",
      description: `AI voice changed to ${VOICE_OPTIONS.find(v => v.value === voice)?.label}`,
    });
  };

  const testVoice = () => {
    const selectedOption = VOICE_OPTIONS.find(v => v.value === selectedVoice);
    toast({
      title: "Voice Test",
      description: `Testing ${selectedOption?.label} voice...`,
    });
  };

  if (!user) return null;

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 hover:bg-white/20">
              <Settings className="h-4 w-4 mr-2" />
              Settings
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-gray-900/95 border-gray-700">
            <DropdownMenuLabel className="text-white">Account Settings</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-700" />
            
            <DropdownMenuItem 
              onClick={() => setShowVoiceDialog(true)}
              className="text-white hover:bg-white/10 cursor-pointer"
            >
              <Volume2 className="mr-2 h-4 w-4" />
              Choose AI Voice
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={handleCancelSubscription}
              disabled={isLoading}
              className="text-white hover:bg-white/10 cursor-pointer"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {isLoading ? 'Cancelling...' : 'Cancel Subscription'}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-gray-700" />
            
            <DropdownMenuItem 
              onClick={handleLogout}
              disabled={isSigningOut}
              className="text-white hover:bg-white/10 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isSigningOut ? 'Signing out...' : 'Log Out'}
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-gray-700" />
            
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-400 hover:bg-red-500/20 cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Voice Selection Dialog */}
        <Dialog open={showVoiceDialog} onOpenChange={setShowVoiceDialog}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Volume2 className="mr-2 h-5 w-5" />
                Choose AI Voice
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Select the voice for your AI assistant
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="bg-white/10 border-white/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {VOICE_OPTIONS.map((voice) => (
                    <SelectItem key={voice.value} value={voice.value} className="text-white hover:bg-white/10">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{voice.label}</span>
                        <span className="text-sm text-gray-400">{voice.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={testVoice} className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                Test Voice
              </Button>
              <Button onClick={() => {
                handleVoiceChange(selectedVoice);
                setShowVoiceDialog(false);
              }}>
                Save Voice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Account Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center text-red-400">
                <Trash2 className="mr-2 h-5 w-5" />
                Delete Account
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                This action cannot be undone. This will permanently delete your account and remove all your data.
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-300 text-sm">
                ⚠️ Warning: All your progress, chat history, and account data will be permanently lost.
              </p>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? 'Deleting...' : 'Delete Account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Default variant - horizontal bar layout
  return (
    <div className={`flex items-center gap-4 p-4 bg-white/5 border border-white/20 rounded-lg backdrop-blur-sm ${className}`}>
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-white/70" />
        <span className="text-white/70 text-sm">{user.email}</span>
      </div>
      
      <div className="flex-1" />
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowVoiceDialog(true)}
        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        <Volume2 className="h-4 w-4 mr-2" />
        Voice
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleCancelSubscription}
        disabled={isLoading}
        className="bg-white/10 border-white/20 text-orange-300 hover:bg-orange-500/20"
      >
        <CreditCard className="h-4 w-4 mr-2" />
        {isLoading ? 'Cancelling...' : 'Cancel Sub'}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        disabled={isSigningOut}
        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        <LogOut className="h-4 w-4 mr-2" />
        {isSigningOut ? 'Signing out...' : 'Log Out'}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDeleteDialog(true)}
        className="bg-white/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>

      {/* Voice Selection Dialog */}
      <Dialog open={showVoiceDialog} onOpenChange={setShowVoiceDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Volume2 className="mr-2 h-5 w-5" />
              Choose AI Voice
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Select the voice for your AI assistant
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger className="bg-white/10 border-white/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {VOICE_OPTIONS.map((voice) => (
                  <SelectItem key={voice.value} value={voice.value} className="text-white hover:bg-white/10">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{voice.label}</span>
                      <span className="text-sm text-gray-400">{voice.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={testVoice} className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              Test Voice
            </Button>
            <Button onClick={() => {
              handleVoiceChange(selectedVoice);
              setShowVoiceDialog(false);
            }}>
              Save Voice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-400">
              <Trash2 className="mr-2 h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              This action cannot be undone. This will permanently delete your account and remove all your data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-300 text-sm">
              ⚠️ Warning: All your progress, chat history, and account data will be permanently lost.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsBar;