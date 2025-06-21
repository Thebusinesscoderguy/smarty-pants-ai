import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Users, User, ArrowRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const PublicPricing = () => {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Choose Your Plan</h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto">
              Select the plan that best fits your learning needs and experience the future of personalized education.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
            {/* Individual Plan */}
            <Card className="w-full bg-black border border-white/20 text-white relative hover:border-purple-500/50 transition-all duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                RECOMMENDED
              </div>
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <User className="h-6 w-6" />
                  <span className="text-lg font-semibold">Individual</span>
                </div>
                <CardTitle className="text-4xl font-bold">$16/month</CardTitle>
                <CardDescription className="text-white/70">
                  Perfect for individual learners
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-center">
                <div>
                  <p className="text-xl mb-2">Full access to all features</p>
                  <p className="text-white/70 mb-4">Start learning immediately</p>
                </div>
                
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span>Adaptive Learning AI</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span>Voice Messages & Interactions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span>Unlimited Chat Sessions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span>File Uploads & Study Materials</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span>Progress Tracking & Analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span>Interactive Quizzes & Tests</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span>Achievement System</span>
                  </li>
                </ul>
                
                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="font-medium">What you get:</p>
                  <p className="text-sm text-white/70">Personal AI tutor available 24/7</p>
                  <p className="text-sm text-white/70">Free trial available - no credit card required</p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button 
                  className="w-full bg-white text-black hover:bg-gray-200" 
                  size="lg"
                  asChild
                >
                  <Link to="/auth?signup=true" className="flex items-center justify-center gap-2">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-xs text-white/60 text-center">
                  Sign up to start your free trial
                </p>
              </CardFooter>
            </Card>

            {/* Business Plan */}
            <Card className="w-full bg-black border border-blue-500/50 text-white relative hover:border-blue-400/70 transition-all duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                BUSINESS
              </div>
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-6 w-6" />
                  <span className="text-lg font-semibold">Business</span>
                </div>
                <CardTitle className="text-4xl font-bold">$25/month</CardTitle>
                <CardDescription className="text-white/70">
                  + $5 per additional student
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-center">
                <div>
                  <p className="text-xl mb-2">Everything in Individual, plus:</p>
                  <p className="text-white/70 mb-4">Multi-user management & advanced analytics</p>
                </div>
                
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <span>All Individual features included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <span>Admin dashboard & controls</span>
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
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <span>Custom integrations available</span>
                  </li>
                </ul>
                
                <div className="bg-blue-900/20 p-4 rounded-lg text-left">
                  <h4 className="font-semibold mb-2">Flexible pricing example:</h4>
                  <ul className="text-sm space-y-1 text-blue-200">
                    <li>• Admin account: $25/month</li>
                    <li>• 5 students: $25 + (4 × $5) = $45/month</li>
                    <li>• 10 students: $25 + (9 × $5) = $70/month</li>
                    <li>• Scale as you grow, pay only for what you use</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700" 
                  size="lg"
                  asChild
                >
                  <Link to="/auth?signup=true" className="flex items-center justify-center gap-2">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-xs text-white/60 text-center">
                  Contact us for enterprise solutions
                </p>
              </CardFooter>
            </Card>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2 text-white">Is there a free trial?</h3>
                  <p className="text-white/70 text-sm">
                    Yes! Start your free trial today with full access to all features. No credit card required to begin.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2 text-white">Can I cancel anytime?</h3>
                  <p className="text-white/70 text-sm">
                    Absolutely. Cancel your subscription at any time from your dashboard with no penalties.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2 text-white">What subjects are supported?</h3>
                  <p className="text-white/70 text-sm">
                    Our AI tutor supports all major subjects including Math, Science, Languages, History, and more.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2 text-white">Is my data secure?</h3>
                  <p className="text-white/70 text-sm">
                    Yes, we use enterprise-grade security and never share your personal learning data with third parties.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Demo Section */}
          <div className="text-center mt-16 mb-12 p-8 bg-gradient-to-r from-blue-900/60 to-purple-900/60 rounded-2xl border border-white/10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Try a Live Demo</h2>
            <p className="text-white/80 mb-5">
              Experience Teachly AI's AI-powered learning features right now. No signup required—test our chat, analytics, and more in a secure sandbox!
            </p>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              size="lg"
              asChild
            >
              <Link to="/system-test" className="flex items-center gap-2 justify-center">
                Try Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <div className="text-xs mt-3 text-white/60">
              The demo is limited for security and data privacy.
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center mt-8 p-8 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl border border-white/10">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
            <p className="text-white/80 mb-6">
              Join thousands of students already learning faster with AI-powered education.
            </p>
            <Button className="bg-white text-black hover:bg-gray-200" size="lg" asChild>
              <Link to="/auth?signup=true">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PublicPricing;
