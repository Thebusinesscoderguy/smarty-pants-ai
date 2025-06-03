
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Mail, Clock, CheckCircle, Trash2 } from 'lucide-react';
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
  const { user, isDemoMode } = useAuth();

  useEffect(() => {
    fetchInvitations();
  }, [user]);

  const fetchInvitations = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Get school account first
      const { data: schoolData, error: schoolError } = await supabase
        .from('school_accounts')
        .select('id')
        .eq('admin_user_id', user.id)
        .single();

      if (schoolError) {
        console.error('Error fetching school:', schoolError);
        return;
      }

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
        description: "Failed to load invitations",
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

      // Get school account
      const { data: schoolData, error: schoolError } = await supabase
        .from('school_accounts')
        .select('id')
        .eq('admin_user_id', user?.id)
        .single();

      if (schoolError) {
        throw new Error('School account not found');
      }

      // Create invitation - this is real even in demo mode
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
        throw invitationError;
      }

      // Send invitation email - real in both demo and normal mode
      try {
        const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
          body: {
            invitationId: invitationData.id,
            studentEmail: newStudentEmail.trim(),
            studentName: `${newStudentFirstName} ${newStudentLastName}`.trim() || newStudentEmail,
            schoolName: 'Demo School',
            invitationCode: invitationData.invitation_code
          }
        });

        if (emailError) {
          console.error('Error sending email:', emailError);
          // In demo mode, show the invitation code since email might not work
          if (isDemoMode) {
            toast({
              title: "Invitation Created",
              description: `Real invitation created for ${newStudentEmail}! Share this invitation code: ${invitationData.invitation_code}`,
            });
          } else {
            toast({
              title: "Invitation Created",
              description: `Invitation created for ${newStudentEmail} but email sending failed. Share this code manually: ${invitationData.invitation_code}`,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Invitation Sent",
            description: `Real invitation sent to ${newStudentEmail}${isDemoMode ? ' (Demo Mode - but invitation is real!)' : ''}`,
          });
        }
      } catch (emailError) {
        // If email fails, still show success with the code
        toast({
          title: "Invitation Created",
          description: `Real invitation created for ${newStudentEmail}! Invitation code: ${invitationData.invitation_code}`,
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
              DEMO MODE - All operations are REAL!
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
            {isDemoMode && (
              <Badge variant="secondary" className="bg-green-600">
                Real Invitations
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
            {isInviting ? "Sending..." : "Send Real Invitation"}
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
