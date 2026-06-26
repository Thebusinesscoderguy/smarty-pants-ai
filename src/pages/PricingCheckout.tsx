
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Users, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const Pricing = () => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState({ individual: false, business: false });

  const handleSubscription = async (planType: 'individual' | 'business') => {
    try {
      setIsLoading(prev => ({ ...prev, [planType]: true }));
      
      console.log("Starting PayPal checkout for plan:", planType);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType }
      });

      if (error) {
        console.error("PayPal checkout error:", error);
        throw error;
      }

      console.log("PayPal checkout response:", data);

      if (data?.url) {
        // Open PayPal checkout in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error("No checkout URL received from PayPal");
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: t('pc.paymentError'),
        description: error.message || t('pc.failedStart'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, [planType]: false }));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <header className="py-6 text-center">
        <h1 className="text-3xl font-bold">TeachlyAI</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <h2 className="text-3xl font-bold mb-6">{t('pc.choosePlan')}</h2>
        <p className="text-lg text-white/80 max-w-2xl text-center mb-10">
          {t('pc.chooseSub')}
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Individual Plan */}
          <Card className="w-full bg-black border border-white/20 text-white relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold">
              {t('pc.recommended')}
            </div>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <User className="h-6 w-6" />
                <span className="text-lg font-semibold">{t('pc.individual')}</span>
              </div>
              <CardTitle className="text-3xl font-bold">$16/month</CardTitle>
              <CardDescription className="text-white/70">
                {t('pc.individualDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div>
                <p className="text-xl mb-2">{t('pc.fullAccess')}</p>
                <p className="text-white/70 mb-4">{t('pc.startImmediately')}</p>
              </div>

              <ul className="space-y-3 text-lg">
                {['pc.if1', 'pc.if2', 'pc.if3', 'pc.if4', 'pc.if5', 'pc.if6'].map((k) => (
                  <li key={k} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span>{t(k)}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-white/5 p-4 rounded-lg">
                <p className="font-medium">{t('pc.securePaypal')}</p>
                <p className="text-sm text-white/70">{t('pc.cancelAnytime')}</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                className="w-full bg-white text-black hover:bg-gray-200"
                onClick={() => handleSubscription('individual')}
                disabled={isLoading.individual}
              >
                {isLoading.individual ? t('pc.processing') : t('pc.subscribePaypal')}
              </Button>
            </CardFooter>
          </Card>

          {/* Business Plan */}
          <Card className="w-full bg-black border border-blue-500/50 text-white relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
              {t('pc.businessBadge')}
            </div>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-6 w-6" />
                <span className="text-lg font-semibold">{t('pc.businessName')}</span>
              </div>
              <CardTitle className="text-3xl font-bold">$25/month</CardTitle>
              <CardDescription className="text-white/70">
                {t('pc.perMonth25plus')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div>
                <p className="text-xl mb-2">{t('pc.everythingPlus')}</p>
                <p className="text-white/70 mb-4">{t('pc.multiUser')}</p>
              </div>

              <ul className="space-y-3 text-lg">
                {['pc.bf1', 'pc.bf2', 'pc.bf3', 'pc.bf4', 'pc.bf5', 'pc.bf6'].map((k) => (
                  <li key={k} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <span>{t(k)}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">{t('pc.flexiblePricing')}</h4>
                <ul className="text-left text-sm space-y-2">
                  <li>• {t('pay.price1')}</li>
                  <li>• {t('pay.price2')}</li>
                  <li>• {t('pay.price3')}</li>
                  <li>• {t('pay.price4')}</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => handleSubscription('business')}
                disabled={isLoading.business}
              >
                {isLoading.business ? t('pc.processing') : t('pc.subscribePaypal')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-white/70">
        © 2025 EduAI
      </footer>
    </div>
  );
};

export default Pricing;
