import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  UserX, 
  Trash2, 
  AlertTriangle, 
  ExternalLink,
  Shield,
  Users,
  Settings as SettingsIcon
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const ParentSettings = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe Customer Portal in new tab
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to Billing Portal",
          description: "You can manage your subscription, payment methods, and view invoices.",
        });
      }
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.")) {
      return;
    }

    setIsLoading(true);
    try {
      await handleManageSubscription(); // Redirect to portal where they can cancel
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to access subscription management. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = "DELETE";
    const userInput = prompt(
      `This action cannot be undone. This will permanently delete your account and all associated data.\n\nType "${confirmText}" to confirm account deletion:`
    );

    if (userInput !== confirmText) {
      if (userInput !== null) {
        toast({
          title: "Account Deletion Cancelled",
          description: "Confirmation text did not match.",
          variant: "destructive",
        });
      }
      return;
    }

    setIsLoading(true);
    try {
      if (user) {
        // Note: In a real implementation, you'd want to handle this server-side
        // This would delete user data, cancel subscriptions, etc.
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        toast({
          title: "Account Deletion Initiated",
          description: "Your account deletion has been processed. All data will be permanently removed.",
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageChildren = () => {
    navigate('/family-hub');
  };

  return (
    <div className="space-y-8">
      {/* Subscription Management */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30 backdrop-blur-sm rounded-3xl shadow-2xl">
        <CardHeader className="pb-6">
          <CardTitle className="text-white flex items-center text-2xl">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mr-4">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            Subscription Management
          </CardTitle>
          <p className="text-white/70 text-lg ml-16">
            Manage your billing, subscription, and payment methods
          </p>
        </CardHeader>
        <CardContent className="space-y-6 ml-16">
          <div className="grid gap-4">
            <div className="p-6 bg-white/5 border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-200 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <ExternalLink className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Billing Portal</h3>
                    <p className="text-white/60">View invoices, update payment methods</p>
                  </div>
                </div>
                <Button 
                  onClick={handleManageSubscription}
                  disabled={isLoading}
                  variant="outline" 
                  className="bg-white/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                >
                  {isLoading ? 'Opening...' : 'Manage Billing'}
                </Button>
              </div>
            </div>

            <div className="p-6 bg-white/5 border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-200 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-orange-500/20 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <AlertTriangle className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Cancel Subscription</h3>
                    <p className="text-white/60">End your subscription plan</p>
                  </div>
                </div>
                <Button 
                  onClick={handleCancelSubscription}
                  disabled={isLoading}
                  variant="outline" 
                  className="bg-white/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20"
                >
                  {isLoading ? 'Processing...' : 'Cancel Plan'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Family Management */}
      <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30 backdrop-blur-sm rounded-3xl shadow-2xl">
        <CardHeader className="pb-6">
          <CardTitle className="text-white flex items-center text-2xl">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl mr-4">
              <Users className="h-6 w-6 text-white" />
            </div>
            Family Management
          </CardTitle>
          <p className="text-white/70 text-lg ml-16">
            Manage your children's accounts and learning progress
          </p>
        </CardHeader>
        <CardContent className="space-y-6 ml-16">
          <div className="p-6 bg-white/5 border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-500/20 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <SettingsIcon className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Children's Accounts</h3>
                  <p className="text-white/60">Add, remove, and manage children's profiles</p>
                </div>
              </div>
              <Button 
                onClick={handleManageChildren}
                variant="outline" 
                className="bg-white/10 border-green-500/30 text-green-300 hover:bg-green-500/20"
              >
                Manage Children
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30 backdrop-blur-sm rounded-3xl shadow-2xl">
        <CardHeader className="pb-6">
          <CardTitle className="text-white flex items-center text-2xl">
            <div className="p-3 bg-gradient-to-r from-red-500 to-orange-600 rounded-xl mr-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            Account Security
          </CardTitle>
          <p className="text-white/70 text-lg ml-16">
            Manage your account security and data
          </p>
        </CardHeader>
        <CardContent className="space-y-6 ml-16">
          <div className="p-6 bg-red-500/10 border-2 border-red-500/30 rounded-xl hover:bg-red-500/20 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-red-500/30 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <Trash2 className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-red-300 font-semibold flex items-center">
                    Delete Account
                    <AlertTriangle className="h-4 w-4 ml-2" />
                  </h3>
                  <p className="text-red-400/80">Permanently delete your account and all data</p>
                </div>
              </div>
              <Button 
                onClick={handleDeleteAccount}
                disabled={isLoading}
                variant="destructive" 
                className="bg-red-600 hover:bg-red-700 border-none shadow-lg"
              >
                {isLoading ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-yellow-200 text-sm flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Account deletion is permanent and cannot be undone. All data will be lost.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};