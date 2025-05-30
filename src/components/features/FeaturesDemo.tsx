
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Mic, 
  Calculator, 
  Trophy, 
  Target, 
  BookOpen, 
  Settings,
  BarChart3,
  Star,
  Zap,
  Brain,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  category: 'learning' | 'gamification' | 'tools' | 'monitoring';
  status: 'available' | 'premium' | 'coming-soon';
  level: number;
}

const features: Feature[] = [
  {
    id: 'voice-chat',
    title: 'Voice Learning',
    description: 'Interactive voice conversations with AI tutor',
    icon: <Mic className="h-6 w-6" />,
    route: '/voice',
    category: 'learning',
    status: 'available',
    level: 1
  },
  {
    id: 'text-chat',
    title: 'Text Chat',
    description: 'Real-time text conversations with adaptive AI',
    icon: <MessageSquare className="h-6 w-6" />,
    route: '/chat',
    category: 'learning',
    status: 'available',
    level: 1
  },
  {
    id: 'math-solver',
    title: 'Math Solver',
    description: 'Advanced mathematical problem solving with step-by-step solutions',
    icon: <Calculator className="h-6 w-6" />,
    route: '/math',
    category: 'tools',
    status: 'available',
    level: 2
  },
  {
    id: 'achievements',
    title: 'Achievements',
    description: 'Unlock badges and trophies as you learn',
    icon: <Trophy className="h-6 w-6" />,
    route: '/progress',
    category: 'gamification',
    status: 'available',
    level: 1
  },
  {
    id: 'daily-challenges',
    title: 'Daily Challenges',
    description: 'Complete daily learning goals for rewards',
    icon: <Target className="h-6 w-6" />,
    route: '/progress',
    category: 'gamification',
    status: 'available',
    level: 1
  },
  {
    id: 'progress-tracking',
    title: 'Progress Tracking',
    description: 'Monitor your learning journey and improvements',
    icon: <BarChart3 className="h-6 w-6" />,
    route: '/progress',
    category: 'monitoring',
    status: 'available',
    level: 1
  },
  {
    id: 'avatar-system',
    title: '3D Avatar',
    description: 'Immersive 3D avatar for interactive learning',
    icon: <Users className="h-6 w-6" />,
    route: '/avatar',
    category: 'learning',
    status: 'available',
    level: 3
  },
  {
    id: 'study-materials',
    title: 'Study Materials',
    description: 'Upload and analyze your documents with AI',
    icon: <BookOpen className="h-6 w-6" />,
    route: '/chat',
    category: 'tools',
    status: 'premium',
    level: 2
  },
  {
    id: 'adaptive-learning',
    title: 'Adaptive Learning',
    description: 'AI adjusts difficulty based on your performance',
    icon: <Brain className="h-6 w-6" />,
    route: '/progress',
    category: 'learning',
    status: 'available',
    level: 2
  },
  {
    id: 'level-system',
    title: 'Level System',
    description: 'Progress through levels as you master topics',
    icon: <Star className="h-6 w-6" />,
    route: '/progress',
    category: 'gamification',
    status: 'available',
    level: 1
  },
  {
    id: 'quick-boost',
    title: 'Quick Learning Boost',
    description: 'Rapid-fire learning sessions for quick knowledge gains',
    icon: <Zap className="h-6 w-6" />,
    route: '/chat',
    category: 'learning',
    status: 'premium',
    level: 3
  },
  {
    id: 'settings',
    title: 'Gamification Settings',
    description: 'Customize your learning experience preferences',
    icon: <Settings className="h-6 w-6" />,
    route: '/progress',
    category: 'tools',
    status: 'available',
    level: 1
  }
];

export const FeaturesDemo = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const navigate = useNavigate();
  const { user } = useAuth();

  const categories = [
    { id: 'all', name: 'All Features', color: 'bg-gray-500' },
    { id: 'learning', name: 'Learning', color: 'bg-blue-500' },
    { id: 'gamification', name: 'Gamification', color: 'bg-purple-500' },
    { id: 'tools', name: 'Tools', color: 'bg-green-500' },
    { id: 'monitoring', name: 'Monitoring', color: 'bg-orange-500' }
  ];

  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(feature => feature.category === selectedCategory);

  const handleFeatureClick = (feature: Feature) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate(feature.route);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'premium': return 'bg-yellow-500';
      case 'coming-soon': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'learning': return 'border-blue-200 bg-blue-50/50';
      case 'gamification': return 'border-purple-200 bg-purple-50/50';
      case 'tools': return 'border-green-200 bg-green-50/50';
      case 'monitoring': return 'border-orange-200 bg-orange-50/50';
      default: return 'border-gray-200 bg-gray-50/50';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Discover Our <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">Features</span>
        </h2>
        <p className="text-lg text-white/80 max-w-2xl mx-auto mb-6">
          Explore all the powerful features designed to enhance your learning experience with gamification and AI.
        </p>
        
        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={`${
                selectedCategory === category.id 
                  ? `${category.color} text-white` 
                  : 'border-white/30 hover:bg-white/10'
              }`}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFeatures.map((feature) => (
          <Card 
            key={feature.id}
            className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${getCategoryColor(feature.category)} border-2`}
            onClick={() => handleFeatureClick(feature)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-white/20">
                  {feature.icon}
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className={`${getStatusColor(feature.status)} text-white text-xs`}
                  >
                    {feature.status === 'coming-soon' ? 'Soon' : feature.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Lv.{feature.level}
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
              <Button 
                size="sm" 
                className="w-full"
                disabled={feature.status === 'coming-soon'}
              >
                {feature.status === 'coming-soon' ? 'Coming Soon' : 
                 feature.status === 'premium' ? 'Try Premium' : 
                 user ? 'Try Now' : 'Login to Try'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="text-2xl font-bold text-blue-400">{features.length}</div>
          <div className="text-sm text-white/70">Total Features</div>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="text-2xl font-bold text-green-400">
            {features.filter(f => f.status === 'available').length}
          </div>
          <div className="text-sm text-white/70">Available Now</div>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="text-2xl font-bold text-purple-400">
            {features.filter(f => f.category === 'gamification').length}
          </div>
          <div className="text-sm text-white/70">Gamified Features</div>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="text-2xl font-bold text-yellow-400">
            {features.filter(f => f.status === 'premium').length}
          </div>
          <div className="text-sm text-white/70">Premium Features</div>
        </div>
      </div>
    </div>
  );
};
