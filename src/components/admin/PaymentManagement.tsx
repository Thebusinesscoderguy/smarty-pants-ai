
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calendar, CheckCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();

  useEffect(() => {
    fetchSubscriptionData();
  }, [user]);

  const fetchSubscriptionData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const { data: subData, error: subError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subError);
      } else if (subData) {
        setSubscription({
          id: subData.id,
          subscription_tier: subData.subscription_tier || 'business',
          subscribed: subData.subscribed,
          subscription_end: subData.subscription_end || '',
          stripe_customer_id: subData.stripe_customer_id,
          paypal_subscription_id: subData.paypal_subscription_id
        });
      }

      const { data: schoolData, error: schoolError } = await supabase
        .from('school_accounts')
        .select('*')
        .eq('admin_user_id', user.id)
        .single();

      if (schoolError && schoolError.code !== 'PGRST116') {
        console.error('Error fetching school account:', schoolError);
      } else if (schoolData) {
        setSchoolAccount(schoolData);
        const { count } = await supabase
          .from('school_student_relationships')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolData.id)
          .eq('is_active', true);
        if (count !== null) setStudentCount(count);
      }
    } catch (error: any) {
      toast({ title: t('pay.error'), description: t('pay.failedLoad'), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const createPayPalSubscription = async () => {
    try {
      setIsCreatingSubscription(true);
      const { data, error } = await supabase.functions.invoke('create-checkout', { body: { planType: 'business' } });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (error: any) {
      toast({ title: t('pay.error'), description: t('pay.failedCreate'), variant: "destructive" });
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  const cancelSubscription = async () => {
    try {
      setIsCancelling(true);
      const { error } = await supabase
        .from('subscribers')
        .update({ subscribed: false, subscription_end: new Date().toISOString() })
        .eq('user_id', user?.id);
      if (error) throw error;
      setSubscription(null);
      toast({ title: t('pay.cancelled'), description: t('pay.cancelledDesc') });
    } catch (error: any) {
      toast({ title: t('pay.error'), description: t('pay.failedCancel'), variant: "destructive" });
    } finally {
      setIsCancelling(false);
    }
  };

  const calculateMonthlyPrice = () => {
    return 25 + Math.max(0, studentCount - 1) * 5;
  };

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">{t('pay.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t('pay.title')}</h2>
        <p className="text-muted-foreground">{t('pay.subtitle')}</p>
      </div>

      {subscription && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CheckCircle className="h-5 w-5 text-green-500" />
              {t('pay.current')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('pay.plan')}</p>
                  <p className="font-medium text-foreground">{subscription.subscription_tier}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('pay.expires')}</p>
                  <p className="font-medium text-foreground">
                    {new Date(subscription.subscription_end).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Badge variant={subscription.subscribed ? 'default' : 'secondary'}>
                {subscription.subscribed ? t('pay.active') : t('pay.inactive')}
              </Badge>
              <Button variant="destructive" size="sm" onClick={cancelSubscription} disabled={isCancelling}>
                <X className="h-4 w-4 mr-1" />
                {isCancelling ? t('pay.cancelling') : t('pay.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!subscription && (
        <Card className="bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-foreground">{t('pay.businessPlan')}</CardTitle>
            <div className="text-2xl font-bold text-primary">${calculateMonthlyPrice()}{t('pay.perMonth')}</div>
            <p className="text-muted-foreground text-sm">{t('pay.securePayments')}</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 mb-6">
              {[t('pay.feat1'), t('pay.feat2'), t('pay.feat3'), t('pay.feat4'), t('pay.feat5')].map((feature) => (
                <li key={feature} className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="bg-primary/5 border border-primary/10 p-4 rounded-lg mb-6">
              <h4 className="font-semibold mb-2 text-foreground">{t('pay.pricingStructure')}</h4>
              <ul className="text-left text-sm space-y-1 text-muted-foreground">
                <li>• {t('pay.price1')}</li>
                <li>• {t('pay.price2')}</li>
                <li>• {t('pay.price3')}</li>
                <li>• {t('pay.price4')}</li>
              </ul>
            </div>
            <Button onClick={createPayPalSubscription} disabled={isCreatingSubscription} className="w-full">
              {isCreatingSubscription ? t('pay.processing') : t('pay.subscribeNow')}
            </Button>
          </CardContent>
        </Card>
      )}

      {schoolAccount && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">{t('pay.schoolAccount')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('pay.schoolName')}</p>
                <p className="font-medium text-foreground">{schoolAccount.school_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('pay.planType')}</p>
                <p className="font-medium text-foreground">{schoolAccount.plan_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('pay.activeStudents')}</p>
                <p className="font-medium text-foreground">{studentCount} {t('pay.studentsWord')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('pay.monthlyCost')}</p>
                <p className="font-medium text-foreground">
                  ${calculateMonthlyPrice()}{t('pay.perMonth')}
                  <span className="text-sm text-muted-foreground block">
                    ({t('pay.baseLabel')}: $25 + {Math.max(0, studentCount - 1)} × $5)
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
