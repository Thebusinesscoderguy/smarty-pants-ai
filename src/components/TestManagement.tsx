
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Edit, Trash2, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Test {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  time_limit_minutes: number | null;
  total_points: number | null;
  created_at: string;
}

export const TestManagement = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTest, setNewTest] = useState({
    title: '',
    description: '',
    subject: '',
    time_limit_minutes: 30
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchTests();
  }, [user]);

  const fetchTests = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error: any) {
      console.error('Error fetching tests:', error);
      toast({
        title: "Error",
        description: "Failed to load tests",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTest = async () => {
    if (!user || !newTest.title.trim()) return;

    try {
      setIsCreating(true);
      const { data, error } = await supabase
        .from('tests')
        .insert({
          creator_id: user.id,
          title: newTest.title.trim(),
          description: newTest.description.trim() || null,
          subject: newTest.subject.trim() || null,
          time_limit_minutes: newTest.time_limit_minutes
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Test Created",
        description: `Test "${newTest.title}" has been created successfully`,
      });

      setNewTest({ title: '', description: '', subject: '', time_limit_minutes: 30 });
      fetchTests();
    } catch (error: any) {
      console.error('Error creating test:', error);
      toast({
        title: "Error",
        description: "Failed to create test",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    try {
      const { error } = await supabase
        .from('tests')
        .delete()
        .eq('id', testId);

      if (error) throw error;

      toast({
        title: "Test Deleted",
        description: "Test has been deleted successfully",
      });

      fetchTests();
    } catch (error: any) {
      console.error('Error deleting test:', error);
      toast({
        title: "Error",
        description: "Failed to delete test",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse text-white">Loading tests...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Test Management</h2>
        <p className="text-gray-400">Create and manage tests for your students</p>
      </div>

      {/* Create Test Form */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Plus className="h-5 w-5" />
            Create New Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Test title"
              value={newTest.title}
              onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
              className="bg-white/10 border-white/20 text-white"
            />
            <Input
              placeholder="Subject (optional)"
              value={newTest.subject}
              onChange={(e) => setNewTest({ ...newTest, subject: e.target.value })}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <Textarea
            placeholder="Test description (optional)"
            value={newTest.description}
            onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
            className="bg-white/10 border-white/20 text-white"
          />
          <div className="flex items-center gap-4">
            <label className="text-white text-sm">Time Limit (minutes):</label>
            <Input
              type="number"
              min="1"
              max="180"
              value={newTest.time_limit_minutes}
              onChange={(e) => setNewTest({ ...newTest, time_limit_minutes: parseInt(e.target.value) || 30 })}
              className="bg-white/10 border-white/20 text-white w-24"
            />
          </div>
          <Button 
            onClick={createTest}
            disabled={isCreating || !newTest.title.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreating ? "Creating..." : "Create Test"}
          </Button>
        </CardContent>
      </Card>

      {/* Tests List */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Your Tests</CardTitle>
        </CardHeader>
        <CardContent>
          {tests.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No tests created yet</p>
          ) : (
            <div className="space-y-4">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <FileText className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{test.title}</h3>
                      {test.description && (
                        <p className="text-sm text-gray-400">{test.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        {test.subject && (
                          <Badge variant="secondary" className="bg-blue-600/20 text-blue-300">
                            {test.subject}
                          </Badge>
                        )}
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {test.time_limit_minutes} min
                        </span>
                        <span>
                          Created {new Date(test.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteTest(test.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
