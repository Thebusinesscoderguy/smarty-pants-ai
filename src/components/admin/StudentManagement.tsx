
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Mail, UserPlus, Search, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface StudentInvitation {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  invitation_code: string;
  used: boolean;
  created_at: string;
  expires_at: string;
  school_id: string | null;
}

interface EnrolledStudent {
  id: string;
  student_id: string;
  enrolled_at: string;
  is_active: boolean;
  profiles: {
    display_name: string | null;
  } | null;
  auth_users: {
    email: string;
  } | null;
}

export const StudentManagement = () => {
  const [invitations, setInvitations] = useState<StudentInvitation[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'invitations' | 'students'>('invitations');
  const { user } = useAuth();
  const [newInvite, setNewInvite] = useState({
    email: '',
    firstName: '',
    lastName: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([fetchInvitations(), fetchEnrolledStudents()]);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load student data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvitations = async () => {
    const { data, error } = await supabase
      .from('student_invitations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setInvitations(data || []);
  };

  const fetchEnrolledStudents = async () => {
    if (!user) return;

    // Get school account
    const { data: schoolData, error: schoolError } = await supabase
      .from('school_accounts')
      .select('id')
      .eq('admin_user_id', user.id)
      .single();

    if (schoolError) throw schoolError;

    // Get enrolled students
    const { data, error } = await supabase
      .from('school_student_relationships')
      .select(`
        id,
        student_id,
        enrolled_at,
        is_active,
        profiles!inner(display_name)
      `)
      .eq('school_id', schoolData.id)
      .eq('is_active', true);

    if (error) throw error;
    setEnrolledStudents(data || []);
  };

  const sendInvitationEmail = async (invitation: StudentInvitation, schoolName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          invitationId: invitation.id,
          studentEmail: invitation.email,
          studentName: `${invitation.first_name || ''} ${invitation.last_name || ''}`.trim() || 'Student',
          schoolName,
          invitationCode: invitation.invitation_code
        }
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: `Invitation email sent to ${invitation.email}`,
      });
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: "Email Error",
        description: "Failed to send invitation email, but invitation was created",
        variant: "destructive"
      });
    }
  };

  const createInvitation = async () => {
    if (!newInvite.email.trim() || !user) return;

    try {
      setIsCreatingInvite(true);

      // Get school account
      const { data: schoolData, error: schoolError } = await supabase
        .from('school_accounts')
        .select('id, school_name')
        .eq('admin_user_id', user.id)
        .single();

      if (schoolError) throw schoolError;

      // Create invitation
      const { data, error } = await supabase
        .from('student_invitations')
        .insert({
          email: newInvite.email,
          first_name: newInvite.firstName || null,
          last_name: newInvite.lastName || null,
          invited_by_id: user.id,
          school_id: schoolData.id
        })
        .select()
        .single();

      if (error) throw error;

      setInvitations([data, ...invitations]);
      setNewInvite({ email: '', firstName: '', lastName: '' });
      
      // Send email
      await sendInvitationEmail(data, schoolData.school_name);

      toast({
        title: "Invitation Created",
        description: `Invitation sent to ${newInvite.email}`,
      });
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      toast({
        title: "Error",
        description: "Failed to create invitation",
        variant: "destructive"
      });
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const copyInvitationLink = (invitationCode: string) => {
    const link = `${window.location.origin}/accept-invitation?code=${invitationCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Invitation link copied to clipboard",
    });
  };

  const filteredInvitations = invitations.filter(invite =>
    invite.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (invite.first_name && invite.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (invite.last_name && invite.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredStudents = enrolledStudents.filter(student =>
    (student.profiles?.display_name && student.profiles.display_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return <div className="animate-pulse">Loading students...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with search and add button */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'invitations' ? 'default' : 'outline'}
            onClick={() => setActiveTab('invitations')}
          >
            Invitations ({invitations.length})
          </Button>
          <Button
            variant={activeTab === 'students' ? 'default' : 'outline'}
            onClick={() => setActiveTab('students')}
          >
            Enrolled Students ({enrolledStudents.length})
          </Button>
        </div>
        
        <div className="flex gap-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white"
            />
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Invite Student
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Invite New Student</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-white">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newInvite.email}
                    onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                    placeholder="student@example.com"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-white">First Name</Label>
                    <Input
                      id="firstName"
                      value={newInvite.firstName}
                      onChange={(e) => setNewInvite({ ...newInvite, firstName: e.target.value })}
                      placeholder="John"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-white">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newInvite.lastName}
                      onChange={(e) => setNewInvite({ ...newInvite, lastName: e.target.value })}
                      placeholder="Doe"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
                <Button 
                  onClick={createInvitation}
                  disabled={isCreatingInvite || !newInvite.email.trim()}
                  className="w-full"
                >
                  {isCreatingInvite ? 'Creating...' : 'Send Invitation'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content based on active tab */}
      <div className="grid gap-4">
        {activeTab === 'invitations' ? (
          filteredInvitations.length === 0 ? (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-6 text-center">
                <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300">
                  {searchTerm ? 'No invitations found matching your search.' : 'No student invitations yet.'}
                </p>
                {!searchTerm && (
                  <p className="text-gray-400 text-sm mt-2">
                    Start by inviting students to join your school.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredInvitations.map((invitation) => (
              <Card key={invitation.id} className="bg-white/10 border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">
                          {invitation.first_name || invitation.last_name 
                            ? `${invitation.first_name || ''} ${invitation.last_name || ''}`.trim()
                            : 'Unnamed Student'
                          }
                        </h3>
                        <p className="text-sm text-gray-400">{invitation.email}</p>
                        <p className="text-xs text-gray-500">
                          Invited {new Date(invitation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={invitation.used ? "default" : "secondary"}>
                        {invitation.used ? "Accepted" : "Pending"}
                      </Badge>
                      {!invitation.used && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyInvitationLink(invitation.invitation_code)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <p className="text-xs text-gray-400">
                            Code: {invitation.invitation_code}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )
        ) : (
          filteredStudents.length === 0 ? (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-6 text-center">
                <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300">
                  {searchTerm ? 'No students found matching your search.' : 'No enrolled students yet.'}
                </p>
                {!searchTerm && (
                  <p className="text-gray-400 text-sm mt-2">
                    Students will appear here once they accept their invitations.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredStudents.map((student) => (
              <Card key={student.id} className="bg-white/10 border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <UserPlus className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">
                          {student.profiles?.display_name || 'Student'}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Enrolled {new Date(student.enrolled_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )
        )}
      </div>
    </div>
  );
};
