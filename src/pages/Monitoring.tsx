
import React, { useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { EnhancedStudentDashboard } from '@/components/monitoring/EnhancedStudentDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, BookOpen, Target, Award, Trash2, Settings } from 'lucide-react';
import { useCurriculumManagement } from '@/hooks/useCurriculumManagement';
import { useQuestManagement } from '@/hooks/useQuestManagement';
import { useAchievementManagement } from '@/hooks/useAchievementManagement';
import { toast } from '@/hooks/use-toast';

const Monitoring = () => {
  const { curricula, loading: curriculaLoading, deleteCurriculum } = useCurriculumManagement();
  const { quests, loading: questsLoading, deleteQuest } = useQuestManagement();
  const { achievements, loading: achievementsLoading, deleteAchievement } = useAchievementManagement();

  const handleDeleteCurriculum = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this curriculum?')) {
      await deleteCurriculum(id);
      toast({
        title: "Success",
        description: "Curriculum deleted successfully",
      });
    }
  };

  const handleDeleteQuest = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this quest?')) {
      await deleteQuest(id);
      toast({
        title: "Success", 
        description: "Quest deleted successfully",
      });
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this achievement?')) {
      await deleteAchievement(id);
      toast({
        title: "Success",
        description: "Achievement deleted successfully", 
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      <AppSidebar />
      
      <div className="flex-1 overflow-hidden">
        <header className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Student Monitoring</h1>
              <p className="text-gray-400 mt-1">
                Track student progress, performance, and engagement across all subjects
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Get Started
            </Button>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <EnhancedStudentDashboard />
          
          {/* Content Management Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Curricula Management */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BookOpen className="h-5 w-5" />
                  Curricula ({curricula.length})
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Manage learning curricula and track completion
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {curriculaLoading ? (
                  <div className="text-gray-400">Loading curricula...</div>
                ) : curricula.length === 0 ? (
                  <div className="text-gray-400">No curricula found</div>
                ) : (
                  curricula.slice(0, 3).map((curriculum) => (
                    <div key={curriculum.id} className="flex items-center justify-between p-2 rounded bg-gray-800">
                      <div className="flex-1">
                        <div className="font-medium text-white">{curriculum.title}</div>
                        <div className="text-sm text-gray-400">{curriculum.grade_level || 'All Grades'}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCurriculum(curriculum.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quests Management */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Target className="h-5 w-5" />
                  Quests ({quests.length})
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Active learning quests and challenges
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {questsLoading ? (
                  <div className="text-gray-400">Loading quests...</div>
                ) : quests.length === 0 ? (
                  <div className="text-gray-400">No quests found</div>
                ) : (
                  quests.slice(0, 3).map((quest) => (
                    <div key={quest.id} className="flex items-center justify-between p-2 rounded bg-gray-800">
                      <div className="flex-1">
                        <div className="font-medium text-white">{quest.title}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {quest.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {quest.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuest(quest.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Achievements Management */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Award className="h-5 w-5" />
                  Achievements ({achievements.length})
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Student achievements and milestones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {achievementsLoading ? (
                  <div className="text-gray-400">Loading achievements...</div>
                ) : achievements.length === 0 ? (
                  <div className="text-gray-400">No achievements found</div>
                ) : (
                  achievements.slice(0, 3).map((achievement) => (
                    <div key={achievement.id} className="flex items-center justify-between p-2 rounded bg-gray-800">
                      <div className="flex-1">
                        <div className="font-medium text-white">{achievement.name}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {achievement.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {achievement.points} pts
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAchievement(achievement.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Monitoring;
