
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FaPaypal } from 'react-icons/fa';
import { CheckCircle } from 'lucide-react';

const Pricing = () => {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <header className="py-6 text-center">
        <h1 className="text-3xl font-bold">EduAI</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <h2 className="text-3xl font-bold mb-6">Choose Your Plan</h2>
        <p className="text-lg text-white/80 max-w-2xl text-center mb-10">
          Select the plan that best fits your learning needs and experience the future of personalized education.
        </p>
        
        <Card className="w-full max-w-md bg-black border border-white/20 text-white relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold">
            RECOMMENDED
          </div>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">$16/month</CardTitle>
            <CardDescription className="text-white/70">
              Billed at the end of each month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div>
              <p className="text-xl mb-2">Full access to all features</p>
              <p className="text-white/70 mb-4">Start with a 14-day free trial</p>
            </div>
            
            <ul className="space-y-3 text-lg">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Adaptive Learning AI</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Voice Messages</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Unlimited Chats</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>File Uploads & Materials</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Progress Tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                <span>Interactive Presentations</span>
              </li>
            </ul>
            
            <div className="bg-white/5 p-4 rounded-lg">
              <p className="font-medium">No credit card required for trial</p>
              <p className="text-sm text-white/70">Cancel anytime before the trial ends</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-white text-black hover:bg-gray-200 flex items-center justify-center gap-2">
              <FaPaypal />
              Start Your 14-Day Free Trial
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-8 max-w-md text-center">
          <h3 className="text-xl font-semibold mb-2">100% Satisfaction Guarantee</h3>
          <p className="text-white/70 mb-6">
            If you're not completely satisfied with your experience within the first 30 days, contact us for a full refund.
          </p>
          <Link to="/features">
            <Button variant="outline" className="border-white/30 hover:bg-white/10">
              Continue to App
            </Button>
          </Link>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-white/70">
        © 2025 EduAI
      </footer>
    </div>
  );
};

export default Pricing;
