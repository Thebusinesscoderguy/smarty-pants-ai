
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { School, Users, ArrowRight } from 'lucide-react';

interface RoleSelectionProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSelection = ({ isOpen, onClose }: RoleSelectionProps) => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'school' | 'parent' | null>(null);

  const handleRoleSelection = (role: 'school' | 'parent') => {
    setSelectedRole(role);
    // Navigate to auth page with role parameter
    navigate(`/auth?role=${role}&signup=true`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border border-white/20 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Choose Your Role
          </DialogTitle>
          <DialogDescription className="text-center text-white/70">
            Select how you'll be using TeachlyAI to get started with the right features
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card 
            className="bg-white/5 border-white/20 hover:bg-white/10 transition-all cursor-pointer group"
            onClick={() => handleRoleSelection('school')}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-blue-500/20 rounded-full w-fit group-hover:bg-blue-500/30 transition-colors">
                <School className="h-8 w-8 text-blue-400" />
              </div>
              <CardTitle className="text-white">School / Institution</CardTitle>
              <CardDescription className="text-white/70">
                For teachers, administrators, and educational institutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/60 mb-4">
                <li>• Manage multiple students</li>
                <li>• Create custom curricula</li>
                <li>• Advanced analytics & reporting</li>
                <li>• School-wide administration</li>
              </ul>
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoleSelection('school');
                }}
              >
                Get Started as School
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="bg-white/5 border-white/20 hover:bg-white/10 transition-all cursor-pointer group"
            onClick={() => handleRoleSelection('parent')}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-purple-500/20 rounded-full w-fit group-hover:bg-purple-500/30 transition-colors">
                <Users className="h-8 w-8 text-purple-400" />
              </div>
              <CardTitle className="text-white">Parent / Student</CardTitle>
              <CardDescription className="text-white/70">
                For parents and individual students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/60 mb-4">
                <li>• Personal learning journey</li>
                <li>• Progress tracking</li>
                <li>• Gamified learning experience</li>
                <li>• Parent monitoring dashboard</li>
              </ul>
              <Button 
                className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoleSelection('parent');
                }}
              >
                Get Started as Parent
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
