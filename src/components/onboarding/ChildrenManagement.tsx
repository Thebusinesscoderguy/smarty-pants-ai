import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Users, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Child {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface ChildrenManagementProps {
  onComplete: () => void;
}

export const ChildrenManagement = ({ onComplete }: ChildrenManagementProps) => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [newChild, setNewChild] = useState({ firstName: '', lastName: '', email: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, [user]);

  const fetchChildren = async () => {
    if (!user) return;

    try {
      const { data: relationships, error } = await supabase
        .from('parent_child_relationships')
        .select('child_id')
        .eq('parent_id', user.id);

      if (error) throw error;

      if (!relationships || relationships.length === 0) {
        setChildren([]);
        return;
      }

      // Get profiles for children
      const childIds = relationships.map(rel => rel.child_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', childIds);

      if (profileError) throw profileError;

      const childrenData = profiles?.map(profile => ({
        id: profile.id,
        email: '',
        first_name: profile.display_name?.split(' ')[0] || 'Child',
        last_name: profile.display_name?.split(' ')[1] || ''
      })) || [];

      setChildren(childrenData);
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const addChild = async () => {
    if (!user || !newChild.firstName || !newChild.lastName || !newChild.email) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create child profile
      const { data: childData, error: signUpError } = await supabase.auth.signUp({
        email: newChild.email,
        password: 'temppassword123', // Temporary password - should be changed on first login
        options: {
          data: {
            first_name: newChild.firstName,
            last_name: newChild.lastName,
            role: 'student'
          }
        }
      });

      if (signUpError) throw signUpError;

      if (childData.user) {
        // Create parent-child relationship
        const { error: relationError } = await supabase
          .from('parent_child_relationships')
          .insert({
            parent_id: user.id,
            child_id: childData.user.id
          });

        if (relationError) throw relationError;

        setNewChild({ firstName: '', lastName: '', email: '' });
        fetchChildren();
        toast({
          title: "Child Added",
          description: `${newChild.firstName} has been added to your family account.`
        });
      }
    } catch (error: any) {
      console.error('Error adding child:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add child",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Manage Your Children
          </h1>
          <p className="text-white/70">
            Add children to your family account to monitor their progress
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Add New Child */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Child
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="firstName" className="text-white">First Name</Label>
                <Input
                  id="firstName"
                  value={newChild.firstName}
                  onChange={(e) => setNewChild(prev => ({ ...prev, firstName: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-white">Last Name</Label>
                <Input
                  id="lastName"
                  value={newChild.lastName}
                  onChange={(e) => setNewChild(prev => ({ ...prev, lastName: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newChild.email}
                  onChange={(e) => setNewChild(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Enter email address"
                />
              </div>
              <Button 
                onClick={addChild}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {loading ? 'Adding...' : 'Add Child'}
              </Button>
            </CardContent>
          </Card>

          {/* Children List */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Children ({children.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {children.length === 0 ? (
                <div className="text-center text-white/60 py-8">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No children added yet</p>
                  <p className="text-sm">Add your first child to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {children.map((child) => (
                    <div 
                      key={child.id}
                      className="p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-full">
                          <UserCheck className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {child.first_name} {child.last_name}
                          </p>
                          <p className="text-white/60 text-sm">{child.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Button 
            onClick={onComplete}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-8"
          >
            Continue to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};