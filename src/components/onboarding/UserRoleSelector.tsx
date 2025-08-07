import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Baby, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
}

interface UserRoleSelectorProps {
  onRoleSelected: (role: 'parent' | 'child', childId?: string) => void;
}

export const UserRoleSelector = ({ onRoleSelected }: UserRoleSelectorProps) => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, [user]);

  const fetchChildren = async () => {
    if (!user) return;

    try {
      // Get children from the children table
      const { data: childrenData } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id);

      if (childrenData && childrenData.length > 0) {
        const children = childrenData.map(child => ({
          id: child.id,
          first_name: child.first_name,
          last_name: child.last_name
        }));
        setChildren(children);
      }

      // Check if this user is a child in parent_child_relationships (for backward compatibility)
      const { data: childData } = await supabase
        .from('parent_child_relationships')
        .select('parent_id')
        .eq('child_id', user.id);

      // If user is a child, they don't need to select a role
      if (childData && childData.length > 0) {
        onRoleSelected('child', user.id);
      }
    } catch (error) {
      console.error('Error fetching family data:', error);
    }
  };

  const handleRoleSelection = async (role: 'parent' | 'child', childId?: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      let targetUserId = user.id;
      let targetRole = role === 'parent' ? 'parent' : 'student';

      // If selecting a child, use the child's ID
      if (role === 'child' && childId) {
        targetUserId = childId;
      }

      // Update the profile with the selected role
      const { error } = await supabase
        .from('profiles')
        .update({
          role: targetRole as 'student' | 'parent' | 'teacher',
          updated_at: new Date().toISOString()
        })
        .eq('id', targetUserId);

      if (error) throw error;

      onRoleSelected(role, childId);
      toast({
        title: "Role Selected",
        description: `Welcome! You're now set up as a ${role}.`
      });
    } catch (error) {
      console.error('Error setting role:', error);
      toast({
        title: "Error",
        description: "Failed to set role. Please try again.",
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
            Who is using TeachlyAI today?
          </h1>
          <p className="text-white/70">
            Select your role to personalize your experience
          </p>
        </div>
        
        <div className="grid gap-6">
          {/* Parent Option */}
          <Card 
            className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:from-purple-500/20 hover:to-pink-500/20 transition-all cursor-pointer group backdrop-blur-sm"
            onClick={() => handleRoleSelection('parent')}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full w-fit group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-colors">
                <Users className="h-8 w-8 text-purple-400" />
              </div>
              <CardTitle className="text-white">I'm the Parent</CardTitle>
              <CardDescription className="text-white/70">
                Monitor and support my children's learning progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/60 mb-4">
                <li>• View real progress data</li>
                <li>• Monitor learning analytics</li>
                <li>• Track achievements</li>
                <li>• Manage study plans</li>
              </ul>
              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoleSelection('parent');
                }}
                disabled={loading}
              >
                Continue as Parent
              </Button>
            </CardContent>
          </Card>

          {/* Children Options */}
          {children.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white text-center">Or select one of your children:</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {children.map((child) => (
                  <Card 
                    key={child.id}
                    className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 hover:from-blue-500/20 hover:to-cyan-500/20 transition-all cursor-pointer group backdrop-blur-sm"
                    onClick={() => handleRoleSelection('child', child.id)}
                  >
                    <CardHeader className="text-center pb-2">
                      <div className="mx-auto mb-2 p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full w-fit group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-colors">
                        <Baby className="h-6 w-6 text-blue-400" />
                      </div>
                      <CardTitle className="text-white text-lg">
                        {child.first_name} {child.last_name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRoleSelection('child', child.id);
                        }}
                        disabled={loading}
                      >
                        Continue as {child.first_name}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* If no children, show message that they need to add children first */}
          {children.length === 0 && (
            <div className="text-center py-8">
              <p className="text-white/70 mb-4">
                No children found in your account. Please add children first to access student features.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};