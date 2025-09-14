import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Baby } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface RoleSelectorProps {
  onRoleSelected: (role: 'parent' | 'child') => void;
}

export const RoleSelector = ({ onRoleSelected }: RoleSelectorProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleRoleSelection = async (role: 'parent' | 'child') => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update the profile with the selected role
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          role: role === 'parent' ? 'parent' : 'student',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      onRoleSelected(role);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Welcome! Who is using TeachlyAI?
          </h1>
          <p className="text-white/70">
            This helps us personalize your experience
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card 
            className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30 hover:from-blue-500/20 hover:to-indigo-500/20 transition-all cursor-pointer group backdrop-blur-sm"
            onClick={() => handleRoleSelection('parent')}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full w-fit group-hover:from-blue-500/30 group-hover:to-indigo-500/30 transition-colors">
                <Users className="h-8 w-8 text-blue-400" />
              </div>
              <CardTitle className="text-white">I'm a Parent</CardTitle>
              <CardDescription className="text-white/70">
                Monitoring and supporting my child's learning
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
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0"
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

          <Card 
            className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30 hover:from-blue-500/20 hover:to-cyan-500/20 transition-all cursor-pointer group backdrop-blur-sm"
            onClick={() => handleRoleSelection('child')}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full w-fit group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-colors">
                <Baby className="h-8 w-8 text-blue-400" />
              </div>
              <CardTitle className="text-white">I'm a Student</CardTitle>
              <CardDescription className="text-white/70">
                Ready to learn and have fun with AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/60 mb-4">
                <li>• Interactive AI chat</li>
                <li>• Fun learning games</li>
                <li>• Earn achievements</li>
                <li>• Complete quests</li>
              </ul>
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoleSelection('child');
                }}
                disabled={loading}
              >
                Continue as Student
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};