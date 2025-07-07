
import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const PublicPricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = (planType: string) => {
    if (user) {
      navigate('/progress');
    } else {
      navigate('/auth?signup=true');
    }
  };

  const plans = [
    {
      name: 'Family Plan',
      price: '$19.99',
      period: 'per month',
      description: 'Perfect for individual families and homeschooling',
      features: [
        'Up to 3 children',
        'Full AI chat tutoring',
        'Progress tracking',
        'Personalized curricula',
        'Voice interaction',
        'Quiz generation',
        'Parent monitoring dashboard',
        'Email support'
      ],
      buttonText: 'Start Family Plan',
      popular: false
    },
    {
      name: 'School Plan',
      price: '$149.99',
      period: 'per month',
      description: 'Comprehensive solution for schools and educational institutions',
      features: [
        'Up to 50 students',
        'Full AI chat tutoring',
        'Advanced analytics',
        'Teacher dashboard',
        'Student progress monitoring',
        'Custom curricula creation',
        'Bulk student management',
        'Priority support',
        'Integration support',
        'Training sessions'
      ],
      buttonText: 'Start School Plan',
      popular: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <Header />
      
      <main className="px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Unlock the power of AI-driven education for your family or institution
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative bg-white/10 border-white/20 backdrop-blur-sm ${
                plan.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                <CardDescription className="text-white/70">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/70 ml-2">{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-white/90">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={() => handleGetStarted(plan.name)}
                  className={`w-full py-3 font-semibold ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' 
                      : 'bg-white/10 hover:bg-white/20 border border-white/20'
                  }`}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-white/60 mb-4">
            Need a custom solution? Contact us for enterprise pricing.
          </p>
          <Button 
            variant="outline" 
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            Contact Sales
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PublicPricing;
