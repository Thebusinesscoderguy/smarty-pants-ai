import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tags, Plus, X, Wand2, Users } from 'lucide-react';
import { useStudentClassifications } from '@/hooks/useStudentClassifications';
import { useMonitoringData } from '@/hooks/useMonitoringData';

export const StudentClassificationManager = () => {
  const { 
    classifications, 
    availableTags, 
    loading, 
    assignClassification,
    removeClassification,
    autoClassifyStudent,
    getStudentsByClassification,
    predefinedTags
  } = useStudentClassifications();

  const { studentProgress } = useMonitoringData();
  
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [newTag, setNewTag] = useState<string>('');

  const handleAssignClassification = async () => {
    if (!selectedStudent || !selectedTag) return;
    
    await assignClassification(selectedStudent, selectedTag, false);
    setSelectedStudent('');
    setSelectedTag('');
  };

  const handleCreateCustomTag = async () => {
    if (!selectedStudent || !newTag.trim()) return;
    
    await assignClassification(selectedStudent, newTag.trim(), false);
    setSelectedStudent('');
    setNewTag('');
  };

  const handleAutoClassify = async (studentId: string) => {
    await autoClassifyStudent(studentId);
  };

  const getClassificationStats = () => {
    const stats = availableTags.map(tag => ({
      tag,
      count: getStudentsByClassification(tag).length,
      students: getStudentsByClassification(tag)
    }));

    return stats.sort((a, b) => b.count - a.count);
  };

  if (loading) {
    return <div className="animate-pulse">Loading classifications...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Student Classification Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Assignment Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Assign Classification</h3>
              
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {studentProgress.map((student) => (
                    <SelectItem key={student.student_id} value={student.student_id}>
                      {student.student_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select classification" />
                </SelectTrigger>
                <SelectContent>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={handleAssignClassification}
                disabled={!selectedStudent || !selectedTag}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign Classification
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Create Custom Tag</h3>
              
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Enter custom classification tag"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />

              <Button 
                onClick={handleCreateCustomTag}
                disabled={!selectedStudent || !newTag.trim()}
                className="w-full"
                variant="secondary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create & Assign Custom Tag
              </Button>
            </div>
          </div>

          {/* Auto-Classification Section */}
          <div className="border-t border-white/20 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Auto-Classification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studentProgress.map((student) => (
                <Card key={student.student_id} className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium text-sm">
                        {student.student_name}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAutoClassify(student.student_id)}
                        className="h-8 px-2"
                      >
                        <Wand2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {classifications
                        .filter(c => c.student_id === student.student_id)
                        .map((classification) => (
                          <Badge 
                            key={classification.id}
                            variant={classification.assigned_automatically ? "secondary" : "default"}
                            className="text-xs"
                          >
                            {classification.classification_tag}
                            <button
                              onClick={() => removeClassification(classification.id)}
                              className="ml-1 hover:text-red-400"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classification Statistics */}
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Classification Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getClassificationStats().map((stat) => (
              <Card key={stat.tag} className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">
                      {stat.tag}
                    </span>
                    <Badge variant="outline" className="text-white border-white/30">
                      {stat.count}
                    </Badge>
                  </div>
                  {stat.count > 0 && (
                    <div className="text-xs text-gray-400">
                      Students: {stat.students.map(s => s.student_name).join(', ')}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};