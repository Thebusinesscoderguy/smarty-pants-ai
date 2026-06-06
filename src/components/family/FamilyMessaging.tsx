import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Star, Target, Users, Shield, Zap, Trophy, BookOpen, Brain } from 'lucide-react';

interface FamilyMessage {
  id: string;
  title: string;
  message: string;
  icon: React.ElementType;
  color: string;
  audience: 'parent' | 'child' | 'both';
  category: 'motivation' | 'guidance' | 'achievement' | 'support';
}

const familyMessages: FamilyMessage[] = [
  {
    id: '1',
    title: 'You\'re Your Child\'s Learning Champion',
    message: 'Every quiz you upload and every study session you support makes a real difference in your child\'s educational journey. You\'re not just a parent—you\'re their learning champion.',
    icon: Heart,
    color: 'from-pink-500/20 to-red-500/20',
    audience: 'parent',
    category: 'motivation'
  },
  {
    id: '2',
    title: 'Turn Mistakes into Learning Gold',
    message: 'Upload any quiz or test where your child struggled. Our AI will create a personalized study plan that transforms those weak areas into strengths.',
    icon: Target,
    color: 'from-blue-500/20 to-purple-500/20',
    audience: 'parent',
    category: 'guidance'
  },
  {
    id: '3',
    title: 'Celebrate Every Small Win',
    message: 'Learning happens one step at a time. Celebrate completed lessons, improved quiz scores, and daily study streaks. Your encouragement fuels their motivation.',
    icon: Star,
    color: 'from-yellow-500/20 to-violet-500/20',
    audience: 'parent',
    category: 'support'
  },
  {
    id: '4',
    title: 'You\'re Making Progress Every Day',
    message: 'Each question you answer and every lesson you complete is building your knowledge. You\'re becoming smarter and stronger every day!',
    icon: Trophy,
    color: 'from-green-500/20 to-emerald-500/20',
    audience: 'child',
    category: 'motivation'
  },
  {
    id: '5',
    title: 'Safe Learning Environment',
    message: 'Your child\'s safety and privacy are our top priority. All AI interactions are monitored, and your family data is completely secure and private.',
    icon: Shield,
    color: 'from-purple-500/20 to-indigo-500/20',
    audience: 'parent',
    category: 'support'
  },
  {
    id: '6',
    title: 'AI That Adapts to Your Family',
    message: 'Our AI learns how each of your children learns best, adapting difficulty, pacing, and teaching style to match their unique needs and personality.',
    icon: Brain,
    color: 'from-cyan-500/20 to-blue-500/20',
    audience: 'parent',
    category: 'guidance'
  },
  {
    id: '7',
    title: 'Learning is an Adventure',
    message: 'Every topic you explore and every challenge you overcome makes you a learning explorer. What new discovery will you make today?',
    icon: BookOpen,
    color: 'from-teal-500/20 to-green-500/20',
    audience: 'child',
    category: 'motivation'
  },
  {
    id: '8',
    title: 'You\'re Building Their Future',
    message: 'Every moment you invest in your child\'s learning is an investment in their future success, confidence, and love of knowledge.',
    icon: Zap,
    color: 'from-violet-500/20 to-red-500/20',
    audience: 'parent',
    category: 'motivation'
  }
];

interface FamilyMessagingProps {
  audience?: 'parent' | 'child' | 'both';
  category?: 'motivation' | 'guidance' | 'achievement' | 'support';
  limit?: number;
}

export const FamilyMessaging: React.FC<FamilyMessagingProps> = ({ 
  audience = 'both', 
  category,
  limit 
}) => {
  let filteredMessages = familyMessages;

  if (audience !== 'both') {
    filteredMessages = filteredMessages.filter(msg => msg.audience === audience || msg.audience === 'both');
  }

  if (category) {
    filteredMessages = filteredMessages.filter(msg => msg.category === category);
  }

  if (limit) {
    filteredMessages = filteredMessages.slice(0, limit);
  }

  return (
    <div className="space-y-4">
      {filteredMessages.map((message) => {
        const IconComponent = message.icon;
        return (
          <Card 
            key={message.id} 
            className={`bg-gradient-to-br ${message.color} border-white/20 backdrop-blur-sm hover:scale-105 transition-all duration-300`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/10 rounded-xl">
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white">{message.title}</h3>
                    <Badge 
                      className={`text-xs ${
                        message.audience === 'parent' 
                          ? 'bg-blue-500/20 text-blue-300'
                          : message.audience === 'child'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-purple-500/20 text-purple-300'
                      }`}
                    >
                      {message.audience === 'parent' ? 'For Parents' : 
                       message.audience === 'child' ? 'For Kids' : 'For Families'}
                    </Badge>
                  </div>
                  <p className="text-white/90 leading-relaxed">{message.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Specialized components for different contexts
export const ParentMotivationMessages = () => (
  <FamilyMessaging audience="parent" category="motivation" limit={3} />
);

export const ParentGuidanceMessages = () => (
  <FamilyMessaging audience="parent" category="guidance" limit={3} />
);

export const ChildMotivationMessages = () => (
  <FamilyMessaging audience="child" category="motivation" limit={2} />
);

export const FamilySupportMessages = () => (
  <FamilyMessaging category="support" limit={2} />
);

// Hero messaging component for landing page
export const HeroMessaging = () => (
  <div className="text-center space-y-6">
    <div className="space-y-4">
      <h2 className="text-3xl font-bold text-white">
        Empower Your Child's Learning Journey
      </h2>
      <p className="text-xl text-white/80 max-w-3xl mx-auto">
        Join thousands of parents who are transforming their children's education with AI-powered personalized learning.
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      <div className="p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
        <Target className="h-12 w-12 text-blue-400 mx-auto mb-4" />
        <h3 className="font-semibold text-white mb-2">Upload & Transform</h3>
        <p className="text-white/80 text-sm">
          Turn quiz mistakes into personalized study plans that target exact learning gaps
        </p>
      </div>
      
      <div className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
        <Users className="h-12 w-12 text-green-400 mx-auto mb-4" />
        <h3 className="font-semibold text-white mb-2">Family-Focused</h3>
        <p className="text-white/80 text-sm">
          Designed specifically for parents supporting their children's learning at home
        </p>
      </div>
      
      <div className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
        <Star className="h-12 w-12 text-purple-400 mx-auto mb-4" />
        <h3 className="font-semibold text-white mb-2">Celebrate Success</h3>
        <p className="text-white/80 text-sm">
          Track progress and celebrate every achievement in your child's learning journey
        </p>
      </div>
    </div>
  </div>
);