import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Users, Calendar, CheckCircle, Plus, AlertTriangle } from 'lucide-react';
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
  const [studentCount, setStudentCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    fetchSubscriptionData();
    fetchStudentCount();
  }, [user]);

  const fetchStudentCount = async () => {
    if (!user) return;

    try {
      // Get school account first
      const { data: schoolData } = await supabase
        .from('school_accounts')
        .select('id')
        .eq('admin_user_id', user.id)
        .single();

      if (schoolData) {
        // Count active student invitations
        const { data: invitations, error } = await supabase
          .from('student_invitations')
          .select('id')
          .eq('school_id', schoolData.id);

        if (!error) {
          setStudentCount(invitations?.length || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching student count:', error);
    }
  };

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

  const purchaseAdditionalStudents = async (count: number) => {
    const costPerStudent = 5; // $5 per additional student
    const totalCost = count * costPerStudent;

    try {
      // This would integrate with Stripe for actual payment
      // For now, we'll just update the student limit
      if (schoolAccount) {
        const { error } = await supabase
          .from('school_accounts')
          .update({
            student_limit: schoolAccount.student_limit + count
          })
          .eq('id', schoolAccount.id);

        if (error) throw error;

        setSchoolAccount({
          ...schoolAccount,
          student_limit: schoolAccount.student_limit + count
        });

        toast({
          title: "Students Added",
          description: `Added ${count} student slots for $${totalCost}`,
        });
      }
    } catch (error: any) {
      console.error('Error purchasing additional students:', error);
      toast({
        title: "Error",
        description: "Failed to purchase additional student slots",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading subscription data...</div>;
  }

  const isNearLimit = subscription && studentCount >= (subscription.max_students * 0.8);
  const isOverLimit = subscription && studentCount > subscription.max_students;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Subscription Management</h2>
        <p className="text-gray-400">Manage your school's subscription and billing</p>
      </div>

      {/* Student Usage Warning */}
      {subscription && (isNearLimit || isOverLimit) && (
        <Card className={`border ${isOverLimit ? 'border-red-500/50 bg-red-500/10' : 'border-yellow-500/50 bg-yellow-500/10'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-5 w-5 ${isOverLimit ? 'text-red-400' : 'text-yellow-400'}`} />
              <div>
                <p className={`font-medium ${isOverLimit ? 'text-red-300' : 'text-yellow-300'}`}>
                  {isOverLimit ? 'Student Limit Exceeded' : 'Approaching Student Limit'}
                </p>
                <p className="text-sm text-gray-400">
                  You have {studentCount} students out of {subscription.max_students} allowed. 
                  {isOverLimit && ' Additional charges may apply.'}
                </p>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => purchaseAdditionalStudents(10)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add 10 Students ($50)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => purchaseAdditionalStudents(25)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add 25 Students ($125)
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                    {studentCount}/{subscription.max_students}
                  </p>
                  <p className="text-xs text-gray-500">
                    Extra students: $5 each
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
                <p className="text-sm text-gray-500 text-center">Additional students: $5 each</p>
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
