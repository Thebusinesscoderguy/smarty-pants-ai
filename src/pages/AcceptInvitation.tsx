
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface InvitationData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  school_id: string;
  school_name: string;
  expires_at: string;
  used: boolean;
}

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signUp, signIn } = useAuth();
  const { t } = useLanguage();
  const [invitationCode, setInvitationCode] = useState((searchParams.get('code') || '').trim());
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  useEffect(() => {
    if (invitationCode) {
      validateInvitation();
    } else {
      setIsValidating(false);
    }
  }, [invitationCode]);

  const validateInvitation = async () => {
    try {
      setIsValidating(true);

      const normalizedCode = invitationCode.trim();
      if (!normalizedCode) {
        setInvitation(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke('validate-student-invitation', {
        body: { invitationCode: normalizedCode }
      });

      if (error) {
        throw new Error(error.message || 'Failed to validate invitation');
      }

      const response = data as {
        valid: boolean;
        reason?: 'invalid_code' | 'not_found' | 'used' | 'expired';
        invitation?: InvitationData;
      } | null;

      if (!response?.valid || !response.invitation) {
        setInvitation(null);

        if (response?.reason === 'used') {
          toast({
            title: t('aci.alreadyUsed'),
            description: t('aci.alreadyUsedDesc'),
            variant: "destructive"
          });
        } else if (response?.reason === 'expired') {
          toast({
            title: t('aci.expired'),
            description: t('aci.expiredDesc'),
            variant: "destructive"
          });
        } else {
          toast({
            title: t('aci.invalid'),
            description: t('aci.invalidDesc'),
            variant: "destructive"
          });
        }

        return;
      }

      setInvitation(response.invitation);
      setFormData(prev => ({
        ...prev,
        email: response.invitation!.email,
        firstName: response.invitation!.first_name || '',
        lastName: response.invitation!.last_name || ''
      }));

    } catch (error) {
      console.error('Error validating invitation:', error);
      toast({
        title: t('aci.error'),
        description: t('aci.failedValidate'),
        variant: "destructive"
      });
      setInvitation(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation) return;

    try {
      setLoading(true);

      let userId;

      if (authMode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: t('aci.passwordMismatch'),
            description: t('aci.passwordsNoMatch'),
            variant: "destructive"
          });
          return;
        }

        const { data: authData, error: authError } = await signUp(
          formData.email,
          formData.password,
          formData.firstName,
          formData.lastName
        );

        if (authError) throw authError;
        userId = authData.user?.id;

      } else {
        const { data: authData, error: authError } = await signIn(
          formData.email,
          formData.password
        );

        if (authError) throw authError;
        userId = authData.user?.id;
      }

      if (!userId) throw new Error('Failed to authenticate user');

      // Create school-student relationship
      const { error: relationshipError } = await supabase
        .from('school_student_relationships')
        .insert({
          school_id: invitation.school_id,
          student_id: userId,
          is_active: true
        });

      if (relationshipError) throw relationshipError;

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('student_invitations')
        .update({
          used: true,
          used_at: new Date().toISOString(),
          status: 'accepted',
          accepted_user_id: userId,
        } as any)
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      // Fire-and-forget confirmation emails (student + school admin)
      supabase.functions
        .invoke('send-invitation-accepted-email', { body: { invitationId: invitation.id } })
        .catch((e) => console.error('Confirmation email failed:', e));

      toast({
        title: t('aci.welcome'),
        description: `${t('aci.welcomePre')} ${invitation.school_name}${t('aci.welcomePost')}`,
      });

      // Redirect to dashboard or student portal
      navigate('/');

    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast({
        title: t('aci.error'),
        description: error.message || t('aci.failedAccept'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="animate-pulse text-white">{t('aci.validating')}</div>
      </div>
    );
  }

  if (!invitationCode) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center">{t('aci.enterCode')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="code" className="text-white">{t('aci.codeLabel')}</Label>
              <Input
                id="code"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
                placeholder={t('aci.codePlaceholder')}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <Button
              onClick={validateInvitation}
              disabled={!invitationCode.trim()}
              className="w-full"
            >
              {t('aci.validateBtn')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 border-white/20">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-white">{t('aci.invalidExpired')}</p>
            <Button
              onClick={() => navigate('/')}
              className="mt-4"
              variant="outline"
            >
              {t('aci.goHome')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-center flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('aci.joinPre')} {invitation.school_name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-blue-500/20 border-blue-500/50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-white">
              {t('aci.invitedPre')} <strong>{invitation.school_name}</strong> {t('aci.invitedPost')}
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              variant={authMode === 'signup' ? 'default' : 'outline'}
              onClick={() => setAuthMode('signup')}
              className="flex-1"
            >
              {t('aci.signUp')}
            </Button>
            <Button
              variant={authMode === 'signin' ? 'default' : 'outline'}
              onClick={() => setAuthMode('signin')}
              className="flex-1"
            >
              {t('aci.signIn')}
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="email" className="text-white">{t('aci.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="bg-white/10 border-white/20 text-white"
                disabled
              />
            </div>

            {authMode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="firstName" className="text-white">{t('aci.firstName')}</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-white">{t('aci.lastName')}</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="password" className="text-white">{t('aci.password')}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            {authMode === 'signup' && (
              <div>
                <Label htmlFor="confirmPassword" className="text-white">{t('aci.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleAcceptInvitation}
            disabled={loading || !formData.email || !formData.password}
            className="w-full"
          >
            {loading ? t('aci.processing') : (authMode === 'signup' ? t('aci.acceptSignup') : t('aci.acceptSignin'))}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;
