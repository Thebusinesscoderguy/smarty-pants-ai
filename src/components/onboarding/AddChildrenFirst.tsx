import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  grade_level: string | null;
}

interface AddChildrenFirstProps {
  onComplete: () => void;
}

export const AddChildrenFirst = ({ onComplete }: AddChildrenFirstProps) => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchExistingChildren();
    }
  }, [user]);

  const fetchExistingChildren = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setChildren(data);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleAddChild = async () => {
    if (!user) return;
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Please enter both first and last name');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('children')
        .insert({
          parent_id: user.id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          grade_level: gradeLevel || null,
        })
        .select()
        .single();

      if (error) throw error;

      setChildren([...children, data]);
      setFirstName('');
      setLastName('');
      setGradeLevel('');
      
      toast.success(`${data.first_name} has been added!`);
    } catch (error: any) {
      console.error('Error adding child:', error);
      toast.error('Failed to add child. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Let's Set Up Your Family
          </h1>
          <p className="text-muted-foreground text-lg">
            Add your children to personalize their learning experience
          </p>
        </div>

        {/* Add Child Form */}
        <Card className="mb-6 border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add a Child
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your child's information below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">First Name *</label>
                <Input
                  placeholder="Enter first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-muted/20 border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Last Name *</label>
                <Input
                  placeholder="Enter last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-muted/20 border-border text-foreground"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Grade Level (Optional)</label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger className="bg-muted/20 border-border text-foreground">
                  <SelectValue placeholder="Select grade level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kindergarten">Kindergarten</SelectItem>
                  <SelectItem value="1st">1st Grade</SelectItem>
                  <SelectItem value="2nd">2nd Grade</SelectItem>
                  <SelectItem value="3rd">3rd Grade</SelectItem>
                  <SelectItem value="4th">4th Grade</SelectItem>
                  <SelectItem value="5th">5th Grade</SelectItem>
                  <SelectItem value="6th">6th Grade</SelectItem>
                  <SelectItem value="7th">7th Grade</SelectItem>
                  <SelectItem value="8th">8th Grade</SelectItem>
                  <SelectItem value="9th">9th Grade</SelectItem>
                  <SelectItem value="10th">10th Grade</SelectItem>
                  <SelectItem value="11th">11th Grade</SelectItem>
                  <SelectItem value="12th">12th Grade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAddChild}
              disabled={loading || !firstName.trim() || !lastName.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  Adding...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Child
                </span>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Added Children List */}
        {children.length > 0 && (
          <Card className="mb-6 border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Your Children ({children.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {child.first_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {child.first_name} {child.last_name}
                        </p>
                        {child.grade_level && (
                          <p className="text-sm text-muted-foreground">
                            {child.grade_level}
                          </p>
                        )}
                      </div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continue Button */}
        <Button
          onClick={onComplete}
          disabled={children.length === 0}
          className={`w-full h-12 text-lg font-semibold transition-all ${
            children.length > 0
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          <span className="flex items-center gap-2">
            Continue to Choose Profile
            <ArrowRight className="h-5 w-5" />
          </span>
        </Button>

        {children.length === 0 && (
          <p className="text-center text-muted-foreground text-sm mt-4">
            Add at least one child to continue
          </p>
        )}
      </div>
    </div>
  );
};
