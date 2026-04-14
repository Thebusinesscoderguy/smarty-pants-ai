import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const SchoolAnalyticsReport = () => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    if (!user) return;
    setIsGenerating(true);

    try {
      // Fetch school info
      const { data: school } = await supabase
        .from('school_accounts')
        .select('*')
        .eq('admin_user_id', user.id)
        .single();

      if (!school) throw new Error('School not found');

      // Fetch all data in parallel
      const [studentsRes, subjectsRes, gradesRes, attendanceRes, semesterRes, sectionsRes] = await Promise.all([
        supabase.from('school_student_relationships').select('student_id').eq('school_id', school.id).eq('is_active', true),
        supabase.from('school_subjects').select('*').eq('school_id', school.id),
        supabase.from('student_daily_grades').select('*').eq('school_id', school.id),
        supabase.from('student_attendance').select('*').eq('school_id', school.id),
        supabase.from('student_semester_marks').select('*').eq('school_id', school.id),
        supabase.from('school_sections').select('*').eq('school_id', school.id),
      ]);

      const students = studentsRes.data || [];
      const subjects = subjectsRes.data || [];
      const grades = gradesRes.data || [];
      const attendance = attendanceRes.data || [];
      const semesterMarks = semesterRes.data || [];
      const sections = sectionsRes.data || [];

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(249, 115, 22); // Orange
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text(school.school_name, 14, 20);
      doc.setFontSize(11);
      doc.text(`School Analytics Report — ${new Date().toLocaleDateString()}`, 14, 32);

      // Summary stats
      doc.setTextColor(0, 0, 0);
      let y = 55;
      doc.setFontSize(14);
      doc.text('Overview', 14, y);
      y += 10;
      doc.setFontSize(10);
      doc.text(`Total Students: ${students.length}`, 14, y);
      doc.text(`Total Subjects: ${subjects.length}`, 80, y);
      doc.text(`Total Sections: ${sections.length}`, 150, y);
      y += 8;
      doc.text(`Total Grade Entries: ${grades.length}`, 14, y);
      doc.text(`Total Attendance Records: ${attendance.length}`, 80, y);

      // Subject Averages
      y += 15;
      doc.setFontSize(14);
      doc.text('Subject Performance', 14, y);
      y += 5;

      const subjectStats = subjects.map(sub => {
        const subGrades = grades.filter(g => g.subject_id === sub.id);
        const avgClasswork = subGrades.length > 0
          ? (subGrades.reduce((sum, g) => sum + (g.classwork_mark || 0), 0) / subGrades.length).toFixed(1)
          : '—';
        const avgHomework = subGrades.length > 0
          ? (subGrades.reduce((sum, g) => sum + (g.homework_mark || 0), 0) / subGrades.length).toFixed(1)
          : '—';
        const subAttendance = attendance.filter(a => a.subject_id === sub.id);
        const attendanceRate = subAttendance.length > 0
          ? ((subAttendance.filter(a => a.is_present).length / subAttendance.length) * 100).toFixed(0) + '%'
          : '—';
        return [sub.name, String(subGrades.length), avgClasswork, avgHomework, attendanceRate];
      });

      if (subjectStats.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Subject', 'Entries', 'Avg Classwork', 'Avg Homework', 'Attendance']],
          body: subjectStats,
          theme: 'striped',
          headStyles: { fillColor: [249, 115, 22] },
        });
        y = (doc as any).lastAutoTable.finalY + 15;
      }

      // Top Performers (from semester marks)
      if (semesterMarks.length > 0) {
        doc.setFontSize(14);
        doc.text('Top Performers (Semester)', 14, y);
        y += 5;

        const studentTotals = new Map<string, { total: number; count: number }>();
        semesterMarks.forEach(m => {
          const exam = m.final_exam_mark || 0;
          const existing = studentTotals.get(m.student_id) || { total: 0, count: 0 };
          studentTotals.set(m.student_id, { total: existing.total + exam, count: existing.count + 1 });
        });

        const ranked = Array.from(studentTotals.entries())
          .map(([id, { total, count }]) => ({ id, avg: total / count }))
          .sort((a, b) => b.avg - a.avg)
          .slice(0, 5);

        autoTable(doc, {
          startY: y,
          head: [['Rank', 'Student ID (truncated)', 'Average Exam Score']],
          body: ranked.map((r, i) => [String(i + 1), r.id.substring(0, 8) + '...', r.avg.toFixed(1)]),
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94] },
        });
        y = (doc as any).lastAutoTable.finalY + 15;
      }

      // At-Risk Students
      if (semesterMarks.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.text('At-Risk Students (Avg < 50%)', 14, y);
        y += 5;

        const studentTotals = new Map<string, { total: number; count: number }>();
        semesterMarks.forEach(m => {
          const exam = m.final_exam_mark || 0;
          const existing = studentTotals.get(m.student_id) || { total: 0, count: 0 };
          studentTotals.set(m.student_id, { total: existing.total + exam, count: existing.count + 1 });
        });

        const atRisk = Array.from(studentTotals.entries())
          .map(([id, { total, count }]) => ({ id, avg: total / count }))
          .filter(s => s.avg < 50)
          .sort((a, b) => a.avg - b.avg);

        if (atRisk.length > 0) {
          autoTable(doc, {
            startY: y,
            head: [['Student ID (truncated)', 'Average Exam Score', 'Status']],
            body: atRisk.map(r => [r.id.substring(0, 8) + '...', r.avg.toFixed(1), 'Needs Attention']),
            theme: 'striped',
            headStyles: { fillColor: [239, 68, 68] },
          });
        } else {
          doc.setFontSize(10);
          doc.text('No at-risk students found. Great!', 14, y + 5);
        }
      }

      // Attendance Summary
      if (attendance.length > 0) {
        doc.addPage();
        y = 20;
        doc.setFontSize(14);
        doc.text('Attendance Summary', 14, y);
        y += 5;

        const totalPresent = attendance.filter(a => a.is_present).length;
        const overallRate = ((totalPresent / attendance.length) * 100).toFixed(1);

        doc.setFontSize(10);
        doc.text(`Overall Attendance Rate: ${overallRate}%`, 14, y + 5);
        doc.text(`Total Records: ${attendance.length} | Present: ${totalPresent} | Absent: ${attendance.length - totalPresent}`, 14, y + 12);
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Generated by Teachly AI — Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      }

      doc.save(`${school.school_name.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast({ title: 'Report Generated', description: 'PDF has been downloaded.' });
    } catch (err: any) {
      console.error('Report generation error:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button onClick={generateReport} disabled={isGenerating} variant="outline">
      {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
      {isGenerating ? 'Generating...' : 'Download Report PDF'}
    </Button>
  );
};
