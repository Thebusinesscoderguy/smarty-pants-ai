
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { AutoSystemTest } from "@/components/AutoSystemTest";
import { useState } from "react";

const Index = () => {
  const { user } = useAuth();
  const [showSystemTest, setShowSystemTest] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Learn with AI
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Your personal AI tutor that adapts to your learning style. Get instant help, 
            generate custom quizzes, and track your progress across any subject.
          </p>
          
          {user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/chat">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                  Start Learning
                </Button>
              </Link>
              <Link to="/features">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black px-8 py-3">
                  Explore Features
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black px-8 py-3">
                  View Pricing
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* System Testing Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">System Status</h2>
            <p className="text-gray-300 mb-6">
              Real-time testing of all APIs, workflows, and integrations
            </p>
            <Button 
              onClick={() => setShowSystemTest(!showSystemTest)}
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-black"
            >
              {showSystemTest ? 'Hide System Test' : 'Run System Test'}
            </Button>
          </div>
          
          {showSystemTest && (
            <div className="bg-black/20 backdrop-blur rounded-lg p-6">
              <AutoSystemTest />
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader>
              <CardTitle className="text-white">AI Chat Tutor</CardTitle>
              <CardDescription className="text-gray-300">
                Get instant answers and explanations on any subject
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Our AI understands context and provides personalized learning experiences 
                tailored to your level and learning style.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Smart Quiz Generation</CardTitle>
              <CardDescription className="text-gray-300">
                Custom quizzes generated from your conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Turn any learning session into practice questions. Our AI creates 
                relevant quizzes to test your understanding.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Voice Interaction</CardTitle>
              <CardDescription className="text-gray-300">
                Learn through natural voice conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Practice speaking, get pronunciation help, and have natural 
                conversations with your AI tutor.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        {!user && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to transform your learning?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of students already learning with AI
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                Start Learning Today
              </Button>
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
