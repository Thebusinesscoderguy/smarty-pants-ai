
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calendar, CheckCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Subscription {
  id: string;
  subscription_tier: string;
  subscribed: boolean;
  subscription_end: string;
  stripe_customer_id: string;
}

interface SchoolAccount {
  id: string;
  school_name: string;
  plan_type: string;
  is_active: boolean;
}

export const PaymentManagement = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [schoolAccount, setSchoolAccount] = useState<SchoolAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    fetchSubscriptionData();
  }, [user]);

  const fetchSubscriptionData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Fetch subscription data
      const { data: subData, error: subError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subError);
      } else if (subData) {
        setSubscription(subData);
      }

      // Fetch school account data
      const { data: schoolData, error: schoolError } = await supabase
        .from('school_accounts')
        .select('*')
        .eq('admin_user_id', user.id)
        .single();

      if (schoolError && schoolError.code !== 'PGRST116') {
        console.error('Error fetching school account:', schoolError);
      } else if (schoolData) {
        setSchoolAccount(schoolData);
        
        // Fetch student count for this school
        const { count, error: countError } = await supabase
          .from('school_student_relationships')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolData.id)
          .eq('is_active', true);
        
        if (!countError && count !== null) {
          setStudentCount(count);
        }
      }

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createStripeSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType: 'business' }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to create subscription",
        variant: "destructive"
      });
    }
  };

  const createPayPalSubscription = async () => {
    try {
      // Calculate total price: base $25 + ($5 * additional students)
      const basePrice = 25;
      const additionalStudents = Math.max(0, studentCount - 1); // First student included
      const totalPrice = basePrice + (additionalStudents * 5);

      toast({
        title: "PayPal Integration",
        description: `Redirecting to PayPal for $${totalPrice}/month subscription`,
      });

      // This would integrate with PayPal's subscription API
      // For now, we'll show a placeholder
      console.log('PayPal subscription:', { totalPrice, studentCount });
      
    } catch (error: any) {
      console.error('Error creating PayPal subscription:', error);
      toast({
        title: "Error",
        description: "Failed to create PayPal subscription",
        variant: "destructive"
      });
    }
  };

  const cancelSubscription = async () => {
    try {
      setIsCancelling(true);
      
      // This would call Stripe or PayPal cancellation API
      const { error } = await supabase
        .from('subscribers')
        .update({ 
          subscribed: false,
          subscription_end: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      setSubscription(null);
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully",
      });
      
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const calculateMonthlyPrice = () => {
    const basePrice = 25;
    const additionalStudents = Math.max(0, studentCount - 1);
    return basePrice + (additionalStudents * 5);
  };

  if (isLoading) {
    return <div className="animate-pulse text-white">Loading subscription data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Subscription Management</h2>
        <p className="text-gray-400">Manage your school's subscription and billing</p>
      </div>

      {/* Current Subscription Status */}
      {subscription && (
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Plan</p>
                  <p className="font-medium text-white">{subscription.subscription_tier}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Expires</p>
                  <p className="font-medium text-white">
                    {new Date(subscription.subscription_end).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Badge variant={subscription.subscribed ? 'default' : 'secondary'}>
                {subscription.subscribed ? 'Active' : 'Inactive'}
              </Badge>
              <Button 
                variant="destructive"
                size="sm"
                onClick={cancelSubscription}
                disabled={isCancelling}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      {!subscription && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Stripe Payment Option */}
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-center">Pay with Stripe</CardTitle>
              <div className="text-2xl font-bold text-white text-center">${calculateMonthlyPrice()}/month</div>
              <p className="text-gray-400 text-center">Secure card payments</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Admin dashboard access
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Student invitation system
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Advanced analytics
                </li>
              </ul>
              <Button 
                onClick={createStripeSubscription}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Subscribe with Stripe
              </Button>
            </CardContent>
          </Card>

          {/* PayPal Payment Option */}
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-center">Pay with PayPal</CardTitle>
              <div className="text-2xl font-bold text-white text-center">${calculateMonthlyPrice()}/month</div>
              <p className="text-gray-400 text-center">Secure PayPal payments</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Same features as Stripe
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  PayPal buyer protection
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Easy cancellation
                </li>
              </ul>
              <Button 
                onClick={createPayPalSubscription}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                Subscribe with PayPal
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* School Account Info */}
      {schoolAccount && (
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">School Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">School Name</p>
                <p className="font-medium text-white">{schoolAccount.school_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Plan Type</p>
                <p className="font-medium text-white">{schoolAccount.plan_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Students</p>
                <p className="font-medium text-white">{studentCount} students</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Monthly Cost</p>
                <p className="font-medium text-white">
                  ${calculateMonthlyPrice()}/month
                  <span className="text-sm text-gray-400 block">
                    (Base: $25 + {Math.max(0, studentCount - 1)} × $5)
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
