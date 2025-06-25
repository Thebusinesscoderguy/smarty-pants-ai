
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, Clock, Users, Star, Play, Search, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { curricula } from '@/utils/curriculaData';

const Modules = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedModule, setSelectedModule] = useState<any>(null);

  const categories = [
    { id: 'all', name: t('modules.categories.all'), count: curricula.length },
    { id: 'math', name: t('modules.categories.math'), count: curricula.filter(c => c.subjects.some(s => s.toLowerCase().includes('math'))).length },
    { id: 'science', name: t('modules.categories.science'), count: curricula.filter(c => c.subjects.some(s => s.toLowerCase().includes('science'))).length },
    { id: 'english', name: t('modules.categories.english'), count: curricula.filter(c => c.subjects.some(s => s.toLowerCase().includes('english'))).length },
    { id: 'history', name: t('modules.categories.history'), count: curricula.filter(c => c.subjects.some(s => s.toLowerCase().includes('history'))).length },
  ];

  const filteredModules = curricula.filter(curriculum => {
    const matchesSearch = curriculum.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         curriculum.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           curriculum.subjects.some(s => s.toLowerCase().includes(selectedCategory));
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (gradeLevel: string) => {
    if (gradeLevel.includes('K-') || gradeLevel.includes('F-') || gradeLevel.includes('Ages 5-11')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    if (gradeLevel.includes('6-') || gradeLevel.includes('Ages 14-16')) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const startModule = (module: any) => {
    setSelectedModule(module);
    // Navigate to chat with the selected curriculum context
    navigate('/chat', { state: { selectedCurriculum: module } });
  };

  if (selectedModule) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <Button
              onClick={() => setSelectedModule(null)}
              variant="outline"
              className="mb-6 border-white/20 bg-white/5 hover:bg-white/10 text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Button>
            
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-2xl text-white">{selectedModule.title}</CardTitle>
                <p className="text-white/70">{selectedModule.description}</p>
                <div className="flex gap-2 mt-4">
                  <Badge className={getDifficultyColor(selectedModule.gradeLevel)}>
                    {selectedModule.gradeLevel}
                  </Badge>
                  <Badge variant="outline" className="border-white/20 text-white">
                    {selectedModule.country}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{t('modules.subjects')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedModule.subjects.map((subject: string) => (
                        <Badge key={subject} variant="outline" className="border-white/20 text-white/70">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{t('modules.standards')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedModule.standards.map((standard: string) => (
                        <Badge key={standard} variant="outline" className="border-blue-500/30 text-blue-300">
                          {standard}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={() => startModule(selectedModule)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 mt-6"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {t('modules.startLearning')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      
      <main className="flex-1 p-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('modules.title')}</h1>
            <p className="text-gray-400">{t('modules.description')}</p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('modules.searchPlaceholder')}
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

          {/* Modules Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => (
              <Card key={module.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-lg mb-2">{module.title}</CardTitle>
                      <p className="text-gray-400 text-sm">{module.system}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={getDifficultyColor(module.gradeLevel)}>
                      {module.gradeLevel}
                    </Badge>
                    <Badge variant="outline" className="border-white/20 text-white">
                      {module.country}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-white/70 mb-4 text-sm">{module.description}</p>
                  
                  <div className="mb-4">
                    <p className="text-white/80 text-sm mb-2">{t('modules.subjects')}:</p>
                    <div className="flex flex-wrap gap-1">
                      {module.subjects.slice(0, 3).map((subject: string) => (
                        <Badge key={subject} variant="outline" className="text-xs border-white/20 text-white/70">
                          {subject}
                        </Badge>
                      ))}
                      {module.subjects.length > 3 && (
                        <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                          +{module.subjects.length - 3} {t('common.more')}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={() => startModule(module)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {t('modules.startLearning')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredModules.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">{t('modules.noModulesFound')}</h3>
              <p className="text-gray-400">{t('modules.adjustFilters')}</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Modules;
