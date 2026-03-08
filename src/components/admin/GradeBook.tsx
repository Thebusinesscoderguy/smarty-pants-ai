import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, BookOpen, Trophy, TrendingUp, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface StudentGrade {
  student_id: string;
  student_name: string;
  quiz_scores: { title: string; score: number; total: number; date: string }[];
  test_scores: { title: string; score: number; total: number; percentage: number; date: string }[];
  average_score: number;
  total_assessments: number;
}

export const GradeBook = () => {
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'average' | 'assessments'>('name');
  const { user } = useAuth();

  useEffect(() => {
    fetchGrades();
  }, [user]);

  const fetchGrades = async () => {
    if (!user) return;
    try {
      setIsLoading(true);

      // Get school
      const { data: school } = await supabase
        .from('school_accounts')
        .select('id')
        .eq('admin_user_id', user.id)
        .single();

      if (!school) {
        setGrades([]);
        return;
      }

      // Get enrolled students
      const { data: relationships } = await supabase
        .from('school_student_relationships')
        .select('student_id')
        .eq('school_id', school.id)
        .eq('is_active', true);

      if (!relationships?.length) {
        setGrades([]);
        return;
      }

      const studentIds = relationships.map(r => r.student_id);

      // Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', studentIds);

      // Get quiz attempts
      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select('user_id, score, total_possible, completed_at, quiz_id, quizzes(title)')
        .in('user_id', studentIds)
        .order('completed_at', { ascending: false });

      // Get test attempts
      const { data: testAttempts } = await supabase
        .from('test_attempts')
        .select('student_id, score, total_points, percentage, completed_at, test_id, tests(title)')
        .in('student_id', studentIds)
        .order('completed_at', { ascending: false });

      const gradeMap: Record<string, StudentGrade> = {};

      // Initialize with all students
      for (const profile of profiles || []) {
        gradeMap[profile.id] = {
          student_id: profile.id,
          student_name: profile.display_name || 'Unknown Student',
          quiz_scores: [],
          test_scores: [],
          average_score: 0,
          total_assessments: 0,
        };
      }

      // Add quiz scores
      for (const attempt of quizAttempts || []) {
        const grade = gradeMap[attempt.user_id];
        if (grade) {
          const quizTitle = (attempt as any).quizzes?.title || 'Untitled Quiz';
          grade.quiz_scores.push({
            title: quizTitle,
            score: attempt.score,
            total: attempt.total_possible,
            date: attempt.completed_at,
          });
        }
      }

      // Add test scores
      for (const attempt of testAttempts || []) {
        const grade = gradeMap[attempt.student_id];
        if (grade) {
          const testTitle = (attempt as any).tests?.title || 'Untitled Test';
          grade.test_scores.push({
            title: testTitle,
            score: attempt.score || 0,
            total: attempt.total_points || 0,
            percentage: attempt.percentage || 0,
            date: attempt.completed_at || '',
          });
        }
      }

      // Calculate averages
      for (const grade of Object.values(gradeMap)) {
        const allScores: number[] = [];
        for (const q of grade.quiz_scores) {
          if (q.total > 0) allScores.push((q.score / q.total) * 100);
        }
        for (const t of grade.test_scores) {
          if (t.percentage) allScores.push(t.percentage);
        }
        grade.total_assessments = allScores.length;
        grade.average_score = allScores.length > 0
          ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
          : 0;
      }

      setGrades(Object.values(gradeMap));
    } catch (error) {
      console.error('Error fetching grades:', error);
      toast({ title: 'Error', description: 'Failed to load grade book', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getGradeBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800 border-green-200">A</Badge>;
    if (score >= 80) return <Badge className="bg-blue-100 text-blue-800 border-blue-200">B</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">C</Badge>;
    if (score >= 60) return <Badge className="bg-orange-100 text-orange-800 border-orange-200">D</Badge>;
    return <Badge variant="destructive">F</Badge>;
  };

  const exportToCSV = () => {
    const headers = ['Student Name', 'Average Score', 'Grade', 'Total Assessments', 'Quiz Count', 'Test Count'];
    const rows = filteredGrades.map(g => [
      g.student_name,
      g.average_score,
      g.average_score >= 90 ? 'A' : g.average_score >= 80 ? 'B' : g.average_score >= 70 ? 'C' : g.average_score >= 60 ? 'D' : 'F',
      g.total_assessments,
      g.quiz_scores.length,
      g.test_scores.length,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grade-book-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'Grade book exported to CSV' });
  };

  const filteredGrades = grades
    .filter(g => g.student_name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.student_name.localeCompare(b.student_name);
      if (sortBy === 'average') return b.average_score - a.average_score;
      return b.total_assessments - a.total_assessments;
    });

  const classAverage = grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + g.average_score, 0) / grades.length)
    : 0;

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">Loading grade book...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Grade Book</h2>
          <p className="text-muted-foreground">View and export student scores across all assessments</p>
        </div>
        <Button onClick={exportToCSV} disabled={grades.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold text-foreground">{grades.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Class Average</p>
              <p className="text-2xl font-bold text-foreground">{classAverage}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <Trophy className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Honor Roll (≥90%)</p>
              <p className="text-2xl font-bold text-foreground">
                {grades.filter(g => g.average_score >= 90).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <TrendingUp className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Needs Support (&lt;60%)</p>
              <p className="text-2xl font-bold text-foreground">
                {grades.filter(g => g.average_score < 60 && g.total_assessments > 0).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="average">Average Score</SelectItem>
            <SelectItem value="assessments">Assessments</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grade Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="text-center">Quizzes</TableHead>
                <TableHead className="text-center">Tests</TableHead>
                <TableHead className="text-center">Average</TableHead>
                <TableHead className="text-center">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {grades.length === 0 ? 'No students enrolled yet.' : 'No students match your search.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredGrades.map(grade => (
                  <TableRow key={grade.student_id}>
                    <TableCell className="font-medium text-foreground">{grade.student_name}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-muted-foreground">{grade.quiz_scores.length} taken</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-muted-foreground">{grade.test_scores.length} taken</span>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-foreground">
                      {grade.total_assessments > 0 ? `${grade.average_score}%` : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      {grade.total_assessments > 0 ? getGradeBadge(grade.average_score) : (
                        <Badge variant="secondary">N/A</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
