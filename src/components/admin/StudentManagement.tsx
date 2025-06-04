
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Mail, Clock, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user, isDemoMode, supabaseConnected } = useAuth();

  useEffect(() => {
    fetchInvitations();
  }, [user]);

  const getSchoolAccount = async () => {
    if (!user) {
      throw new Error('No user found');
    }

    if (!supabaseConnected) {
      // Return mock data for offline demo mode
      return {
        id: 'demo-school-id',
        school_name: 'Demo School'
      };
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
      
      // In demo mode, try to create the school account
      if (isDemoMode) {
        try {
          const { data: newSchool, error: createError } = await supabase
            .from('school_accounts')
            .insert({
              admin_user_id: user.id,
              school_name: 'Demo School',
              plan_type: 'school',
              student_limit: 1000,
              is_active: true
            })
            .select()
            .single();
          
          if (createError) throw createError;
          
          console.log('Created demo school account:', newSchool);
          return newSchool;
        } catch (createError) {
          console.error('Failed to create demo school:', createError);
          throw new Error('Failed to create demo school account');
        }
      } else {
        throw new Error('School account not found. Please ensure your account is properly set up.');
      }
    }

    console.log('Found school account:', schoolData);
    return schoolData;
  };

  const fetchInvitations = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      if (!supabaseConnected) {
        // Show mock data for offline demo mode
        setInvitations([
          {
            id: 'demo-invitation-1',
            email: 'student@example.com',
            first_name: 'Demo',
            last_name: 'Student',
            invitation_code: 'DEMO123',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            used: false,
            used_at: null,
            created_at: new Date().toISOString()
          }
        ]);
        return;
      }

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
          title: "Error",
          description: "Failed to load student invitations",
          variant: "destructive"
        });
        return;
      }

      setInvitations(invitationsData || []);
    } catch (error: any) {
      console.error('Error in fetchInvitations:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load invitations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inviteStudent = async () => {
    if (!newStudentEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsInviting(true);

      if (!supabaseConnected) {
        // Simulate invitation creation in offline mode
        const mockInvitation = {
          id: `demo-invitation-${Date.now()}`,
          email: newStudentEmail.trim(),
          first_name: newStudentFirstName.trim() || null,
          last_name: newStudentLastName.trim() || null,
          invitation_code: `DEMO${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          used: false,
          used_at: null,
          created_at: new Date().toISOString()
        };

        setInvitations(prev => [mockInvitation, ...prev]);
        
        toast({
          title: "Demo Invitation Created",
          description: `Demo invitation created for ${newStudentEmail} (Code: ${mockInvitation.invitation_code})`,
        });

        // Reset form
        setNewStudentEmail('');
        setNewStudentFirstName('');
        setNewStudentLastName('');
        return;
      }

      const schoolData = await getSchoolAccount();

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

      console.log('Invitation created, now sending email...');

      // Send invitation email
      try {
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

        if (emailError) {
          console.error('Error sending email:', emailError);
          toast({
            title: "Invitation Created",
            description: `Invitation created for ${newStudentEmail} but email failed to send. Share this code: ${invitationData.invitation_code}`,
            variant: "destructive"
          });
        } else if (emailData?.success) {
          toast({
            title: "Invitation Sent Successfully! 📧",
            description: `Email invitation sent to ${newStudentEmail}. They should receive it shortly.`,
          });
        } else {
          toast({
            title: "Invitation Created",
            description: `Invitation created for ${newStudentEmail}. Code: ${invitationData.invitation_code}`,
          });
        }
      } catch (emailError) {
        console.error('Email function error:', emailError);
        toast({
          title: "Invitation Created",
          description: `Invitation created for ${newStudentEmail}. Code: ${invitationData.invitation_code}`,
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
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };

  const deleteInvitation = async (invitationId: string) => {
    try {
      if (!supabaseConnected) {
        // Remove from local state in offline mode
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        toast({
          title: "Demo Invitation Deleted",
          description: "Invitation has been removed (demo mode)",
        });
        return;
      }

      const { error } = await supabase
        .from('student_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Invitation Deleted",
        description: "Invitation has been removed",
      });

      fetchInvitations();
    } catch (error: any) {
      console.error('Error deleting invitation:', error);
      toast({
        title: "Error",
        description: "Failed to delete invitation",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse text-white">Loading student data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Student Management</h2>
        <p className="text-gray-400">
          Invite and manage students in your school
          {isDemoMode && (
            <span className="ml-2 bg-green-600 text-white px-2 py-1 rounded text-sm">
              {supabaseConnected ? 'DEMO MODE - Real Operations!' : 'OFFLINE DEMO MODE'}
            </span>
          )}
          {!supabaseConnected && (
            <span className="ml-2 bg-red-600 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Offline Mode
            </span>
          )}
        </p>
      </div>

      {/* Invite Student Form */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <UserPlus className="h-5 w-5" />
            Invite Student
            {supabaseConnected ? (
              <Badge variant="secondary" className="bg-green-600">
                ✅ Email Enabled
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-orange-600">
                Simulated
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Email address"
              type="email"
              value={newStudentEmail}
              onChange={(e) => setNewStudentEmail(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
            />
            <Input
              placeholder="First name (optional)"
              value={newStudentFirstName}
              onChange={(e) => setNewStudentFirstName(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
            />
            <Input
              placeholder="Last name (optional)"
              value={newStudentLastName}
              onChange={(e) => setNewStudentLastName(e.target.value)}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <Button 
            onClick={inviteStudent}
            disabled={isInviting || !newStudentEmail.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isInviting ? "Sending Email..." : supabaseConnected ? "📧 Send Email Invitation" : "Create Demo Invitation"}
          </Button>
        </CardContent>
      </Card>

      {/* Invitations List */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Student Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No invitations sent yet</p>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {invitation.used ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Mail className="h-5 w-5 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {invitation.first_name || invitation.last_name
                          ? `${invitation.first_name || ''} ${invitation.last_name || ''}`.trim()
                          : invitation.email}
                      </p>
                      <p className="text-sm text-gray-400">{invitation.email}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Sent {new Date(invitation.created_at).toLocaleDateString()}
                        </span>
                        {!invitation.used && (
                          <span>
                            Expires {new Date(invitation.expires_at).toLocaleDateString()}
                          </span>
                        )}
                        {!invitation.used && (
                          <span className="text-blue-400 font-mono">
                            Code: {invitation.invitation_code}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={invitation.used ? 'default' : 'secondary'}>
                      {invitation.used ? 'Accepted' : 'Pending'}
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
