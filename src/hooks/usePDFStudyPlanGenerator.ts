import { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface StudentData {
  studentName: string;
  gradeLevel: string;
  goals: string[];
  currentLevel: string;
}

interface PerformanceData {
  strengths: string[];
  weakAreas: string[];
  quizScores: { subject: string; score: number; date: string }[];
  studyHistory: { topic: string; timeSpent: number; completed: boolean }[];
  averageScore: number;
  totalTimeSpent: number;
  completionRate: number;
}

interface WeeklyPlanDay {
  day: string;
  focus: string;
  activities: string[];
  duration: number;
  goals: string[];
}

interface PDFStudyPlan {
  studentData: StudentData;
  performance: PerformanceData;
  weeklyPlan: WeeklyPlanDay[];
  nextSteps: string[];
  recommendations: string[];
  generatedAt: Date;
}

export const usePDFStudyPlanGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const fetchStudentData = async (): Promise<PDFStudyPlan | null> => {
    if (!user) return null;

    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, role')
        .eq('id', user.id)
        .single();

      // Fetch learning analytics
      const { data: analytics } = await supabase
        .from('learning_analytics')
        .select(`
          *,
          subjects (name)
        `)
        .eq('user_id', user.id);

      // Fetch quiz attempts
      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select(`
          score,
          total_possible,
          completed_at,
          time_taken,
          quizzes (
            title,
            subjects (name)
          )
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(20);

      // Fetch study plans for history
      const { data: studyPlans } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch user progress
      const { data: userProgress } = await supabase
        .from('user_progress')
        .select(`
          *,
          lessons (name, modules (name, subjects (name)))
        `)
        .eq('user_id', user.id);

      // Fetch topic mastery
      const { data: topicMastery } = await supabase
        .from('student_topic_mastery')
        .select('*')
        .eq('student_id', user.id);

      // Process the data
      const strengths: string[] = [];
      const weakAreas: string[] = [];

      // Identify strengths and weaknesses from analytics
      analytics?.forEach((item: any) => {
        if (item.strength_score >= 0.75) {
          strengths.push(item.topic_name);
        } else if (item.strength_score < 0.5) {
          weakAreas.push(item.topic_name);
        }
      });

      // Also consider topic mastery
      topicMastery?.forEach((item: any) => {
        if (item.mastery_level >= 0.8 && !strengths.includes(item.topic_name)) {
          strengths.push(item.topic_name);
        } else if (item.mastery_level < 0.5 && !weakAreas.includes(item.topic_name)) {
          weakAreas.push(item.topic_name);
        }
      });

      // Process quiz scores
      const quizScores = quizAttempts?.map((attempt: any) => ({
        subject: attempt.quizzes?.subjects?.name || attempt.quizzes?.title || 'General',
        score: Math.round((attempt.score / attempt.total_possible) * 100),
        date: new Date(attempt.completed_at).toLocaleDateString()
      })) || [];

      // Calculate average score
      const averageScore = quizScores.length > 0
        ? Math.round(quizScores.reduce((sum, q) => sum + q.score, 0) / quizScores.length)
        : 0;

      // Process study history
      const studyHistory = userProgress?.map((progress: any) => ({
        topic: progress.lessons?.name || 'Unknown Topic',
        timeSpent: progress.time_spent || 0,
        completed: progress.status === 'completed'
      })) || [];

      // Calculate total time spent
      const totalTimeSpent = studyHistory.reduce((sum, h) => sum + h.timeSpent, 0);

      // Calculate completion rate
      const completedCount = studyHistory.filter(h => h.completed).length;
      const completionRate = studyHistory.length > 0
        ? Math.round((completedCount / studyHistory.length) * 100)
        : 0;

      // Generate weekly plan based on weak areas
      const weeklyPlan = generateWeeklyPlan(weakAreas, strengths, language);

      // Generate next steps
      const nextSteps = generateNextSteps(weakAreas, averageScore, completionRate, language);

      // Generate recommendations
      const recommendations = generateRecommendations(strengths, weakAreas, averageScore, language);

      // Infer current level from grade level or performance
      const latestPlan = studyPlans?.[0];
      const gradeLevel = latestPlan?.grade_level || 'Not specified';

      let currentLevel = 'Beginner';
      if (averageScore >= 80) currentLevel = 'Advanced';
      else if (averageScore >= 60) currentLevel = 'Intermediate';

      return {
        studentData: {
          studentName: profile?.display_name || user.email?.split('@')[0] || 'Student',
          gradeLevel,
          goals: latestPlan?.weak_areas || weakAreas.slice(0, 3),
          currentLevel
        },
        performance: {
          strengths: strengths.slice(0, 5),
          weakAreas: weakAreas.slice(0, 5),
          quizScores: quizScores.slice(0, 10),
          studyHistory: studyHistory.slice(0, 10),
          averageScore,
          totalTimeSpent,
          completionRate
        },
        weeklyPlan,
        nextSteps,
        recommendations,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error fetching student data:', error);
      return null;
    }
  };

  const generateWeeklyPlan = (weakAreas: string[], strengths: string[], lang: string): WeeklyPlanDay[] => {
    const isArabic = lang === 'ar';
    const days = isArabic 
      ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const planTemplates = weakAreas.length > 0 ? weakAreas : ['General Review'];

    return days.map((day, index) => {
      const focusArea = planTemplates[index % planTemplates.length];
      const isReviewDay = index === 6; // Saturday/السبت

      if (isReviewDay) {
        return {
          day,
          focus: isArabic ? 'مراجعة أسبوعية' : 'Weekly Review',
          activities: isArabic
            ? ['مراجعة جميع المواضيع', 'اختبار تدريبي', 'تحديد الأهداف للأسبوع القادم']
            : ['Review all topics', 'Practice quiz', 'Set goals for next week'],
          duration: 60,
          goals: isArabic
            ? ['تعزيز ما تعلمته', 'تحديد الفجوات المتبقية']
            : ['Reinforce learning', 'Identify remaining gaps']
        };
      }

      return {
        day,
        focus: focusArea,
        activities: isArabic
          ? [`دراسة ${focusArea}`, 'حل تمارين تدريبية', 'مراجعة الأخطاء']
          : [`Study ${focusArea}`, 'Complete practice exercises', 'Review mistakes'],
        duration: 45,
        goals: isArabic
          ? [`تحسين الفهم في ${focusArea}`, 'إكمال 5 أسئلة على الأقل']
          : [`Improve understanding of ${focusArea}`, 'Complete at least 5 practice questions']
      };
    });
  };

  const generateNextSteps = (weakAreas: string[], avgScore: number, completionRate: number, lang: string): string[] => {
    const isArabic = lang === 'ar';
    const steps: string[] = [];

    if (avgScore < 60) {
      steps.push(isArabic 
        ? 'التركيز على المفاهيم الأساسية قبل الانتقال للمواضيع المتقدمة'
        : 'Focus on foundational concepts before moving to advanced topics');
    }

    if (completionRate < 50) {
      steps.push(isArabic
        ? 'زيادة وتيرة الدراسة اليومية لتحسين نسبة الإكمال'
        : 'Increase daily study consistency to improve completion rate');
    }

    weakAreas.slice(0, 3).forEach(area => {
      steps.push(isArabic
        ? `ممارسة إضافية مطلوبة في: ${area}`
        : `Additional practice needed in: ${area}`);
    });

    steps.push(isArabic
      ? 'إجراء اختبارات تدريبية أسبوعية لقياس التقدم'
      : 'Take weekly practice tests to measure progress');

    return steps;
  };

  const generateRecommendations = (strengths: string[], weakAreas: string[], avgScore: number, lang: string): string[] => {
    const isArabic = lang === 'ar';
    const recommendations: string[] = [];

    if (strengths.length > 0) {
      recommendations.push(isArabic
        ? `استمر في البناء على نقاط القوة في: ${strengths.slice(0, 2).join('، ')}`
        : `Continue building on strengths in: ${strengths.slice(0, 2).join(', ')}`);
    }

    if (avgScore >= 80) {
      recommendations.push(isArabic
        ? 'أداء ممتاز! فكر في تحديات أكثر صعوبة'
        : 'Excellent performance! Consider more challenging problems');
    } else if (avgScore >= 60) {
      recommendations.push(isArabic
        ? 'أداء جيد! ركز على المجالات الضعيفة للوصول للتميز'
        : 'Good performance! Focus on weak areas to reach excellence');
    } else {
      recommendations.push(isArabic
        ? 'تحتاج لمزيد من الممارسة. ابدأ بالمفاهيم الأساسية'
        : 'More practice needed. Start with basic concepts');
    }

    recommendations.push(isArabic
      ? 'خصص 30-45 دقيقة يومياً للدراسة المركزة'
      : 'Dedicate 30-45 minutes daily for focused study');

    return recommendations;
  };

  const generatePDF = async (): Promise<void> => {
    if (!user) {
      toast({
        title: t('common.error') || 'Error',
        description: language === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please sign in first',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);

    try {
      const planData = await fetchStudentData();
      
      if (!planData) {
        toast({
          title: t('common.error') || 'Error',
          description: language === 'ar' ? 'فشل في جلب البيانات' : 'Failed to fetch data',
          variant: 'destructive'
        });
        return;
      }

      const isArabic = language === 'ar';
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set font for Arabic support (basic Latin fallback)
      doc.setFont('helvetica');

      let yPosition = 20;

      // Title
      doc.setFontSize(24);
      doc.setTextColor(59, 130, 246); // Blue
      const title = isArabic ? 'خطة الدراسة الشخصية' : 'Personalized Study Plan';
      doc.text(title, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
      yPosition += 15;

      // Student Info Section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      const studentLabel = isArabic ? 'الطالب:' : 'Student:';
      const gradeLabel = isArabic ? 'المستوى الدراسي:' : 'Grade Level:';
      const levelLabel = isArabic ? 'المستوى الحالي:' : 'Current Level:';
      const dateLabel = isArabic ? 'تاريخ الإنشاء:' : 'Generated:';

      doc.text(`${studentLabel} ${planData.studentData.studentName}`, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
      yPosition += 7;
      doc.text(`${gradeLabel} ${planData.studentData.gradeLevel}`, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
      yPosition += 7;
      doc.text(`${levelLabel} ${planData.studentData.currentLevel}`, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
      yPosition += 7;
      doc.text(`${dateLabel} ${planData.generatedAt.toLocaleDateString()}`, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
      yPosition += 15;

      // Performance Summary
      doc.setFontSize(16);
      doc.setTextColor(59, 130, 246);
      const perfTitle = isArabic ? 'ملخص الأداء' : 'Performance Summary';
      doc.text(perfTitle, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
      yPosition += 10;

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);

      const avgScoreLabel = isArabic ? 'متوسط الدرجات:' : 'Average Score:';
      const completionLabel = isArabic ? 'نسبة الإكمال:' : 'Completion Rate:';
      const timeLabel = isArabic ? 'إجمالي وقت الدراسة:' : 'Total Study Time:';

      doc.text(`${avgScoreLabel} ${planData.performance.averageScore}%`, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
      yPosition += 6;
      doc.text(`${completionLabel} ${planData.performance.completionRate}%`, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
      yPosition += 6;
      doc.text(`${timeLabel} ${Math.round(planData.performance.totalTimeSpent / 60)} ${isArabic ? 'دقيقة' : 'minutes'}`, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
      yPosition += 12;

      // Strengths
      if (planData.performance.strengths.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(34, 197, 94); // Green
        const strengthsTitle = isArabic ? 'نقاط القوة' : 'Strengths';
        doc.text(strengthsTitle, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
        yPosition += 8;

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        planData.performance.strengths.forEach(strength => {
          doc.text(`• ${strength}`, isArabic ? 185 : 25, yPosition, { align: isArabic ? 'right' : 'left' });
          yPosition += 5;
        });
        yPosition += 5;
      }

      // Weak Areas
      if (planData.performance.weakAreas.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(239, 68, 68); // Red
        const weakTitle = isArabic ? 'مجالات التحسين' : 'Areas for Improvement';
        doc.text(weakTitle, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
        yPosition += 8;

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        planData.performance.weakAreas.forEach(area => {
          doc.text(`• ${area}`, isArabic ? 185 : 25, yPosition, { align: isArabic ? 'right' : 'left' });
          yPosition += 5;
        });
        yPosition += 5;
      }

      // Weekly Plan Table
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setTextColor(59, 130, 246);
      const weeklyTitle = isArabic ? 'الخطة الأسبوعية' : 'Weekly Study Plan';
      doc.text(weeklyTitle, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
      yPosition += 10;

      // Create table data
      const tableHeaders = isArabic 
        ? ['الأهداف', 'المدة', 'الأنشطة', 'التركيز', 'اليوم']
        : ['Day', 'Focus', 'Activities', 'Duration', 'Goals'];

      const tableData = planData.weeklyPlan.map(day => {
        if (isArabic) {
          return [
            day.goals.join('\n'),
            `${day.duration} ${isArabic ? 'دقيقة' : 'min'}`,
            day.activities.join('\n'),
            day.focus,
            day.day
          ];
        }
        return [
          day.day,
          day.focus,
          day.activities.join('\n'),
          `${day.duration} min`,
          day.goals.join('\n')
        ];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [tableHeaders],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontSize: 10,
          halign: isArabic ? 'right' : 'left'
        },
        bodyStyles: {
          fontSize: 9,
          halign: isArabic ? 'right' : 'left'
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 35 },
          2: { cellWidth: 50 },
          3: { cellWidth: 25 },
          4: { cellWidth: 45 }
        },
        margin: { left: 15, right: 15 }
      });

      // Get final Y position after table
      yPosition = (doc as any).lastAutoTable.finalY + 15;

      // Next Steps
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(249, 115, 22); // Orange
      const nextStepsTitle = isArabic ? 'الخطوات التالية' : 'Next Steps';
      doc.text(nextStepsTitle, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
      yPosition += 8;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      planData.nextSteps.forEach(step => {
        const wrappedText = doc.splitTextToSize(`• ${step}`, 170);
        doc.text(wrappedText, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
        yPosition += wrappedText.length * 5 + 2;
      });
      yPosition += 5;

      // Recommendations
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(139, 92, 246); // Purple
      const recsTitle = isArabic ? 'التوصيات' : 'Recommendations';
      doc.text(recsTitle, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
      yPosition += 8;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      planData.recommendations.forEach(rec => {
        const wrappedText = doc.splitTextToSize(`• ${rec}`, 170);
        doc.text(wrappedText, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
        yPosition += wrappedText.length * 5 + 2;
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        const footerText = isArabic 
          ? `الصفحة ${i} من ${pageCount} - تم إنشاؤها بواسطة Smarty Pants AI`
          : `Page ${i} of ${pageCount} - Generated by Smarty Pants AI`;
        doc.text(footerText, 105, 290, { align: 'center' });
      }

      // Save the PDF
      const fileName = isArabic 
        ? `خطة_الدراسة_${planData.studentData.studentName}_${new Date().toISOString().split('T')[0]}.pdf`
        : `Study_Plan_${planData.studentData.studentName}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      doc.save(fileName);

      toast({
        title: isArabic ? 'تم إنشاء الخطة!' : 'Study Plan Generated!',
        description: isArabic ? 'تم تحميل ملف PDF بنجاح' : 'PDF downloaded successfully'
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: t('common.error') || 'Error',
        description: language === 'ar' ? 'فشل في إنشاء ملف PDF' : 'Failed to generate PDF',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    generatePDF
  };
};
