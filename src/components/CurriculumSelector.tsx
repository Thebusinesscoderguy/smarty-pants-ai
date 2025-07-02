
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Plus, Star, Users, Clock, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { curricula, Curriculum } from '@/utils/curriculaData';

interface CurriculumSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (curriculum: Curriculum | null) => void;
}

export const CurriculumSelector = ({ isOpen, onClose, onSelect }: CurriculumSelectorProps) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-4">{t('curriculum.title') || 'Select Curriculum'}</h2>
          <p className="text-white/70 text-lg">
            Choose from our curated curricula or create your own personalized learning path
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          {/* Create Custom Option */}
          <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 hover:from-blue-600/30 hover:to-purple-600/30 transition-all duration-300 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Plus className="h-8 w-8 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{t('curriculum.create') || 'Create Custom'}</h3>
                    <p className="text-white/70">Upload your own materials and let AI create a personalized curriculum</p>
                  </div>
                </div>
                <Button 
                  onClick={() => onSelect(null)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Create Custom
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Available Curricula */}
          <div className="grid md:grid-cols-2 gap-6">
            {curricula.map((curriculum) => (
              <Card key={curriculum.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-lg">{curriculum.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline">{curriculum.system}</Badge>
                        <Badge variant="secondary">{curriculum.gradeLevel}</Badge>
                        <Badge variant="outline">{curriculum.country}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-white/70 mb-4">{curriculum.description}</p>
                  
                  <div className="mb-4">
                    <p className="text-white/80 text-sm mb-2">Subjects covered:</p>
                    <div className="flex flex-wrap gap-2">
                      {curriculum.subjects.slice(0, 3).map((subject) => (
                        <Badge key={subject} variant="outline" className="text-xs">
                          {subject}
                        </Badge>
                      ))}
                      {curriculum.subjects.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{curriculum.subjects.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-white/80 text-sm mb-2">Standards:</p>
                    <div className="flex flex-wrap gap-1">
                      {curriculum.standards.slice(0, 2).map((standard) => (
                        <Badge key={standard} variant="outline" className="text-xs text-blue-300 border-blue-500/40">
                          {standard}
                        </Badge>
                      ))}
                      {curriculum.standards.length > 2 && (
                        <Badge variant="outline" className="text-xs text-blue-300 border-blue-500/40">
                          +{curriculum.standards.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={() => onSelect(curriculum)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
