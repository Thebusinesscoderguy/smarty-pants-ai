
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
  const [invitationCode, setInvitationCode] = useState(searchParams.get('code') || '');
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
      
      const { data, error } = await supabase
        .from('student_invitations')
        .select(`
          id,
          email,
          first_name,
          last_name,
          school_id,
          expires_at,
          used
        `)
        .eq('invitation_code', invitationCode)
        .single();

      if (error || !data) {
        toast({
          title: "Invalid Invitation",
          description: "The invitation code is invalid or has expired.",
          variant: "destructive"
        });
        return;
      }

      if (data.used) {
        toast({
          title: "Invitation Already Used",
          description: "This invitation has already been accepted.",
          variant: "destructive"
        });
        return;
      }

      if (new Date() > new Date(data.expires_at)) {
        toast({
          title: "Invitation Expired",
          description: "This invitation has expired. Please request a new one.",
          variant: "destructive"
        });
        return;
      }

      const invitationData: InvitationData = {
        ...data,
        school_name: (data.school_accounts as any).school_name
      };

      setInvitation(invitationData);
      setFormData(prev => ({
        ...prev,
        email: invitationData.email,
        firstName: invitationData.first_name || '',
        lastName: invitationData.last_name || ''
      }));

    } catch (error) {
      console.error('Error validating invitation:', error);
      toast({
        title: "Error",
        description: "Failed to validate invitation",
        variant: "destructive"
      });
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
            title: "Password Mismatch",
            description: "Passwords do not match",
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

      // Mark invitation as used
      const { error: updateError } = await supabase
        .from('student_invitations')
        .update({
          used: true,
          used_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      toast({
        title: "Welcome!",
        description: `You've successfully joined ${invitation.school_name}!`,
      });

      // Redirect to dashboard or student portal
      navigate('/');

    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="animate-pulse text-white">Validating invitation...</div>
      </div>
    );
  }

  if (!invitationCode) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center">Enter Invitation Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="code" className="text-white">Invitation Code</Label>
              <Input
                id="code"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
                placeholder="Enter your invitation code"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <Button
              onClick={validateInvitation}
              disabled={!invitationCode.trim()}
              className="w-full"
            >
              Validate Invitation
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
            <p className="text-white">Invalid or expired invitation code.</p>
            <Button
              onClick={() => navigate('/')}
              className="mt-4"
              variant="outline"
            >
              Go Home
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
            Join {invitation.school_name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-blue-500/20 border-blue-500/50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-white">
              You've been invited to join <strong>{invitation.school_name}</strong> as a student.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              variant={authMode === 'signup' ? 'default' : 'outline'}
              onClick={() => setAuthMode('signup')}
              className="flex-1"
            >
              Sign Up
            </Button>
            <Button
              variant={authMode === 'signin' ? 'default' : 'outline'}
              onClick={() => setAuthMode('signin')}
              className="flex-1"
            >
              Sign In
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="email" className="text-white">Email</Label>
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
                    <Label htmlFor="firstName" className="text-white">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-white">Last Name</Label>
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
              <Label htmlFor="password" className="text-white">Password</Label>
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
                <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
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
            {loading ? 'Processing...' : `${authMode === 'signup' ? 'Accept Invitation & Sign Up' : 'Accept Invitation & Sign In'}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;
