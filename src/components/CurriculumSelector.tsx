
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Star, Users, Clock, Globe, Bot } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Curriculum {
  id: string;
  title: string;
  description: string;
  subject: string;
  gradeLevel: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  rating: number;
  enrolledStudents: number;
  estimatedHours: number;
  language: string;
  topics: string[];
}

const sampleCurricula: Curriculum[] = [
  {
    id: '1',
    title: 'Complete Mathematics Foundation',
    description: 'Comprehensive math curriculum covering algebra, geometry, and calculus with interactive problem-solving.',
    subject: 'Mathematics',
    gradeLevel: '9-12',
    difficulty: 'Intermediate',
    rating: 4.8,
    enrolledStudents: 12450,
    estimatedHours: 120,
    language: 'Multi-language',
    topics: ['Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics']
  },
  {
    id: '2',
    title: 'Interactive Science Explorer',
    description: 'Hands-on science curriculum with virtual labs covering physics, chemistry, and biology.',
    subject: 'Science',
    gradeLevel: '6-10',
    difficulty: 'Beginner',
    rating: 4.6,
    enrolledStudents: 8920,
    estimatedHours: 90,
    language: 'Multi-language',
    topics: ['Physics', 'Chemistry', 'Biology', 'Earth Science', 'Environmental Science']
  },
  {
    id: '3',
    title: 'World Literature & Writing',
    description: 'Explore global literature while developing advanced writing and critical thinking skills.',
    subject: 'Literature',
    gradeLevel: '10-12',
    difficulty: 'Advanced',
    rating: 4.9,
    enrolledStudents: 6780,
    estimatedHours: 80,
    language: 'Multi-language',
    topics: ['Literary Analysis', 'Creative Writing', 'Essay Writing', 'Poetry', 'World Literature']
  },
  {
    id: '4',
    title: 'Programming Fundamentals',
    description: 'Learn programming from scratch with Python, JavaScript, and web development basics.',
    subject: 'Computer Science',
    gradeLevel: '8-12',
    difficulty: 'Beginner',
    rating: 4.7,
    enrolledStudents: 15200,
    estimatedHours: 100,
    language: 'Multi-language',
    topics: ['Python', 'JavaScript', 'HTML/CSS', 'Web Development', 'Problem Solving']
  },
  {
    id: '5',
    title: 'Global History & Culture',
    description: 'Journey through world history with interactive timelines and cultural exploration.',
    subject: 'History',
    gradeLevel: '7-11',
    difficulty: 'Intermediate',
    rating: 4.5,
    enrolledStudents: 7650,
    estimatedHours: 75,
    language: 'Multi-language',
    topics: ['Ancient History', 'Modern History', 'Cultural Studies', 'Geography', 'Politics']
  }
];

interface CurriculumSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (curriculum: Curriculum | null) => void;
}

export const CurriculumSelector = ({ isOpen, onClose, onSelect }: CurriculumSelectorProps) => {
  const { t } = useLanguage();
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-border">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4">Choose Your Learning Path</h2>
          <p className="text-muted-foreground text-lg">
            Select from our curated curricula or let AI create a personalized learning experience
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          {/* Create AI Curriculum Option */}
          <Card className="bg-primary/10 border-primary/30 hover:bg-primary/20 transition-all duration-300 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/20 rounded-xl">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Create AI Curriculum</h3>
                    <p className="text-muted-foreground">Tell our AI what you want to learn and it will create a personalized curriculum for you</p>
                  </div>
                </div>
                <Button 
                  onClick={() => onSelect(null)}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Create with AI
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Available Curricula */}
          <div className="grid md:grid-cols-2 gap-6">
            {sampleCurricula.map((curriculum) => (
              <Card key={curriculum.id} className="bg-muted border-border hover:bg-muted/80 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{curriculum.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline">{curriculum.subject}</Badge>
                        <Badge variant="secondary">{curriculum.gradeLevel}</Badge>
                        <Badge 
                          variant={curriculum.difficulty === 'Beginner' ? 'default' : curriculum.difficulty === 'Intermediate' ? 'secondary' : 'destructive'}
                        >
                          {curriculum.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-yellow-600">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm">{curriculum.rating}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{curriculum.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{curriculum.enrolledStudents.toLocaleString()} students</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{curriculum.estimatedHours}h</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Globe className="h-4 w-4" />
                      <span>{curriculum.language}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm mb-2">Topics covered:</p>
                    <div className="flex flex-wrap gap-2">
                      {curriculum.topics.slice(0, 3).map((topic) => (
                        <Badge key={topic} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                      {curriculum.topics.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{curriculum.topics.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={() => onSelect(curriculum)}
                    className="w-full"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Select This Curriculum
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
