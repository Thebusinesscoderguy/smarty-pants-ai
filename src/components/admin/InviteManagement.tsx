import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Mail, Clock, Loader2, Send, Ban, Users, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface Invite {
  id: string;
  email: string;
  role: 'teacher' | 'parent';
  status: string;
  child_ids: string[] | null;
  expires_at: string;
  created_at: string;
}

interface StudentOption {
  student_id: string;
  display_name: string;
}

// Admin UI for inviting PARENTS (with linked students) and managing all pending
// teacher/parent invites (re-send rotates the token; revoke disables it).
export const InviteManagement = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [schoolId, setSchoolId] = useState('');
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newParent, setNewParent] = useState({ email: '', first_name: '', last_name: '' });
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const { data: school } = await supabase
        .from('school_accounts')
        .select('id')
        .eq('admin_user_id', user.id)
        .maybeSingle();
      if (!school) {
        setIsLoading(false);
        return;
      }
      setSchoolId(school.id);

      // Students of this school (for the parent → child multi-select).
      const { data: rels } = await supabase
        .from('school_student_relationships')
        .select('student_id')
        .eq('school_id', school.id)
        .eq('is_active', true);
      const studentIds = [...new Set((rels || []).map((r) => r.student_id))];
      let studentList: StudentOption[] = [];
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', studentIds);
        studentList = (profiles || []).map((p) => ({
          student_id: p.id,
          display_name: p.display_name || t('invite.unnamedStudent'),
        }));
        studentList.sort((a, b) => a.display_name.localeCompare(b.display_name));
      }
      setStudents(studentList);

      // Pending invites for this school (RLS scopes to the admin's school).
      const { data: inviteRows } = await supabase
        .from('invites')
        .select('id, email, role, status, child_ids, expires_at, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      setInvites((inviteRows || []) as Invite[]);
    } catch (e) {
      console.error('[InviteManagement] load error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleChild = (id: string) => {
    setSelectedChildren((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const inviteParent = async () => {
    if (!newParent.email.trim()) {
      toast({ title: t('teacherMgmt.emailRequired'), variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-invite', {
        body: {
          email: newParent.email.trim().toLowerCase(),
          role: 'parent',
          first_name: newParent.first_name.trim(),
          last_name: newParent.last_name.trim(),
          child_ids: selectedChildren,
        },
      });
      const res = data as { ok?: boolean; error?: string; code?: string } | null;
      if (error && !res?.error) throw error;
      if (res?.code === 'email_exists') {
        toast({
          title: t('teacherMgmt.alreadyAccount'),
          description: t('teacherMgmt.alreadyAccountDesc'),
          variant: 'destructive',
        });
        return;
      }
      if (!res?.ok) {
        toast({ title: t('invite.couldNotInviteParent'), description: res?.error || t('teacherMgmt.tryAgain'), variant: 'destructive' });
        return;
      }
      toast({ title: t('teacherMgmt.invitationSent'), description: `${t('teacherMgmt.invitationSentDescPre')} ${newParent.email}.` });
      setNewParent({ email: '', first_name: '', last_name: '' });
      setSelectedChildren([]);
      setIsInviteOpen(false);
      load();
    } catch (e: any) {
      toast({ title: t('teacherMgmt.error'), description: e.message || t('invite.failedInviteParent'), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const resend = async (invite: Invite) => {
    setBusyId(invite.id);
    try {
      const { data, error } = await supabase.functions.invoke('create-invite', {
        body: {
          email: invite.email,
          role: invite.role,
          child_ids: invite.child_ids || [],
        },
      });
      const res = data as { ok?: boolean; error?: string } | null;
      if (error && !res?.error) throw error;
      if (!res?.ok) {
        toast({ title: t('invite.couldNotResend'), description: res?.error || t('teacherMgmt.tryAgain'), variant: 'destructive' });
        return;
      }
      toast({ title: t('invite.resent'), description: `${t('invite.resentDescPre')} ${invite.email}. ${t('invite.resentDescSuffix')}` });
      load();
    } catch (e: any) {
      toast({ title: t('teacherMgmt.error'), description: e.message || t('invite.failedResend'), variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const revoke = async (invite: Invite) => {
    setBusyId(invite.id);
    try {
      const { data, error } = await supabase.functions.invoke('create-invite', {
        body: { action: 'revoke', invite_id: invite.id },
      });
      const res = data as { ok?: boolean; error?: string } | null;
      if (error && !res?.error) throw error;
      if (!res?.ok) {
        toast({ title: t('invite.couldNotRevoke'), description: res?.error || t('teacherMgmt.tryAgain'), variant: 'destructive' });
        return;
      }
      toast({ title: t('invite.revoked'), description: `${invite.email} — ${t('invite.revokedDescSuffix')}` });
      load();
    } catch (e: any) {
      toast({ title: t('teacherMgmt.error'), description: e.message || t('invite.failedRevoke'), variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) return <div className="animate-pulse text-muted-foreground">{t('invite.loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('invite.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('invite.subtitle')}
          </p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />{t('invite.inviteParent')}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{t('invite.inviteAParent')}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t('teacherMgmt.emailReq')}</Label>
                <Input
                  type="email"
                  placeholder={t('invite.emailPlaceholder')}
                  value={newParent.email}
                  onChange={(e) => setNewParent((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t('teacherMgmt.firstName')}</Label>
                  <Input value={newParent.first_name} onChange={(e) => setNewParent((p) => ({ ...p, first_name: e.target.value }))} />
                </div>
                <div>
                  <Label>{t('teacherMgmt.lastName')}</Label>
                  <Input value={newParent.last_name} onChange={(e) => setNewParent((p) => ({ ...p, last_name: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>{t('invite.linkStudents')}</Label>
                {students.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('invite.noStudents')}
                  </p>
                ) : (
                  <div className="mt-2 border border-border rounded-md max-h-52 overflow-y-auto divide-y divide-border">
                    {students.map((s) => (
                      <label key={s.student_id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-3 py-2">
                        <Checkbox
                          checked={selectedChildren.includes(s.student_id)}
                          onCheckedChange={() => toggleChild(s.student_id)}
                        />
                        <span className="text-sm text-foreground">{s.display_name}</span>
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedChildren.length} {t('invite.selectedSuffix')}
                </p>
              </div>
              <Button onClick={inviteParent} disabled={isSaving || !newParent.email.trim()} className="w-full">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                {t('teacherMgmt.sendInvitation')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">{t('invite.pending')}</CardTitle>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t('invite.noPending')}</p>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => {
                const expired = new Date(invite.expires_at).getTime() < Date.now();
                const RoleIcon = invite.role === 'teacher' ? GraduationCap : Users;
                return (
                  <div key={invite.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">{invite.email}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><RoleIcon className="h-3 w-3" />{invite.role === 'teacher' ? t('invite.roleTeacher') : t('invite.roleParent')}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {expired ? t('invite.expired') : `${t('invite.expiresPrefix')} ${new Date(invite.expires_at).toLocaleDateString()}`}
                          </span>
                          {invite.role === 'parent' && invite.child_ids && invite.child_ids.length > 0 && (
                            <span>{invite.child_ids.length} {t('invite.linkedStudentsSuffix')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={expired ? 'destructive' : 'outline'}>{expired ? t('invite.expired') : t('invite.pendingBadge')}</Badge>
                      <Button size="sm" variant="outline" disabled={busyId === invite.id} onClick={() => resend(invite)}>
                        {busyId === invite.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span className="ml-1 hidden sm:inline">{t('invite.resend')}</span>
                      </Button>
                      <Button size="sm" variant="destructive" disabled={busyId === invite.id} onClick={() => revoke(invite)}>
                        <Ban className="h-4 w-4" />
                        <span className="ml-1 hidden sm:inline">{t('invite.revoke')}</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
