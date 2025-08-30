import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Trash2, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ChildRelationship {
  id: string;
  child_id: string;
  child_email: string;
  child_name: string;
  created_at: string;
}

export const ParentChildManager = () => {
  const [relationships, setRelationships] = useState<ChildRelationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [childEmail, setChildEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRelationships();
    }
  }, [user]);

  const fetchRelationships = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // First get the relationships
      const { data: relationshipsData, error: relationshipsError } = await supabase
        .from('parent_child_relationships')
        .select('*')
        .eq('parent_id', user.id);

      if (relationshipsError) {
        console.error('Error fetching relationships:', relationshipsError);
        return;
      }

      console.log('DEBUG: Parent-child relationships:', relationshipsData);

      // Then get child details from profiles
      if (relationshipsData && relationshipsData.length > 0) {
        const childIds = relationshipsData.map(r => r.child_id);
        
        const { data: childrenProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', childIds);

        if (profilesError) {
          console.error('Error fetching child profiles:', profilesError);
          return;
        }

        // Get child emails from auth.users (we can't query directly, so we'll use the id)
        const enrichedRelationships = relationshipsData.map(rel => {
          const profile = childrenProfiles?.find(p => p.id === rel.child_id);
          return {
            id: rel.id,
            child_id: rel.child_id,
            child_email: rel.child_id, // We'll show the ID as fallback
            child_name: profile?.display_name || 'Unknown Child',
            created_at: rel.created_at
          };
        });

        setRelationships(enrichedRelationships);
      } else {
        setRelationships([]);
      }
    } catch (error: any) {
      console.error('Error in fetchRelationships:', error);
      toast({
        title: "Error",
        description: "Failed to load child relationships",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createRelationship = async () => {
    if (!user || !childEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid child email",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreating(true);

      // First, try to find the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('id', childEmail.trim()) // For now, assume they enter user ID
        .single();

      let childId = childEmail.trim();
      let childName = 'New Child';

      if (userData) {
        childId = userData.id;
        childName = userData.display_name || childName;
      }

      // Create the parent-child relationship
      const { data, error } = await supabase
        .from('parent_child_relationships')
        .insert({
          parent_id: user.id,
          child_id: childId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating relationship:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: `Child relationship created successfully!`,
      });

      setChildEmail('');
      setIsDialogOpen(false);
      await fetchRelationships();
    } catch (error: any) {
      console.error('Error creating relationship:', error);
      toast({
        title: "Error",
        description: "Failed to create child relationship: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteRelationship = async (relationshipId: string) => {
    try {
      const { error } = await supabase
        .from('parent_child_relationships')
        .delete()
        .eq('id', relationshipId)
        .eq('parent_id', user?.id); // Extra security check

      if (error) throw error;

      toast({
        title: "Success",
        description: "Child relationship removed successfully",
      });

      await fetchRelationships();
    } catch (error: any) {
      console.error('Error deleting relationship:', error);
      toast({
        title: "Error",
        description: "Failed to remove child relationship",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse text-white">Loading relationships...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Parent-Child Management</h2>
          <p className="text-gray-400">
            Manage relationships with your children to share quests and achievements
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Child
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Add Child Relationship</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="childId" className="text-white">Child's User ID</Label>
                <Input
                  id="childId"
                  value={childEmail}
                  onChange={(e) => setChildEmail(e.target.value)}
                  placeholder="Enter child's user ID"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
                <p className="text-sm text-gray-400 mt-1">
                  Ask the child to go to Settings to find their User ID, or ask them to create an account first.
                </p>
              </div>
              
              <Button 
                onClick={createRelationship}
                disabled={isCreating || !childEmail.trim()}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isCreating ? 'Adding...' : 'Add Child'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Instructions Card */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-400" />
            How to Connect with Your Child
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-300">
          <div className="flex gap-3">
            <Badge variant="outline" className="min-w-fit">1</Badge>
            <p>Ask your child to create an account and go to Settings</p>
          </div>
          <div className="flex gap-3">
            <Badge variant="outline" className="min-w-fit">2</Badge>
            <p>They'll find their unique User ID in the account section</p>
          </div>
          <div className="flex gap-3">
            <Badge variant="outline" className="min-w-fit">3</Badge>
            <p>Enter their User ID above and click "Add Child"</p>
          </div>
          <div className="flex gap-3">
            <Badge variant="outline" className="min-w-fit">4</Badge>
            <p>Your quests and achievements will now appear in their dashboard!</p>
          </div>
        </CardContent>
      </Card>

      {/* Relationships list */}
      <div className="grid gap-4">
        {relationships.length === 0 ? (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">No child relationships established yet.</p>
              <p className="text-gray-400 text-sm mt-2">
                Add your children to share quests and achievements with them.
              </p>
            </CardContent>
          </Card>
        ) : (
          relationships.map((relationship) => (
            <Card key={relationship.id} className="bg-white/10 border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {relationship.child_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{relationship.child_name}</h3>
                      <p className="text-sm text-gray-400">ID: {relationship.child_id.slice(0, 8)}...</p>
                      <p className="text-xs text-gray-500">
                        Connected: {new Date(relationship.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteRelationship(relationship.id)}
                    className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};