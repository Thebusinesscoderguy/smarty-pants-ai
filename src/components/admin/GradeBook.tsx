import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, BookOpen, Trophy, TrendingUp, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface StudentGrade {
  student_id: string;
  student_name: string;
  avatar_url: string | null;
  quiz_scores: { title: string; score: number; total: number; date: string }[];
  test_scores: { title: string; score: number; total: number; percentage: number; date: string }[];
  average_score: number;
  total_assessments: number;
}

interface SectionWithGrades {
  id: string;
  grade_level: string;
  section_name: string;
  students: StudentGrade[];
}

export const GradeBook = () => {
  const [sections, setSections] = useState<SectionWithGrades[]>([]);
  const [ungroupedGrades, setUngroupedGrades] = useState<StudentGrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    fetchGrades();
  }, [user]);

  const fetchGrades = async () => {
    if (!user) return;
    try {
      setIsLoading(true);

      const { data: school } = await supabase
        .from('school_accounts')
        .select('id')
        .eq('admin_user_id', user.id)
        .single();

      if (!school) { setSections([]); setUngroupedGrades([]); return; }

      // Fetch all data in parallel
      const [relRes, secRes, secStudRes] = await Promise.all([
        supabase.from('school_student_relationships').select('student_id').eq('school_id', school.id).eq('is_active', true),
        supabase.from('school_sections').select('id, grade_level, section_name').eq('school_id', school.id),
        supabase.from('section_students').select('section_id, student_id'),
      ]);

      const relationships = relRes.data;
      if (!relationships?.length) { setSections([]); setUngroupedGrades([]); return; }

      const studentIds = relationships.map(r => r.student_id);

      const [profRes, quizRes, testRes] = await Promise.all([
        supabase.from('profiles').select('id, display_name, avatar_url').in('id', studentIds),
        supabase.from('quiz_attempts').select('user_id, score, total_possible, completed_at, quiz_id, quizzes(title)').in('user_id', studentIds).order('completed_at', { ascending: false }),
        supabase.from('test_attempts').select('student_id, score, total_points, percentage, completed_at, test_id, tests(title)').in('student_id', studentIds).order('completed_at', { ascending: false }),
      ]);

      // Build grade map
      const gradeMap: Record<string, StudentGrade> = {};
      for (const profile of profRes.data || []) {
        gradeMap[profile.id] = {
          student_id: profile.id,
          student_name: profile.display_name || 'Unknown Student',
          avatar_url: (profile as any).avatar_url || null,
          quiz_scores: [],
          test_scores: [],
          average_score: 0,
          total_assessments: 0,
        };
      }

      for (const attempt of quizRes.data || []) {
        const grade = gradeMap[attempt.user_id];
        if (grade) {
          grade.quiz_scores.push({
            title: (attempt as any).quizzes?.title || 'Untitled Quiz',
            score: attempt.score,
            total: attempt.total_possible,
            date: attempt.completed_at,
          });
        }
      }

      for (const attempt of testRes.data || []) {
        const grade = gradeMap[attempt.student_id];
        if (grade) {
          grade.test_scores.push({
            title: (attempt as any).tests?.title || 'Untitled Test',
            score: attempt.score || 0,
            total: attempt.total_points || 0,
            percentage: attempt.percentage || 0,
            date: attempt.completed_at || '',
          });
        }
      }

      for (const grade of Object.values(gradeMap)) {
        const allScores: number[] = [];
        for (const q of grade.quiz_scores) { if (q.total > 0) allScores.push((q.score / q.total) * 100); }
        for (const t of grade.test_scores) { if (t.percentage) allScores.push(t.percentage); }
        grade.total_assessments = allScores.length;
        grade.average_score = allScores.length > 0
          ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
          : 0;
      }

      // Group by sections
      const sectionStudentMap: Record<string, string[]> = {};
      const assignedStudentIds = new Set<string>();
      for (const ss of secStudRes.data || []) {
        if (!sectionStudentMap[ss.section_id]) sectionStudentMap[ss.section_id] = [];
        sectionStudentMap[ss.section_id].push(ss.student_id);
        assignedStudentIds.add(ss.student_id);
      }

      const sectionData: SectionWithGrades[] = (secRes.data || []).map(sec => ({
        id: sec.id,
        grade_level: sec.grade_level,
        section_name: sec.section_name,
        students: (sectionStudentMap[sec.id] || [])
          .filter(sid => gradeMap[sid])
          .map(sid => gradeMap[sid]),
      })).sort((a, b) => a.grade_level.localeCompare(b.grade_level, undefined, { numeric: true }));

      const ungrouped = Object.values(gradeMap).filter(g => !assignedStudentIds.has(g.student_id));

      setSections(sectionData);
      setUngroupedGrades(ungrouped);
    } catch (error) {
      console.error('Error fetching grades:', error);
      toast({ title: 'Error', description: 'Failed to load grade book', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getGradeBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800 border-green-200">A</Badge>;
    if (score >= 80) return <Badge className="bg-blue-100 text-blue-800 border-blue-200">B</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">C</Badge>;
    if (score >= 60) return <Badge className="bg-orange-100 text-orange-800 border-orange-200">D</Badge>;
    return <Badge variant="destructive">F</Badge>;
  };

  const allGrades = [...sections.flatMap(s => s.students), ...ungroupedGrades];

  const exportToCSV = () => {
    const headers = ['Section', 'Student Name', 'Average Score', 'Grade', 'Quizzes', 'Tests'];
    const rows: string[][] = [];
    for (const sec of sections) {
      for (const g of sec.students) {
        rows.push([`Grade ${sec.grade_level} ${sec.section_name}`, g.student_name, String(g.average_score),
          g.average_score >= 90 ? 'A' : g.average_score >= 80 ? 'B' : g.average_score >= 70 ? 'C' : g.average_score >= 60 ? 'D' : 'F',
          String(g.quiz_scores.length), String(g.test_scores.length)]);
      }
    }
    for (const g of ungroupedGrades) {
      rows.push(['Unassigned', g.student_name, String(g.average_score),
        g.average_score >= 90 ? 'A' : g.average_score >= 80 ? 'B' : g.average_score >= 70 ? 'C' : g.average_score >= 60 ? 'D' : 'F',
        String(g.quiz_scores.length), String(g.test_scores.length)]);
    }
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

  const classAverage = allGrades.length > 0
    ? Math.round(allGrades.reduce((sum, g) => sum + g.average_score, 0) / allGrades.length)
    : 0;

  if (isLoading) {
    return <div className="animate-pulse text-muted-foreground">Loading grade book...</div>;
  }

  const renderStudentTable = (students: StudentGrade[]) => (
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
        {students.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-6">No students in this section.</TableCell>
          </TableRow>
        ) : (
          students.map(grade => (
            <TableRow key={grade.student_id}>
              <TableCell className="font-medium text-foreground">
                <div className="flex items-center gap-2">
                  {grade.avatar_url ? (
                    <img src={grade.avatar_url} alt={grade.student_name} className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                      {grade.student_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {grade.student_name}
                </div>
              </TableCell>
              <TableCell className="text-center text-muted-foreground">{grade.quiz_scores.length} taken</TableCell>
              <TableCell className="text-center text-muted-foreground">{grade.test_scores.length} taken</TableCell>
              <TableCell className="text-center font-semibold text-foreground">
                {grade.total_assessments > 0 ? `${grade.average_score}%` : '—'}
              </TableCell>
              <TableCell className="text-center">
                {grade.total_assessments > 0 ? getGradeBadge(grade.average_score) : <Badge variant="secondary">N/A</Badge>}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Grade Book</h2>
          <p className="text-muted-foreground">View and export student scores by section</p>
        </div>
        <Button onClick={exportToCSV} disabled={allGrades.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><BookOpen className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold text-foreground">{allGrades.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Class Average</p>
              <p className="text-2xl font-bold text-foreground">{classAverage}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100"><Trophy className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Honor Roll (≥90%)</p>
              <p className="text-2xl font-bold text-foreground">{allGrades.filter(g => g.average_score >= 90).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10"><TrendingUp className="h-5 w-5 text-destructive" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Needs Support (&lt;60%)</p>
              <p className="text-2xl font-bold text-foreground">{allGrades.filter(g => g.average_score < 60 && g.total_assessments > 0).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map(section => {
          const isExpanded = expandedSections.has(section.id);
          const sectionAvg = section.students.length > 0
            ? Math.round(section.students.reduce((s, g) => s + g.average_score, 0) / section.students.length)
            : 0;

          return (
            <Card key={section.id} className="bg-card border-border overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">
                    Grade {section.grade_level} {section.section_name}
                  </span>
                  <Badge variant="secondary">{section.students.length} students</Badge>
                </div>
                <div className="flex items-center gap-3">
                  {section.students.length > 0 && (
                    <span className="text-sm text-muted-foreground">Avg: {sectionAvg}%</span>
                  )}
                </div>
              </button>
              {isExpanded && (
                <CardContent className="p-0 border-t border-border">
                  {renderStudentTable(section.students)}
                </CardContent>
              )}
            </Card>
          );
        })}

        {ungroupedGrades.length > 0 && (
          <Card className="bg-card border-border overflow-hidden">
            <button
              onClick={() => toggleSection('ungrouped')}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                {expandedSections.has('ungrouped') ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold text-foreground">Unassigned Students</span>
                <Badge variant="outline">{ungroupedGrades.length} students</Badge>
              </div>
            </button>
            {expandedSections.has('ungrouped') && (
              <CardContent className="p-0 border-t border-border">
                {renderStudentTable(ungroupedGrades)}
              </CardContent>
            )}
          </Card>
        )}

        {sections.length === 0 && ungroupedGrades.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center text-muted-foreground">
              No students enrolled yet. Add sections and students to see grades.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
