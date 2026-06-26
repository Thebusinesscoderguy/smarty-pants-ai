import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, AlertCircle, GraduationCap, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Invite acceptance / "set your password" page for TEACHER and PARENT invites.
// Distinct from the legacy student-code page at /accept-invitation.
//
// The token in the URL carries nothing the client can trust: email, role and
// school are resolved server-side via validate-invite, and the account is
// finalized server-side via accept-invite (role baked in from the invite row).

const MIN_PASSWORD_LEN = 8;

type ValidState =
  | { status: 'loading' }
  | { status: 'valid'; email: string; role: 'teacher' | 'parent'; school_name: string }
  | { status: 'invalid' | 'used' | 'expired' | 'revoked' | 'missing' };

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = (searchParams.get('token') || '').trim();

  const [state, setState] = useState<ValidState>({ status: 'loading' });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = useCallback(async () => {
    if (!token) {
      setState({ status: 'missing' });
      return;
    }
    setState({ status: 'loading' });
    try {
      const { data, error } = await supabase.functions.invoke('validate-invite', {
        body: { token },
      });
      if (error) throw error;
      const res = data as { status: string; email?: string; role?: string; school_name?: string };
      if (res?.status === 'valid' && res.email && res.role) {
        setState({
          status: 'valid',
          email: res.email,
          role: res.role as 'teacher' | 'parent',
          school_name: res.school_name || 'your school',
        });
      } else {
        const errStatuses = ['used', 'expired', 'revoked'] as const;
        const s = errStatuses.find((x) => x === res?.status) ?? 'invalid';
        setState({ status: s });
      }
    } catch (e) {
      console.error('validate-invite failed:', e);
      setState({ status: 'invalid' });
    }
  }, [token]);

  useEffect(() => {
    validate();
  }, [validate]);

  const handleSubmit = async () => {
    if (state.status !== 'valid') return;
    if (password.length < MIN_PASSWORD_LEN) {
      toast({
        title: 'Password too short',
        description: `Use at least ${MIN_PASSWORD_LEN} characters.`,
        variant: 'destructive',
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('accept-invite', {
        body: { token, password },
      });
      // Edge function returns non-2xx with a JSON body for handled errors.
      const res = data as { ok?: boolean; email?: string; role?: string; error?: string; code?: string } | null;
      if (error && !res?.error) throw error;
      if (!res?.ok) {
        const code = res?.code;
        if (code === 'used' || code === 'expired' || code === 'revoked') {
          setState({ status: code });
          return;
        }
        toast({
          title: 'Could not finish setup',
          description: res?.error || 'Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Account created server-side; establish a session by logging in.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: state.email,
        password,
      });
      if (signInError) {
        // Account exists but sign-in failed — send them to login.
        toast({
          title: 'Account ready',
          description: 'Please log in with your new password.',
        });
        navigate('/auth');
        return;
      }

      toast({ title: 'Welcome to Teachly!', description: 'Your account is ready.' });
      navigate(state.role === 'teacher' ? '/school-admin' : '/monitoring');
    } catch (e) {
      console.error('accept-invite failed:', e);
      toast({ title: 'Something went wrong', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="animate-pulse text-muted-foreground">Validating your invitation…</div>
      </div>
    );
  }

  if (state.status !== 'valid') {
    const messages: Record<string, { title: string; body: string }> = {
      missing: { title: 'No invitation link', body: 'This page needs a valid invitation link.' },
      invalid: { title: 'Invalid invitation', body: 'This invitation link is not valid.' },
      used: { title: 'Already used', body: 'This invitation has already been accepted. You can log in instead.' },
      expired: { title: 'Invitation expired', body: 'This invitation has expired. Ask your school admin to re-send it.' },
      revoked: { title: 'Invitation revoked', body: 'This invitation was revoked by your school admin.' },
    };
    const m = messages[state.status] || messages.invalid;
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">{m.title}</h2>
            <p className="text-muted-foreground">{m.body}</p>
            <Button asChild className="w-full">
              <Link to="/auth">Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const RoleIcon = state.role === 'teacher' ? GraduationCap : Users;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Set your password
          </CardTitle>
          <CardDescription>
            Finish setting up your Teachly account for <strong>{state.school_name}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <RoleIcon className="h-4 w-4" />
            <AlertDescription>
              You're joining as a <strong>{state.role}</strong>.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" type="email" value={state.email} disabled readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-password">Password</Label>
            <Input
              id="invite-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={`At least ${MIN_PASSWORD_LEN} characters`}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-confirm">Confirm password</Label>
            <Input
              id="invite-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting || !password || !confirmPassword} className="w-full">
            {submitting ? 'Setting up…' : 'Create account & continue'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvite;
