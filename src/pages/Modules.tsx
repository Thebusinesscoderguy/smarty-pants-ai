
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, Play, Search, ArrowLeft, MessageSquare, BarChart3 } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState<'chat' | 'progress' | 'modules'>('modules');

  const categories = [
    { id: 'all', name: t('modules.categories.all') || 'All Subjects', count: curricula.length },
    { id: 'math', name: t('modules.categories.math') || 'Mathematics', count: curricula.filter(c => c.subjects.some(s => s.toLowerCase().includes('math'))).length },
    { id: 'science', name: t('modules.categories.science') || 'Science', count: curricula.filter(c => c.subjects.some(s => s.toLowerCase().includes('science'))).length },
    { id: 'english', name: t('modules.categories.english') || 'English', count: curricula.filter(c => c.subjects.some(s => s.toLowerCase().includes('english'))).length },
    { id: 'history', name: t('modules.categories.history') || 'History', count: curricula.filter(c => c.subjects.some(s => s.toLowerCase().includes('history'))).length },
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
    localStorage.setItem('selectedCurriculum', JSON.stringify(module));
    navigate(`/learn/${module.id}`);
  };

  const renderNavigation = () => (
    <div className="flex items-center space-x-1 bg-white/10 rounded-lg p-1 backdrop-blur-sm">
      <Button
        variant={currentPage === 'chat' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => {
          setCurrentPage('chat');
          navigate('/chat');
        }}
        className={currentPage === 'chat' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-white hover:bg-white/20'}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        {t('nav.chat') || 'Chat'}
      </Button>
      <Button
        variant={currentPage === 'progress' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => {
          setCurrentPage('progress');
          navigate('/progress');
        }}
        className={currentPage === 'progress' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-white hover:bg-white/20'}
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        {t('nav.progress') || 'Progress'}
      </Button>
      <Button
        variant={currentPage === 'modules' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setCurrentPage('modules')}
        className={currentPage === 'modules' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-white hover:bg-white/20'}
      >
        <BookOpen className="h-4 w-4 mr-2" />
        {t('nav.modules') || 'Modules'}
      </Button>
    </div>
  );

  if (selectedModule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex flex-col">
        <Header />
        
        <div className="flex-shrink-0 p-4 border-b border-white/20 bg-gray-800/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {renderNavigation()}
            </div>
          </div>
        </div>
        
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <Button
              onClick={() => setSelectedModule(null)}
              variant="outline"
              className="mb-6 border-white/30 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back') || 'Back'}
            </Button>
            
            <Card className="bg-white/10 border-white/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-white">{selectedModule.title}</CardTitle>
                <p className="text-white/80">{selectedModule.description}</p>
                <div className="flex gap-2 mt-4">
                  <Badge className={getDifficultyColor(selectedModule.gradeLevel)}>
                    {selectedModule.gradeLevel}
                  </Badge>
                  <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                    {selectedModule.country}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">{t('modules.subjects') || 'Subjects'}</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedModule.subjects.map((subject: string) => (
                        <Badge key={subject} variant="outline" className="border-white/30 text-white/90 bg-white/5">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">{t('modules.standards') || 'Standards'}</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedModule.standards.map((standard: string) => (
                        <Badge key={standard} variant="outline" className="border-blue-500/40 text-blue-300 bg-blue-500/10">
                          {standard}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={() => startModule(selectedModule)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 mt-6 h-12 text-lg font-medium"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    {t('modules.startLearning') || 'Start Learning'}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex flex-col">
      <Header />
      
      <div className="flex-shrink-0 p-4 border-b border-white/20 bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {renderNavigation()}
          </div>
        </div>
      </div>
      
      <main className="flex-1 p-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {t('modules.title') || 'Learning Modules'}
            </h1>
            <p className="text-gray-300 text-lg">{t('modules.description') || 'Explore our comprehensive curriculum modules'}</p>
          </div>

          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('modules.searchPlaceholder') || 'Search modules...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/30 text-white placeholder-gray-400 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" 
                    : "border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                  }
                >
                  {category.name} ({category.count})
                </Button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => (
              <Card key={module.id} className="bg-white/10 border-white/30 hover:bg-white/15 transition-all duration-300 backdrop-blur-sm hover:scale-105 hover:shadow-xl">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-lg mb-2">{module.title}</CardTitle>
                      <p className="text-gray-300 text-sm">{module.system}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={getDifficultyColor(module.gradeLevel)}>
                      {module.gradeLevel}
                    </Badge>
                    <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                      {module.country}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-white/80 mb-4 text-sm">{module.description}</p>
                  
                  <div className="mb-4">
                    <p className="text-white/90 text-sm mb-2 font-medium">{t('modules.subjects') || 'Subjects'}:</p>
                    <div className="flex flex-wrap gap-1">
                      {module.subjects.slice(0, 3).map((subject: string) => (
                        <Badge key={subject} variant="outline" className="text-xs border-white/30 text-white/80 bg-white/5">
                          {subject}
                        </Badge>
                      ))}
                      {module.subjects.length > 3 && (
                        <Badge variant="outline" className="text-xs border-white/30 text-white/80 bg-white/5">
                          +{module.subjects.length - 3} {t('common.more') || 'more'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={() => startModule(module)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {t('modules.startLearning') || 'Start Learning'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredModules.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">{t('modules.noModulesFound') || 'No modules found'}</h3>
              <p className="text-gray-400">{t('modules.adjustFilters') || 'Try adjusting your search or filters'}</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Modules;
