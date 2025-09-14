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
  first_name: string;
  last_name: string;
  grade_level: string;
  subjects: string[];
}

interface ChildrenManagementProps {
  onComplete: () => void;
}

export const ChildrenManagement = ({ onComplete }: ChildrenManagementProps) => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [newChild, setNewChild] = useState({ 
    firstName: '', 
    lastName: '', 
    gradeLevel: ''
  });
  const [loading, setLoading] = useState(false);

  const gradeOptions = [
    'Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade',
    '5th Grade', '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade',
    '11th Grade', '12th Grade'
  ];

  useEffect(() => {
    fetchChildren();
  }, [user]);

  const fetchChildren = async () => {
    if (!user) return;

    try {
      const { data: children, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id);

      if (error) throw error;

      const childrenData = children?.map(child => ({
        id: child.id,
        first_name: child.first_name,
        last_name: child.last_name,
        grade_level: child.grade_level || '',
        subjects: child.subjects || []
      })) || [];

      setChildren(childrenData);
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const addChild = async () => {
    if (!user || !newChild.firstName || !newChild.lastName || !newChild.gradeLevel) {
      toast({
        title: "Error",
        description: "Please fill in name and grade level",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Insert directly into children table
      const { data: childData, error: childError } = await supabase
        .from('children')
        .insert({
          parent_id: user.id,
          first_name: newChild.firstName,
          last_name: newChild.lastName,
          grade_level: newChild.gradeLevel,
          subjects: []
        })
        .select()
        .single();

      if (childError) throw childError;

      setNewChild({ firstName: '', lastName: '', gradeLevel: '' });
      fetchChildren();
      toast({
        title: "Child Added",
        description: `${newChild.firstName} has been added to your family account.`
      });
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
    <div className="w-full p-4">
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
                <Label htmlFor="gradeLevel" className="text-white">Grade Level</Label>
                <select
                  id="gradeLevel"
                  value={newChild.gradeLevel}
                  onChange={(e) => setNewChild(prev => ({ ...prev, gradeLevel: e.target.value }))}
                  className="w-full p-2 bg-white/10 border border-white/20 text-white rounded-md"
                >
                  <option value="" className="bg-gray-800">Select grade level</option>
                  {gradeOptions.map(grade => (
                    <option key={grade} value={grade} className="bg-gray-800">{grade}</option>
                  ))}
                </select>
              </div>
              <Button 
                onClick={addChild}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
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
                        <div className="p-2 bg-purple-500/20 rounded-full">
                          <UserCheck className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {child.first_name} {child.last_name}
                          </p>
                          <p className="text-white/60 text-sm">
                            {child.grade_level && `Grade: ${child.grade_level}`}
                          </p>
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
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-8"
          >
            Continue to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};