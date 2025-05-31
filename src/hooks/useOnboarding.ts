
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface OnboardingStatus {
  id: string;
  user_id: string;
  has_completed_payment: boolean;
  has_provided_guardian_email: boolean;
  has_verified_guardian: boolean;
  completed_at: string | null;
  created_at: string;
}

export const useOnboarding = () => {
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOnboardingStatus();
    }
  }, [user]);

  const fetchOnboardingStatus = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('onboarding_status')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      setOnboardingStatus(data);
    } catch (error: any) {
      console.error('Error fetching onboarding status:', error);
      toast({
        title: "Error",
        description: "Failed to load onboarding status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOnboardingStatus = async (updates: Partial<OnboardingStatus>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('onboarding_status')
        .upsert({
          user_id: user.id,
          ...updates
        })
        .select()
        .single();

      if (error) throw error;

      setOnboardingStatus(data);
      return data;
    } catch (error: any) {
      console.error('Error updating onboarding status:', error);
      toast({
        title: "Error",
        description: "Failed to update onboarding status",
        variant: "destructive"
      });
      throw error;
    }
  };

  const setGuardianEmail = async (email: string) => {
    if (!user) return;

    try {
      // Update profile with guardian email
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ guardian_email: email })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update onboarding status
      await updateOnboardingStatus({
        has_provided_guardian_email: true
      });

      toast({
        title: "Guardian Email Added",
        description: "Guardian email has been successfully added to your profile",
      });
    } catch (error: any) {
      console.error('Error setting guardian email:', error);
      toast({
        title: "Error",
        description: "Failed to set guardian email",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    onboardingStatus,
    isLoading,
    updateOnboardingStatus,
    setGuardianEmail,
    fetchOnboardingStatus
  };
};
