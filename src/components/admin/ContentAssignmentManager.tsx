import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, Calendar as CalendarIcon, Users, X } from 'lucide-react';
import { format } from 'date-fns';
import { useContentAssignments } from '@/hooks/useContentAssignments';
import { useStudentClassifications } from '@/hooks/useStudentClassifications';
import { useTestManagement } from '@/hooks/useTestManagement';
import { useQuestManagement } from '@/hooks/useQuestManagement';
import { useCurriculumManagement } from '@/hooks/useCurriculumManagement';
import { useMonitoringData } from '@/hooks/useMonitoringData';

export const ContentAssignmentManager = () => {
  const { assignments, loading, createAssignment, deactivateAssignment } = useContentAssignments();
  const { availableTags } = useStudentClassifications();
  const { tests } = useTestManagement();
  const { quests } = useQuestManagement();
  const { curricula } = useCurriculumManagement();
  const { studentProgress } = useMonitoringData();

  const [selectedContentType, setSelectedContentType] = useState<string>('');
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [selectedAssignmentType, setSelectedAssignmentType] = useState<string>('');
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [dueDate, setDueDate] = useState<Date>();

  const getContentOptions = () => {
    switch (selectedContentType) {
      case 'test':
        return tests.map(t => ({ id: t.id, title: t.title }));
      case 'quest':
        return quests.map(q => ({ id: q.id, title: q.title }));
      case 'curriculum':
        return curricula.map(c => ({ id: c.id, title: c.title }));
      default:
        return [];
    }
  };

  const getTargetOptions = () => {
    if (selectedAssignmentType === 'individual') {
      return studentProgress.map(s => ({ id: s.student_id, title: s.student_name }));
    } else if (selectedAssignmentType === 'classification') {
      return availableTags.map(tag => ({ id: tag, title: tag }));
    }
    return [];
  };

  const handleCreateAssignment = async () => {
    if (!selectedContentType || !selectedContent || !selectedAssignmentType) return;

    let targetId = undefined;
    let classificationTag = undefined;

    if (selectedAssignmentType === 'individual') {
      targetId = selectedTarget;
    } else if (selectedAssignmentType === 'classification') {
      classificationTag = selectedTarget;
    }

    const success = await createAssignment(
      selectedContentType as any,
      selectedContent,
      selectedAssignmentType as any,
      targetId,
      classificationTag,
      dueDate?.toISOString()
    );

    if (success) {
      // Reset form
      setSelectedContentType('');
      setSelectedContent('');
      setSelectedAssignmentType('');
      setSelectedTarget('');
      setDueDate(undefined);
    }
  };

  const getAssignmentTypeDisplay = (assignment: any) => {
    switch (assignment.assignment_type) {
      case 'individual':
        return 'Individual Student';
      case 'classification':
        return `Classification: ${assignment.classification_tag}`;
      case 'all':
        return 'All Students';
      default:
        return assignment.assignment_type;
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading assignments...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Send className="h-5 w-5" />
            Content Assignment Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Assignment Creation Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Create Assignment</h3>
              
              <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                <SelectTrigger className="bg-card border-border text-foreground">
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="quest">Quest</SelectItem>
                  <SelectItem value="curriculum">Curriculum</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={selectedContent} 
                onValueChange={setSelectedContent}
                disabled={!selectedContentType}
              >
                <SelectTrigger className="bg-card border-border text-foreground">
                  <SelectValue placeholder="Select content" />
                </SelectTrigger>
                <SelectContent>
                  {getContentOptions().map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedAssignmentType} onValueChange={setSelectedAssignmentType}>
                <SelectTrigger className="bg-card border-border text-foreground">
                  <SelectValue placeholder="Assignment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="classification">By Classification</SelectItem>
                  <SelectItem value="individual">Individual Student</SelectItem>
                </SelectContent>
              </Select>

              {selectedAssignmentType !== 'all' && (
                <Select 
                  value={selectedTarget} 
                  onValueChange={setSelectedTarget}
                  disabled={!selectedAssignmentType}
                >
                  <SelectTrigger className="bg-card border-border text-foreground">
                    <SelectValue placeholder={
                      selectedAssignmentType === 'individual' 
                        ? "Select student" 
                        : "Select classification"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {getTargetOptions().map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-card border-border text-foreground hover:bg-muted"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Set due date (optional)"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button 
                onClick={handleCreateAssignment}
                disabled={!selectedContentType || !selectedContent || !selectedAssignmentType || (selectedAssignmentType !== 'all' && !selectedTarget)}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Assignment Preview</h3>
              <Card className="bg-muted border-border">
                <CardContent className="p-4 space-y-2">
                  <div className="text-sm text-foreground">
                    <strong>Content:</strong> {selectedContentType ? `${selectedContentType}: ${getContentOptions().find(o => o.id === selectedContent)?.title || 'Not selected'}` : 'Not selected'}
                  </div>
                  <div className="text-sm text-foreground">
                    <strong>Assignment Type:</strong> {selectedAssignmentType || 'Not selected'}
                  </div>
                  {selectedAssignmentType !== 'all' && (
                    <div className="text-sm text-foreground">
                      <strong>Target:</strong> {getTargetOptions().find(o => o.id === selectedTarget)?.title || 'Not selected'}
                    </div>
                  )}
                  {dueDate && (
                    <div className="text-sm text-foreground">
                      <strong>Due Date:</strong> {format(dueDate, "PPP")}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Assignments */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Assignments ({assignments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No active assignments</p>
            ) : (
              assignments.map((assignment) => (
                <Card key={assignment.id} className="bg-muted border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-foreground border-border">
                            {assignment.content_type}
                          </Badge>
                          <span className="text-foreground font-medium">
                            {assignment.content_title}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getAssignmentTypeDisplay(assignment)} • {assignment.student_count || 0} students
                        </div>
                        {assignment.due_date && (
                          <div className="text-sm text-muted-foreground">
                            Due: {format(new Date(assignment.due_date), "PPP")}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deactivateAssignment(assignment.id)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};