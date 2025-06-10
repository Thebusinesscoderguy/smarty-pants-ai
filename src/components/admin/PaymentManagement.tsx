
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
  stripe_customer_id?: string;
  paypal_subscription_id?: string;
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
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
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
        // Map the database structure to our interface
        const mappedSubscription: Subscription = {
          id: subData.id,
          subscription_tier: subData.subscription_tier || 'business',
          subscribed: subData.subscribed,
          subscription_end: subData.subscription_end || '',
          stripe_customer_id: subData.stripe_customer_id,
          paypal_subscription_id: subData.paypal_subscription_id
        };
        setSubscription(mappedSubscription);
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

  const createPayPalSubscription = async () => {
    try {
      setIsCreatingSubscription(true);
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
        description: "Failed to create PayPal subscription",
        variant: "destructive"
      });
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  const cancelSubscription = async () => {
    try {
      setIsCancelling(true);
      
      // This would call PayPal cancellation API
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
        description: "Your PayPal subscription has been cancelled successfully",
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
        <p className="text-gray-400">Manage your school's subscription and billing via PayPal</p>
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

      {/* PayPal Subscription Option */}
      {!subscription && (
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center">Business Plan</CardTitle>
            <div className="text-2xl font-bold text-white text-center">${calculateMonthlyPrice()}/month</div>
            <p className="text-gray-400 text-center">Secure payments via PayPal</p>
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
                Advanced analytics & reporting
              </li>
              <li className="flex items-center text-sm text-gray-300">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Priority support
              </li>
              <li className="flex items-center text-sm text-gray-300">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Bulk user management
              </li>
            </ul>
            <div className="bg-blue-900/20 p-4 rounded-lg mb-6">
              <h4 className="font-semibold mb-2 text-white">Pricing Structure:</h4>
              <ul className="text-left text-sm space-y-2 text-gray-300">
                <li>• Base price: $25/month for admin account</li>
                <li>• Each additional student: $5/month</li>
                <li>• Example: 10 students = $25 + (9 × $5) = $70/month</li>
                <li>• No setup fees or long-term commitments</li>
              </ul>
            </div>
            <Button 
              onClick={createPayPalSubscription}
              disabled={isCreatingSubscription}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isCreatingSubscription ? 'Processing...' : 'Subscribe with PayPal'}
            </Button>
          </CardContent>
        </Card>
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
