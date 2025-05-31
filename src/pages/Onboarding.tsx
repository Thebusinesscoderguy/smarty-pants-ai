
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const Onboarding = () => {
  const [guardianEmail, setGuardianEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setGuardianEmail: saveGuardianEmail, onboardingStatus } = useOnboarding();
  const navigate = useNavigate();

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardianEmail.trim()) return;

    try {
      setIsSubmitting(true);
      await saveGuardianEmail(guardianEmail);
      navigate('/progress');
    } catch (error) {
      console.error('Failed to save guardian email:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate('/progress');
  };

  if (onboardingStatus?.has_provided_guardian_email) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md bg-white/10 border-white/20">
            <CardHeader className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-white">Setup Complete!</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-300 mb-6">
                Your account setup is complete. You can now start using the platform.
              </p>
              <Button onClick={() => navigate('/progress')} className="w-full">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-white/10 border-white/20">
          <CardHeader className="text-center">
            <Mail className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <CardTitle className="text-white">Guardian Contact</CardTitle>
            <p className="text-gray-300">
              Please provide a guardian email address for account verification and updates.
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmitEmail} className="space-y-4">
              <div>
                <Label htmlFor="guardianEmail" className="text-white">
                  Guardian Email Address
                </Label>
                <Input
                  id="guardianEmail"
                  type="email"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  placeholder="guardian@example.com"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !guardianEmail.trim()}
                  className="w-full"
                >
                  {isSubmitting ? 'Saving...' : 'Continue'}
                </Button>
                
                <Button 
                  type="button"
                  variant="ghost"
                  onClick={handleSkip}
                  className="w-full text-gray-300 hover:text-white"
                >
                  Skip for now
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Onboarding;
