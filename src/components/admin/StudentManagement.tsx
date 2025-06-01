
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Mail, Clock, CheckCircle } from 'lucide-react';
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
  created_at: string;
  expires_at: string;
  used: boolean;
}

interface EnrolledStudent {
  id: string;
  student_id: string;
  enrolled_at: string;
  is_active: boolean;
  student_email?: string;
  student_name?: string;
}

export const StudentManagement = () => {
  const [invitations, setInvitations] = useState<StudentInvitation[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { user, isSchoolAdmin } = useAuth();
  
  const [newStudent, setNewStudent] = useState({
    email: '',
    firstName: '',
    lastName: ''
  });

  useEffect(() => {
    if (isSchoolAdmin && user) {
      fetchStudentData();
    }
  }, [isSchoolAdmin, user]);

  const getSchoolId = async () => {
    // Get the school ID for the current admin
    const { data: schoolData, error: schoolError } = await supabase
      .from('school_accounts')
      .select('id')
      .eq('admin_user_id', user?.id)
      .single();

    if (schoolError) {
      throw new Error('No school account found for this admin');
    }

    return schoolData.id;
  };

  const fetchStudentData = async () => {
    try {
      setIsLoading(true);
      
      const schoolId = await getSchoolId();

      // Fetch pending invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('student_invitations')
        .select('*')
        .eq('school_id', schoolId)
        .eq('used', false)
        .order('created_at', { ascending: false });

      if (invitationsError) throw invitationsError;

      // Fetch enrolled students
      const { data: enrolledData, error: enrolledError } = await supabase
        .from('school_student_relationships')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true);

      if (enrolledError) throw enrolledError;

      setInvitations(invitationsData || []);
      setEnrolledStudents(enrolledData || []);

    } catch (error: any) {
      console.error('Error fetching student data:', error);
      toast({
        title: "Error",
        description: "Failed to load student data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createInvitation = async () => {
    if (!newStudent.email.trim()) return;

    try {
      setIsCreating(true);
      
      const schoolId = await getSchoolId();

      const { data, error } = await supabase
        .from('student_invitations')
        .insert({
          email: newStudent.email,
          first_name: newStudent.firstName || null,
          last_name: newStudent.lastName || null,
          invited_by_id: user?.id,
          school_id: schoolId
        })
        .select()
        .single();

      if (error) throw error;

      // Send invitation email
      setIsSendingEmail(true);
      try {
        const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
          body: {
            to: newStudent.email,
            studentName: `${newStudent.firstName} ${newStudent.lastName}`.trim() || 'Student',
            invitationCode: data.invitation_code,
            schoolName: 'Your School'
          }
        });

        if (emailError) {
          console.error('Email sending error:', emailError);
          toast({
            title: "Invitation Created",
            description: "Student invitation created but email could not be sent. Share the invitation code manually.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Invitation Sent! 📧",
            description: `Invitation email sent to ${newStudent.email}`,
          });
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        toast({
          title: "Invitation Created",
          description: "Student invitation created but email could not be sent. Share the invitation code manually.",
          variant: "destructive"
        });
      } finally {
        setIsSendingEmail(false);
      }

      setInvitations([data, ...invitations]);
      setNewStudent({ email: '', firstName: '', lastName: '' });
      
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create student invitation",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!isSchoolAdmin) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400">You need to be a school administrator to access this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="animate-pulse">Loading student management...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with invite button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Student Management</h2>
          <p className="text-gray-400">Invite and manage students in your school</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Invite Student
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Invite New Student</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-white">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  placeholder="student@example.com"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-white">First Name</Label>
                  <Input
                    id="firstName"
                    value={newStudent.firstName}
                    onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                    placeholder="John"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName" className="text-white">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newStudent.lastName}
                    onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                    placeholder="Doe"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>

              <Button 
                onClick={createInvitation}
                disabled={isCreating || isSendingEmail || !newStudent.email.trim()}
                className="w-full"
              >
                {isCreating ? 'Creating...' : isSendingEmail ? 'Sending Email...' : 'Send Invitation'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Invitations */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Mail className="h-5 w-5 text-yellow-500" />
            Pending Invitations ({invitations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No pending invitations</p>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                  <div>
                    <div className="font-medium text-white">
                      {invitation.first_name && invitation.last_name 
                        ? `${invitation.first_name} ${invitation.last_name}` 
                        : 'Unnamed Student'}
                    </div>
                    <div className="text-sm text-gray-300">{invitation.email}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Code: {invitation.invitation_code} • 
                      Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrolled Students */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5 text-green-500" />
            Enrolled Students ({enrolledStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enrolledStudents.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No enrolled students yet</p>
          ) : (
            <div className="space-y-3">
              {enrolledStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                  <div>
                    <div className="font-medium text-white">
                      Student ID: {student.student_id}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Enrolled: {new Date(student.enrolled_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Enrolled
                    </Badge>
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
