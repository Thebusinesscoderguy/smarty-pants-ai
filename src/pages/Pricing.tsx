
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FaPaypal } from 'react-icons/fa';
import { CheckCircle, Users, User } from 'lucide-react';

const Pricing = () => {
  return <div className="flex flex-col min-h-screen bg-black text-white">
      <header className="py-6 text-center">
        <h1 className="text-3xl font-bold">Teachly</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <h2 className="text-3xl font-bold mb-6">Choose Your Plan</h2>
        <p className="text-lg text-white/80 max-w-2xl text-center mb-10">
          Select the plan that best fits your learning needs and experience the future of personalized education.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Individual Plan */}
          <Card className="w-full bg-black border border-white/20 text-white relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold">
              RECOMMENDED
            </div>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <User className="h-6 w-6" />
                <span className="text-lg font-semibold">Individual</span>
              </div>
              <CardTitle className="text-3xl font-bold">$16/month</CardTitle>
              <CardDescription className="text-white/70">
                Perfect for individual learners
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
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full bg-white text-black hover:bg-gray-200 flex items-center justify-center gap-2">
                <FaPaypal />
                Start Your 14-Day Free Trial
              </Button>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <Link to="/features" className="w-full">Try Features Now</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Business Plan */}
          <Card className="w-full bg-black border border-blue-500/50 text-white relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
              BUSINESS
            </div>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-6 w-6" />
                <span className="text-lg font-semibold">Business</span>
              </div>
              <CardTitle className="text-3xl font-bold">$25/month</CardTitle>
              <CardDescription className="text-white/70">
                + $5 per additional student
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div>
                <p className="text-xl mb-2">Everything in Individual, plus:</p>
                <p className="text-white/70 mb-4">Multi-user management & billing</p>
              </div>
              
              <ul className="space-y-3 text-lg">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <span>All Individual features</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <span>Admin dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <span>Student progress monitoring</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <span>Bulk user management</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <span>Team analytics & reporting</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
              
              <div className="bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Flexible pricing:</h4>
                <ul className="text-left text-sm space-y-2">
                  <li>• Base price: $25/month for admin account</li>
                  <li>• Each additional student: $5/month</li>
                  <li>• Example: 10 students = $25 + (9 × $5) = $70/month</li>
                  <li>• No setup fees or long-term commitments</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2">
                <FaPaypal />
                Start Business Trial
              </Button>
              <Button className="w-full bg-white text-black hover:bg-gray-200">
                <Link to="/features" className="w-full">Contact Sales</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-8 max-w-md text-center">
          <Link to="/features">
            <Button variant="outline" className="border-white/20 hover:bg-white/5">
              Skip to Features Demo
            </Button>
          </Link>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-white/70">
        © 2025 EduAI
      </footer>
    </div>;
};
export default Pricing;
