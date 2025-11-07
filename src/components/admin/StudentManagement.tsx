
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Mail, Clock, CheckCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface StudentInvitation {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  invitation_code: string;
  expires_at: string;
  used: boolean;
  used_at: string | null;
  created_at: string;
}

export const StudentManagement = () => {
  const [invitations, setInvitations] = useState<StudentInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentFirstName, setNewStudentFirstName] = useState('');
  const [newStudentLastName, setNewStudentLastName] = useState('');
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    fetchInvitations();
  }, [user]);

  const getSchoolAccount = async () => {
    if (!user) {
      throw new Error('No user found');
    }

    console.log('Getting school account for user:', user.id);
    
    const { data: schoolData, error: schoolError } = await supabase
      .from('school_accounts')
      .select('id, school_name')
      .eq('admin_user_id', user.id)
      .maybeSingle();

    if (schoolError) {
      console.error('Error fetching school:', schoolError);
      throw new Error(`Failed to fetch school account: ${schoolError.message}`);
    }

    if (!schoolData) {
      console.error('No school account found for user:', user.id);
      
      // Create the school account if it doesn't exist
      try {
        const { data: newSchool, error: createError } = await supabase
          .from('school_accounts')
          .insert({
            admin_user_id: user.id,
            school_name: 'My School',
            plan_type: 'school',
            student_limit: 1000,
            is_active: true
          })
          .select()
          .single();
        
        if (createError) throw createError;
        
        console.log('Created school account:', newSchool);
        return newSchool;
      } catch (createError) {
        console.error('Failed to create school:', createError);
        throw new Error('Failed to create school account');
      }
    }

    console.log('Found school account:', schoolData);
    return schoolData;
  };

  const fetchInvitations = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const schoolData = await getSchoolAccount();

      // Fetch invitations for this school
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('student_invitations')
        .select('*')
        .eq('school_id', schoolData.id)
        .order('created_at', { ascending: false });

      if (invitationsError) {
        console.error('Error fetching invitations:', invitationsError);
        toast({
          title: t('common.error'),
          description: t('adminStudentManagement.errorLoadingInvitations'),
          variant: "destructive"
        });
        return;
      }

      setInvitations(invitationsData || []);
    } catch (error: any) {
      console.error('Error in fetchInvitations:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('adminStudentManagement.errorLoadingInvitations'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inviteStudent = async () => {
    if (!newStudentEmail.trim()) {
      toast({
        title: t('common.error'),
        description: t('adminStudentManagement.errorEmail'),
        variant: "destructive"
      });
      return;
    }

    if (!newStudentFirstName.trim()) {
      toast({
        title: t('common.error'),
        description: t('adminStudentManagement.errorFirstName'),
        variant: "destructive"
      });
      return;
    }

    try {
      setIsInviting(true);
      console.log('Starting invitation process for:', newStudentEmail);

      const schoolData = await getSchoolAccount();
      console.log('Got school data:', schoolData);

      // Create invitation
      const { data: invitationData, error: invitationError } = await supabase
        .from('student_invitations')
        .insert({
          school_id: schoolData.id,
          invited_by_id: user?.id,
          email: newStudentEmail.trim(),
          first_name: newStudentFirstName.trim() || null,
          last_name: newStudentLastName.trim() || null,
        })
        .select()
        .single();

      if (invitationError) {
        console.error('Error creating invitation:', invitationError);
        throw new Error(`Failed to create invitation: ${invitationError.message}`);
      }

      console.log('Invitation created successfully:', invitationData);

      // Send invitation email
      console.log('Calling send-invitation-email function...');
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          invitationId: invitationData.id,
          studentEmail: newStudentEmail.trim(),
          studentName: `${newStudentFirstName} ${newStudentLastName}`.trim() || newStudentEmail,
          schoolName: schoolData.school_name,
          invitationCode: invitationData.invitation_code
        }
      });

      console.log('Email function response:', emailData);
      console.log('Email function error:', emailError);

      if (emailError) {
        console.error('Error calling email function:', emailError);
        toast({
          title: t('adminStudentManagement.invitationCreated'),
          description: `Invitation created for ${newStudentEmail} but email failed to send. Share this code manually: ${invitationData.invitation_code}`,
          variant: "destructive"
        });
      } else if (emailData?.success) {
        toast({
          title: t('adminStudentManagement.invitationSent'),
          description: t('adminStudentManagement.invitationSentDesc').replace('{email}', newStudentEmail),
        });
      } else {
        console.error('Email function returned non-success:', emailData);
        toast({
          title: t('adminStudentManagement.invitationCreated'),
          description: `Invitation created for ${newStudentEmail}. Code: ${invitationData.invitation_code}. Email may have failed to send.`,
          variant: "destructive"
        });
      }

      // Reset form
      setNewStudentEmail('');
      setNewStudentFirstName('');
      setNewStudentLastName('');

      // Refresh invitations
      fetchInvitations();

    } catch (error: any) {
      console.error('Error inviting student:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('adminStudentManagement.errorSendingInvitation'),
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };

  const deleteInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('student_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: t('adminStudentManagement.invitationDeleted'),
        description: t('adminStudentManagement.invitationDeletedDesc'),
      });

      fetchInvitations();
    } catch (error: any) {
      console.error('Error deleting invitation:', error);
      toast({
        title: t('common.error'),
        description: t('adminStudentManagement.errorDeletingInvitation'),
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse text-primary">{t('adminStudentManagement.loadingStudents')}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">{t('adminStudentManagement.title')}</h2>
        <p className="text-muted-foreground">
          {t('adminStudentManagement.subtitle')}
          <span className="ml-2 bg-green-600 text-white px-2 py-1 rounded text-sm">
            {t('adminStudentManagement.realEmailBadge')}
          </span>
        </p>
      </div>

      {/* Invite Student Form */}
      <Card className="bg-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <UserPlus className="h-5 w-5" />
            {t('adminStudentManagement.inviteStudent')}
            <Badge variant="secondary" className="bg-green-600">
              {t('adminStudentManagement.emailEnabled')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder={t('adminStudentManagement.emailPlaceholder')}
              type="email"
              value={newStudentEmail}
              onChange={(e) => setNewStudentEmail(e.target.value)}
              className="bg-primary/10 border-primary/20 text-primary"
              required
            />
            <Input
              placeholder={t('adminStudentManagement.firstNamePlaceholder')}
              value={newStudentFirstName}
              onChange={(e) => setNewStudentFirstName(e.target.value)}
              className="bg-primary/10 border-primary/20 text-primary"
              required
            />
            <Input
              placeholder={t('adminStudentManagement.lastNamePlaceholder')}
              value={newStudentLastName}
              onChange={(e) => setNewStudentLastName(e.target.value)}
              className="bg-primary/10 border-primary/20 text-primary"
            />
          </div>
          <Button 
            onClick={inviteStudent}
            disabled={isInviting || !newStudentEmail.trim() || !newStudentFirstName.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            {isInviting ? t('adminStudentManagement.sendingEmail') : t('adminStudentManagement.sendEmailInvitation')}
          </Button>
        </CardContent>
      </Card>

      {/* Invitations List */}
      <Card className="bg-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">{t('adminStudentManagement.invitationsSectionTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t('adminStudentManagement.noInvitations')}</p>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/10"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {invitation.used ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Mail className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-primary">
                        {invitation.first_name || invitation.last_name
                          ? `${invitation.first_name || ''} ${invitation.last_name || ''}`.trim()
                          : invitation.email}
                      </p>
                      <p className="text-sm text-muted-foreground">{invitation.email}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {t('adminStudentManagement.sent')} {new Date(invitation.created_at).toLocaleDateString()}
                        </span>
                        {!invitation.used && (
                          <span>
                            {t('adminStudentManagement.expires')} {new Date(invitation.expires_at).toLocaleDateString()}
                          </span>
                        )}
                        {!invitation.used && (
                          <span className="text-primary font-mono">
                            {t('adminStudentManagement.code')}: {invitation.invitation_code}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={invitation.used ? 'default' : 'secondary'}>
                      {invitation.used ? t('adminStudentManagement.accepted') : t('adminStudentManagement.pending')}
                    </Badge>
                    {!invitation.used && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteInvitation(invitation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
