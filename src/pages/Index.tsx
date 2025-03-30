
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Book, BookOpen, CheckCircle, Terminal, Medal, FileText } from 'lucide-react';
import LoginModal from '@/components/LoginModal';
import SignupModal from '@/components/SignupModal';

const Index = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("what-is-teachly");

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header/Navigation */}
      <header className="py-6 px-8 flex justify-between items-center border-b border-white/10 backdrop-blur-sm bg-black/50 fixed w-full z-10">
        <h1 className="text-3xl font-bold">Teachly</h1>
        <div className="flex gap-4">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/10"
            onClick={() => setIsLoginOpen(true)}
          >
            Log In
          </Button>
          <Button 
            className="bg-white text-black hover:bg-gray-200"
            onClick={() => setIsSignupOpen(true)}
          >
            Sign Up
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="h-screen w-full flex items-center justify-center relative pt-20">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-purple-900/20 to-black"></div>
        <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10 px-8">
          <div className="flex flex-col space-y-6">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              AI-Powered Learning Tailored to You
            </h2>
            <p className="text-xl text-white/80">
              Teachly adapts to your learning pace and style, providing personalized education for students of all ages.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/features" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-white text-black hover:bg-gray-200 text-lg h-12 px-8">
                  Try Now
                </Button>
              </Link>
              <Link to="/pricing" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 text-lg h-12 px-8">
                  View Plans
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8">
            <h3 className="text-2xl font-bold mb-6">Frequently Asked Questions</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-white/20">
                <AccordionTrigger className="text-left">What makes Teachly different?</AccordionTrigger>
                <AccordionContent>
                  Teachly uses adaptive learning technology to adjust to your pace, providing personalized educational support tailored to your specific learning style.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-white/20">
                <AccordionTrigger className="text-left">How much does it cost?</AccordionTrigger>
                <AccordionContent>
                  We offer a Free Trial and a Student Plan. The Student Plan is $16/month with a 7-day free trial available.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-white/20">
                <AccordionTrigger className="text-left">Who is this for?</AccordionTrigger>
                <AccordionContent>
                  Students of all ages, from elementary school to university, as well as lifelong learners who want to enhance their understanding of various subjects.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4" className="border-white/20">
                <AccordionTrigger className="text-left">Can I try before subscribing?</AccordionTrigger>
                <AccordionContent>
                  Yes, you can try our core features without signing up, or start a 7-day free trial for full access to all premium features.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-8 w-8 text-white/50" />
        </div>
      </section>

      {/* Tabbed Content Section */}
      <section className="py-20 px-8 bg-gradient-to-b from-black to-purple-950/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Discover Teachly</h2>
          
          <Tabs 
            defaultValue="what-is-teachly" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 mb-8 bg-white/5 border border-white/10 rounded-lg p-1">
              <TabsTrigger 
                value="what-is-teachly" 
                className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70"
              >
                What is Teachly?
              </TabsTrigger>
              <TabsTrigger 
                value="features" 
                className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70"
              >
                Features
              </TabsTrigger>
              <TabsTrigger 
                value="how-it-works" 
                className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70"
              >
                How It Works
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="what-is-teachly" className="space-y-6 animate-in fade-in-50">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8">
                <h3 className="text-2xl font-bold mb-4">What is Teachly?</h3>
                <p className="text-lg mb-6">
                  Teachly is an AI-powered learning platform with adaptive quizzes, interactive presentations, and personalized learning experiences designed to maximize your educational journey.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Book className="h-5 w-5" />
                        Personalized Learning
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>The platform adapts to each learner's strengths and weaknesses, offering personalized quizzes and dynamic presentations.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Customizable Experience
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Adaptive quizzes and presentations adjust based on your progress and performance to give you the most relevant content.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="features" className="space-y-6 animate-in fade-in-50">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8">
                <h3 className="text-2xl font-bold mb-4">Powerful Features</h3>
                <p className="text-lg mb-6">
                  Teachly comes packed with innovative features designed to enhance your learning experience.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Adaptive Quizzes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Continuously assess your understanding and identify areas for improvement with quizzes that adapt to your skill level.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Interactive Presentations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Visualize complex concepts with dynamically generated presentations tailored to your learning style.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Terminal className="h-5 w-5" />
                        AI-Powered Answers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Get instant, accurate answers to your questions with our advanced AI that understands the context of your queries.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="how-it-works" className="space-y-6 animate-in fade-in-50">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8">
                <h3 className="text-2xl font-bold mb-4">How Teachly Works</h3>
                <p className="text-lg mb-6">
                  Our streamlined process makes learning efficient and enjoyable.
                </p>
                
                <div className="flex flex-col space-y-6 mt-8">
                  <div className="flex items-start gap-4">
                    <div className="bg-white/10 rounded-full p-3 h-12 w-12 flex items-center justify-center shrink-0">
                      <span className="font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold">Upload Your Curriculum</h4>
                      <p className="text-white/80">Easily import your textbooks, notes, or other learning materials into our platform.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-white/10 rounded-full p-3 h-12 w-12 flex items-center justify-center shrink-0">
                      <span className="font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold">Ask Questions</h4>
                      <p className="text-white/80">Type in your questions, no matter how complex or simple, and get instant answers.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-white/10 rounded-full p-3 h-12 w-12 flex items-center justify-center shrink-0">
                      <span className="font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold">Take Personalized Quizzes</h4>
                      <p className="text-white/80">Assess your understanding and identify areas for improvement with adaptive quizzes.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-white/10 rounded-full p-3 h-12 w-12 flex items-center justify-center shrink-0">
                      <span className="font-bold">4</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold">Track Your Progress</h4>
                      <p className="text-white/80">Monitor your learning journey and celebrate your achievements with detailed progress tracking.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-white/10 rounded-full p-3 h-12 w-12 flex items-center justify-center shrink-0">
                      <span className="font-bold">5</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold">Access Personalized Presentations</h4>
                      <p className="text-white/80">Receive tailored presentations to visualize complex concepts and enhance understanding.</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-20 px-8 bg-black">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Choose Your Plan</h2>
          <p className="text-center text-white/80 mb-12 max-w-2xl mx-auto">
            Select the plan that best fits your learning needs and take your education to the next level.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <Card className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
              <CardHeader>
                <CardTitle>Free Trial</CardTitle>
                <CardDescription className="text-white/70">
                  Try out the platform for a limited time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-6">$0</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>Basic question answering</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>Limited adaptive quizzes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>Platform exploration</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-white text-black hover:bg-gray-200">
                  Start Free Trial
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="bg-white/5 border-white/10 border-2 text-white relative hover:bg-white/10 transition-colors">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-white text-black px-4 py-1 rounded-full text-sm font-bold">
                RECOMMENDED
              </div>
              <CardHeader>
                <CardTitle>Student Plan</CardTitle>
                <CardDescription className="text-white/70">
                  Full access for individual learners
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-6">$16<span className="text-lg font-normal">/month</span></p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>Unlimited question answering</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>Fully adaptive quizzes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>Interactive presentations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>Detailed progress tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-white text-black hover:bg-gray-200">
                  Get Started
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-8 bg-gradient-to-t from-black to-purple-950/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Learning Experience?</h2>
          <p className="text-xl text-white/80 mb-8">
            Join thousands of students who are already experiencing the future of education with Teachly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-6 h-auto"
              onClick={() => setIsSignupOpen(true)}
            >
              Start Your Journey
            </Button>
            <Link to="/features">
              <Button 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6 h-auto"
              >
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-white/10 bg-black">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-xl font-bold mb-4">Teachly</h3>
              <p className="text-white/60">
                Revolutionizing education through AI-powered personalized learning experiences.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-white/60">
                <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Testimonials</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Case Studies</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Partners</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/60">© 2024 Teachly • All rights reserved</p>
            <div className="flex gap-6 text-white/60">
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <SignupModal isOpen={isSignupOpen} onClose={() => setIsSignupOpen(false)} />
    </div>
  );
};

export default Index;
