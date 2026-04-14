import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Gift, Copy, Users, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const ReferralProgram = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();
      
      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      }

      const { data: refs } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });
      
      setReferrals(refs || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
  };

  const completedCount = referrals.filter(r => r.status === 'completed' || r.status === 'rewarded').length;

  if (loading) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Referral Program
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Invite friends to Teachly! When they sign up, both of you get bonus features.
        </p>

        <div className="flex gap-2">
          <Input value={referralLink} readOnly className="text-xs" />
          <Button onClick={copyLink} size="sm" variant="outline">
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{referrals.length}</div>
            <div className="text-xs text-muted-foreground">Invited</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{completedCount}</div>
            <div className="text-xs text-muted-foreground">Joined</div>
          </div>
        </div>

        {referrals.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Referrals</h4>
            {referrals.slice(0, 5).map(ref => (
              <div key={ref.id} className="flex items-center justify-between text-sm py-1">
                <span className="text-muted-foreground">{ref.referred_email}</span>
                <Badge variant={ref.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                  {ref.status === 'completed' ? <><CheckCircle className="h-3 w-3 mr-1" />Joined</> : 'Pending'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
