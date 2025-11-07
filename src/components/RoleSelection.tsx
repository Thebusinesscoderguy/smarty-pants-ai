
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { School, Users, ArrowRight, Play } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface RoleSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'signup' | 'demo';
  onRoleSelect?: (selectedRole: string) => void;
}

export const RoleSelection = ({ isOpen, onClose, mode = 'signup', onRoleSelect }: RoleSelectionProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'school' | 'parent' | null>(null);

  // Only show role selection for demo users or during signup (when no user is logged in)
  const shouldShowRoleSelection = mode === 'demo' || (!user && mode === 'signup');

  if (!shouldShowRoleSelection) {
    return null;
  }

  const handleRoleSelection = (role: 'school' | 'parent') => {
    setSelectedRole(role);
    
    if (onRoleSelect) {
      // If onRoleSelect callback is provided, use it (for demo mode)
      onRoleSelect(role);
    } else if (mode === 'demo') {
      // Navigate to demo with role parameter
      navigate(`/demo?role=${role}`);
    } else {
      // Navigate to auth page with role parameter (only for non-authenticated users)
      navigate(`/auth?role=${role}&signup=true`);
    }
    onClose();
  };

  const title = mode === 'demo' ? 'Choose Demo Experience' : 'Choose Your Role';
  const description = mode === 'demo' 
    ? 'Select which perspective you\'d like to explore in our interactive demo'
    : 'Select how you\'ll be using TeachlyAI to get started with the right features';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Card 
            className="bg-primary/10 border-primary/30 hover:bg-primary/20 transition-all cursor-pointer group backdrop-blur-sm"
            onClick={() => handleRoleSelection('school')}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-primary/20 rounded-full w-fit group-hover:bg-primary/30 transition-colors">
                <School className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-foreground">School / Institution</CardTitle>
              <CardDescription className="text-muted-foreground">
                {mode === 'demo' ? 'See the admin dashboard and teacher tools' : 'For teachers, administrators, and educational institutions'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li>• Manage multiple students</li>
                <li>• Create custom curricula</li>
                <li>• Advanced analytics & reporting</li>
                <li>• School-wide administration</li>
              </ul>
              <Button 
                className="w-full bg-primary hover:bg-primary/90 border-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoleSelection('school');
                }}
              >
                {mode === 'demo' ? (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Try School Demo
                  </>
                ) : (
                  <>
                    Get Started as School
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="bg-primary/10 border-primary/30 hover:bg-primary/20 transition-all cursor-pointer group backdrop-blur-sm"
            onClick={() => handleRoleSelection('parent')}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-primary/20 rounded-full w-fit group-hover:bg-primary/30 transition-colors">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-foreground">Parent / Student</CardTitle>
              <CardDescription className="text-muted-foreground">
                {mode === 'demo' ? 'Experience the student learning journey' : 'For parents and individual students'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li>• Personal learning journey</li>
                <li>• Progress tracking</li>
                <li>• Gamified learning experience</li>
                <li>• Parent monitoring dashboard</li>
              </ul>
              <Button 
                className="w-full bg-primary hover:bg-primary/90 border-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoleSelection('parent');
                }}
              >
                {mode === 'demo' ? (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Try Student Demo
                  </>
                ) : (
                  <>
                    Get Started as Parent
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
