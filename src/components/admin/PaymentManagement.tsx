
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Users, Calendar, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Subscription {
  id: string;
  subscription_tier: string;
  subscribed: boolean;
  subscription_end: string;
  student_count: number;
  max_students: number;
  stripe_customer_id: string;
}

interface SchoolAccount {
  id: string;
  school_name: string;
  student_limit: number;
  plan_type: string;
  is_active: boolean;
}

export const PaymentManagement = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [schoolAccount, setSchoolAccount] = useState<SchoolAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  const createSubscription = async () => {
    try {
      // Create school account if it doesn't exist
      if (!schoolAccount) {
        const { data: newSchool, error: schoolError } = await supabase
          .from('school_accounts')
          .insert({
            admin_user_id: user?.id,
            school_name: 'My School', // This would come from a form
            student_limit: 100,
            plan_type: 'starter'
          })
          .select()
          .single();

        if (schoolError) throw schoolError;
        setSchoolAccount(newSchool);
      }

      // Create subscription record
      const { data: newSub, error: subError } = await supabase
        .from('subscribers')
        .insert({
          user_id: user?.id,
          email: user?.email,
          subscribed: true,
          subscription_tier: 'starter',
          max_students: 100,
          subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
        .select()
        .single();

      if (subError) throw subError;
      setSubscription(newSub);

      toast({
        title: "Subscription Created",
        description: "Successfully subscribed to Starter plan with 100 students",
      });
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to create subscription",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading subscription data...</div>;
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Plan</p>
                  <p className="font-medium text-white">{subscription.subscription_tier}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Students</p>
                  <p className="font-medium text-white">
                    {subscription.student_count}/{subscription.max_students}
                  </p>
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
            <div className="mt-4">
              <Badge variant={subscription.subscribed ? 'default' : 'secondary'}>
                {subscription.subscribed ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plan */}
      {!subscription && (
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-center">Starter Plan</CardTitle>
                <div className="text-2xl font-bold text-white text-center">$29/month</div>
                <p className="text-gray-400 text-center">Up to 100 students</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Curriculum management
                  </li>
                  <li className="flex items-center text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Student progress tracking
                  </li>
                  <li className="flex items-center text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Quest system
                  </li>
                  <li className="flex items-center text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Advanced analytics
                  </li>
                  <li className="flex items-center text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Custom achievements
                  </li>
                  <li className="flex items-center text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Priority support
                  </li>
                  <li className="flex items-center text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Custom integrations
                  </li>
                  <li className="flex items-center text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Advanced reporting
                  </li>
                </ul>
                <Button 
                  onClick={createSubscription}
                  className="w-full"
                >
                  Subscribe to Starter Plan
                </Button>
              </CardContent>
            </Card>
          </div>
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
                <p className="text-sm text-gray-400">Student Limit</p>
                <p className="font-medium text-white">{schoolAccount.student_limit}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <Badge variant={schoolAccount.is_active ? 'default' : 'secondary'}>
                  {schoolAccount.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
