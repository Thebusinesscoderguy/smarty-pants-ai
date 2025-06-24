
import { useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Users, Star, Play, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Modules = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Modules', count: 12 },
    { id: 'math', name: 'Mathematics', count: 4 },
    { id: 'science', name: 'Science', count: 3 },
    { id: 'english', name: 'English', count: 2 },
    { id: 'history', name: 'History', count: 2 },
    { id: 'programming', name: 'Programming', count: 1 }
  ];

  // This will be replaced with real curricula later
  const popularModules = [
    {
      id: '1',
      title: 'Complete Mathematics Foundation',
      description: 'Comprehensive math curriculum covering algebra, geometry, and calculus with interactive problem-solving.',
      category: 'math',
      difficulty: 'Intermediate',
      duration: '120 hours',
      students: 12450,
      rating: 4.8,
      lessons: 30,
      completedLessons: 0,
      topics: ['Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics'],
      instructor: 'Dr. Sarah Chen',
      thumbnail: '🧮'
    },
    {
      id: '2',
      title: 'Interactive Science Explorer',
      description: 'Hands-on science curriculum with virtual labs covering physics, chemistry, and biology.',
      category: 'science',
      difficulty: 'Beginner',
      duration: '90 hours',
      students: 8920,
      rating: 4.6,
      lessons: 28,
      completedLessons: 0,
      topics: ['Physics', 'Chemistry', 'Biology', 'Earth Science', 'Environmental Science'],
      instructor: 'Prof. Michael Rodriguez',
      thumbnail: '🔬'
    },
    {
      id: '3',
      title: 'World Literature & Writing',
      description: 'Explore global literature while developing advanced writing and critical thinking skills.',
      category: 'english',
      difficulty: 'Advanced',
      duration: '80 hours',
      students: 6780,
      rating: 4.9,
      lessons: 25,
      completedLessons: 0,
      topics: ['Literary Analysis', 'Creative Writing', 'Essay Writing', 'Poetry', 'World Literature'],
      instructor: 'Dr. Emma Johnson',
      thumbnail: '📚'
    },
    {
      id: '4',
      title: 'Programming Fundamentals',
      description: 'Learn programming from scratch with Python, JavaScript, and web development basics.',
      category: 'programming',
      difficulty: 'Beginner',
      duration: '100 hours',
      students: 15200,
      rating: 4.7,
      lessons: 35,
      completedLessons: 0,
      topics: ['Python', 'JavaScript', 'HTML/CSS', 'Web Development', 'Problem Solving'],
      instructor: 'Alex Thompson',
      thumbnail: '💻'
    }
  ];

  const filteredModules = popularModules.filter(module => {
    const matchesSearch = module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      <AppSidebar />
      
      <div className="flex-1 overflow-hidden">
        <header className="p-6 border-b border-white/20">
          <h1 className="text-3xl font-bold mb-2">Learning Modules</h1>
          <p className="text-gray-400">
            Explore our curated collection of learning modules and curricula designed by education experts
          </p>
        </header>
        
        <main className="p-6">
          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/20 text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id 
                    ? "bg-blue-600 hover:bg-blue-700" 
                    : "border-white/20 bg-white/5 text-white hover:bg-white/10"
                  }
                >
                  {category.name} ({category.count})
                </Button>
              ))}
            </div>
          </div>

          {/* Popular Modules Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => (
              <Card key={module.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{module.thumbnail}</div>
                      <div>
                        <CardTitle className="text-white text-lg">{module.title}</CardTitle>
                        <p className="text-gray-400 text-sm">by {module.instructor}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-yellow-400">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm text-white">{module.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={getDifficultyColor(module.difficulty)}>
                      {module.difficulty}
                    </Badge>
                    <Badge variant="outline" className="border-white/20 text-white">
                      {module.category}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-white/70 mb-4 text-sm">{module.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{module.lessons} lessons</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{module.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{module.students.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-white/80 text-sm mb-2">Topics covered:</p>
                    <div className="flex flex-wrap gap-1">
                      {module.topics.slice(0, 3).map((topic) => (
                        <Badge key={topic} variant="outline" className="text-xs border-white/20 text-white/70">
                          {topic}
                        </Badge>
                      ))}
                      {module.topics.length > 3 && (
                        <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                          +{module.topics.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Play className="h-4 w-4 mr-2" />
                    Start Learning
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredModules.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No modules found</h3>
              <p className="text-gray-400">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Modules;
