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
  email?: string;
  joinedDate?: string;
}

interface PerformanceData {
  strengths: string[];
  weakAreas: string[];
  quizScores: { subject: string; score: number; date: string }[];
  studyHistory: { topic: string; timeSpent: number; completed: boolean }[];
  averageScore: number;
  totalTimeSpent: number;
  completionRate: number;
  totalQuizzesTaken: number;
  bestSubject: string;
  worstSubject: string;
  recentTrend: 'improving' | 'stable' | 'declining';
  streakDays: number;
}

interface WeeklyPlanDay {
  day: string;
  focus: string;
  activities: string[];
  duration: number;
  goals: string[];
}

interface FuturePlan {
  week: number;
  focus: string;
  objectives: string[];
  milestones: string[];
}

interface ProgressMilestone {
  title: string;
  achieved: boolean;
  date?: string;
}

interface PDFStudyPlan {
  studentData: StudentData;
  performance: PerformanceData;
  weeklyPlan: WeeklyPlanDay[];
  futurePlans: FuturePlan[];
  milestones: ProgressMilestone[];
  nextSteps: string[];
  recommendations: string[];
  longTermGoals: string[];
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
        .select('display_name, role, created_at')
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
        .limit(50);

      // Fetch study plans for history
      const { data: studyPlans } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

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

      // Fetch quest progress for milestones
      const { data: questProgress } = await supabase
        .from('user_quest_progress')
        .select(`
          *,
          quests (title, description, type)
        `)
        .eq('user_id', user.id)
        .eq('completed', true)
        .limit(10);

      // Process the data
      const strengths: string[] = [];
      const weakAreas: string[] = [];
      const subjectScores: Record<string, number[]> = {};

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

      // Process quiz scores and track by subject
      const quizScores = quizAttempts?.map((attempt: any) => {
        const subject = attempt.quizzes?.subjects?.name || attempt.quizzes?.title || 'General';
        const score = Math.round((attempt.score / attempt.total_possible) * 100);
        
        if (!subjectScores[subject]) subjectScores[subject] = [];
        subjectScores[subject].push(score);
        
        return {
          subject,
          score,
          date: new Date(attempt.completed_at).toLocaleDateString()
        };
      }) || [];

      // Find best and worst subjects
      let bestSubject = 'N/A';
      let worstSubject = 'N/A';
      let bestAvg = 0;
      let worstAvg = 100;

      Object.entries(subjectScores).forEach(([subject, scores]) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg > bestAvg) {
          bestAvg = avg;
          bestSubject = subject;
        }
        if (avg < worstAvg) {
          worstAvg = avg;
          worstSubject = subject;
        }
      });

      // Calculate average score
      const averageScore = quizScores.length > 0
        ? Math.round(quizScores.reduce((sum, q) => sum + q.score, 0) / quizScores.length)
        : 0;

      // Calculate recent trend (compare last 5 vs previous 5)
      let recentTrend: 'improving' | 'stable' | 'declining' = 'stable';
      if (quizScores.length >= 10) {
        const recent5 = quizScores.slice(0, 5).reduce((s, q) => s + q.score, 0) / 5;
        const prev5 = quizScores.slice(5, 10).reduce((s, q) => s + q.score, 0) / 5;
        if (recent5 > prev5 + 5) recentTrend = 'improving';
        else if (recent5 < prev5 - 5) recentTrend = 'declining';
      }

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

      // Generate future plans (4-week outlook)
      const futurePlans = generateFuturePlans(weakAreas, strengths, averageScore, language);

      // Generate milestones
      const milestones = generateMilestones(questProgress || [], averageScore, completionRate, language);

      // Generate next steps
      const nextSteps = generateNextSteps(weakAreas, averageScore, completionRate, language);

      // Generate recommendations
      const recommendations = generateRecommendations(strengths, weakAreas, averageScore, language);

      // Generate long-term goals
      const longTermGoals = generateLongTermGoals(weakAreas, averageScore, language);

      // Infer current level from grade level or performance
      const latestPlan = studyPlans?.[0];
      const gradeLevel = latestPlan?.grade_level || 'Not specified';

      let currentLevel = 'Beginner';
      if (averageScore >= 80) currentLevel = language === 'ar' ? 'متقدم' : 'Advanced';
      else if (averageScore >= 60) currentLevel = language === 'ar' ? 'متوسط' : 'Intermediate';
      else currentLevel = language === 'ar' ? 'مبتدئ' : 'Beginner';

      return {
        studentData: {
          studentName: profile?.display_name || user.email?.split('@')[0] || 'Student',
          gradeLevel,
          goals: latestPlan?.weak_areas || weakAreas.slice(0, 3),
          currentLevel,
          email: user.email,
          joinedDate: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : undefined
        },
        performance: {
          strengths: strengths.slice(0, 5),
          weakAreas: weakAreas.slice(0, 5),
          quizScores: quizScores.slice(0, 10),
          studyHistory: studyHistory.slice(0, 10),
          averageScore,
          totalTimeSpent,
          completionRate,
          totalQuizzesTaken: quizAttempts?.length || 0,
          bestSubject,
          worstSubject,
          recentTrend,
          streakDays: Math.floor(Math.random() * 7) + 1 // Placeholder - would need activity tracking
        },
        weeklyPlan,
        futurePlans,
        milestones,
        nextSteps,
        recommendations,
        longTermGoals,
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
      const isReviewDay = index === 6;

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

  const generateFuturePlans = (weakAreas: string[], strengths: string[], avgScore: number, lang: string): FuturePlan[] => {
    const isArabic = lang === 'ar';
    const plans: FuturePlan[] = [];

    // Week 1: Foundation
    plans.push({
      week: 1,
      focus: isArabic ? 'بناء الأساسيات' : 'Building Foundations',
      objectives: isArabic
        ? ['مراجعة المفاهيم الأساسية', 'تحديد نقاط الضعف الرئيسية', 'وضع جدول دراسي منتظم']
        : ['Review core concepts', 'Identify key weaknesses', 'Establish study routine'],
      milestones: isArabic
        ? ['إكمال 3 اختبارات تشخيصية', 'تحقيق 60% في المواضيع الأساسية']
        : ['Complete 3 diagnostic quizzes', 'Achieve 60% in foundational topics']
    });

    // Week 2: Targeted Improvement
    plans.push({
      week: 2,
      focus: isArabic ? 'التحسين المستهدف' : 'Targeted Improvement',
      objectives: isArabic
        ? [`التركيز على: ${weakAreas.slice(0, 2).join('، ') || 'المواضيع الضعيفة'}`, 'ممارسة يومية مكثفة', 'استخدام موارد إضافية']
        : [`Focus on: ${weakAreas.slice(0, 2).join(', ') || 'weak areas'}`, 'Intensive daily practice', 'Use additional resources'],
      milestones: isArabic
        ? ['تحسين 10% في المواضيع المستهدفة', 'إكمال 5 دروس']
        : ['10% improvement in targeted areas', 'Complete 5 lessons']
    });

    // Week 3: Consolidation
    plans.push({
      week: 3,
      focus: isArabic ? 'التعزيز والتوحيد' : 'Consolidation',
      objectives: isArabic
        ? ['دمج المعرفة الجديدة', 'ممارسة المشاكل المختلطة', 'مراجعة الأخطاء السابقة']
        : ['Integrate new knowledge', 'Practice mixed problems', 'Review past mistakes'],
      milestones: isArabic
        ? ['تحقيق 70% في الاختبارات المختلطة', 'إتقان موضوعين على الأقل']
        : ['Achieve 70% on mixed quizzes', 'Master at least 2 topics']
    });

    // Week 4: Mastery & Advancement
    plans.push({
      week: 4,
      focus: isArabic ? 'الإتقان والتقدم' : 'Mastery & Advancement',
      objectives: isArabic
        ? ['تحدي المواضيع المتقدمة', 'البناء على نقاط القوة', 'التحضير للمستوى التالي']
        : ['Challenge with advanced topics', 'Build on strengths', 'Prepare for next level'],
      milestones: isArabic
        ? ['تحقيق 80% معدل عام', 'إكمال جميع الأهداف الأسبوعية']
        : ['Achieve 80% overall average', 'Complete all weekly goals']
    });

    return plans;
  };

  const generateMilestones = (questProgress: any[], avgScore: number, completionRate: number, lang: string): ProgressMilestone[] => {
    const isArabic = lang === 'ar';
    const milestones: ProgressMilestone[] = [];

    // Completed milestones from quests
    questProgress?.slice(0, 3).forEach((quest: any) => {
      milestones.push({
        title: quest.quests?.title || (isArabic ? 'مهمة مكتملة' : 'Quest Completed'),
        achieved: true,
        date: quest.completed_at ? new Date(quest.completed_at).toLocaleDateString() : undefined
      });
    });

    // Performance-based milestones
    milestones.push({
      title: isArabic ? 'الوصول لمتوسط 50%' : 'Reach 50% Average',
      achieved: avgScore >= 50
    });

    milestones.push({
      title: isArabic ? 'الوصول لمتوسط 70%' : 'Reach 70% Average',
      achieved: avgScore >= 70
    });

    milestones.push({
      title: isArabic ? 'الوصول لمتوسط 90%' : 'Reach 90% Average',
      achieved: avgScore >= 90
    });

    milestones.push({
      title: isArabic ? 'إكمال 50% من الدروس' : 'Complete 50% of Lessons',
      achieved: completionRate >= 50
    });

    milestones.push({
      title: isArabic ? 'إكمال 100% من الدروس' : 'Complete 100% of Lessons',
      achieved: completionRate >= 100
    });

    return milestones;
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

    steps.push(isArabic
      ? 'استخدام المحادثة مع المعلم الذكي لتوضيح المفاهيم الصعبة'
      : 'Use AI tutor chat to clarify difficult concepts');

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

    recommendations.push(isArabic
      ? 'استخدم خاصية إنشاء الاختبارات لممارسة مخصصة'
      : 'Use quiz generator for customized practice');

    recommendations.push(isArabic
      ? 'راجع الأخطاء بعناية لتجنب تكرارها'
      : 'Review mistakes carefully to avoid repeating them');

    return recommendations;
  };

  const generateLongTermGoals = (weakAreas: string[], avgScore: number, lang: string): string[] => {
    const isArabic = lang === 'ar';
    const goals: string[] = [];

    goals.push(isArabic
      ? 'تحقيق معدل 85% أو أعلى في جميع المواد'
      : 'Achieve 85% or higher average across all subjects');

    goals.push(isArabic
      ? 'إتقان جميع نقاط الضعف الحالية خلال 3 أشهر'
      : 'Master all current weak areas within 3 months');

    goals.push(isArabic
      ? 'إكمال 100 اختبار تدريبي'
      : 'Complete 100 practice quizzes');

    goals.push(isArabic
      ? 'المحافظة على سلسلة دراسة لمدة 30 يوماً متتالية'
      : 'Maintain a 30-day study streak');

    goals.push(isArabic
      ? 'الانتقال للمستوى المتقدم في جميع المواضيع'
      : 'Advance to expert level in all topics');

    return goals;
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

      doc.setFont('helvetica');
      let yPosition = 20;

      // ===== PAGE 1: Title & Student Overview =====
      
      // Title with decorative line
      doc.setFontSize(26);
      doc.setTextColor(59, 130, 246);
      const title = isArabic ? 'خطة الدراسة الشخصية الشاملة' : 'Comprehensive Study Plan';
      doc.text(title, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
      yPosition += 8;
      
      // Decorative line
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 12;

      // Student Info Card
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, yPosition - 5, 180, 45, 3, 3, 'F');
      
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59);
      const studentInfoTitle = isArabic ? 'معلومات الطالب' : 'Student Information';
      doc.text(studentInfoTitle, isArabic ? 185 : 25, yPosition + 5, { align: isArabic ? 'right' : 'left' });
      yPosition += 12;

      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);
      
      const infoItems = [
        { label: isArabic ? 'الاسم:' : 'Name:', value: planData.studentData.studentName },
        { label: isArabic ? 'المستوى الدراسي:' : 'Grade:', value: planData.studentData.gradeLevel },
        { label: isArabic ? 'المستوى الحالي:' : 'Level:', value: planData.studentData.currentLevel },
        { label: isArabic ? 'تاريخ الإنشاء:' : 'Generated:', value: planData.generatedAt.toLocaleDateString() }
      ];

      infoItems.forEach((item, idx) => {
        const x = isArabic ? 185 : 25;
        const xOffset = idx < 2 ? 0 : 90;
        const yOffset = idx % 2 === 0 ? 0 : 7;
        doc.text(`${item.label} ${item.value}`, x + (isArabic ? -xOffset : xOffset), yPosition + yOffset, { align: isArabic ? 'right' : 'left' });
        if (idx === 1) yPosition += 14;
      });
      yPosition += 25;

      // ===== Performance Overview Box =====
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(15, yPosition - 5, 180, 50, 3, 3, 'F');
      
      doc.setFontSize(16);
      doc.setTextColor(59, 130, 246);
      const perfTitle = isArabic ? 'نظرة عامة على الأداء' : 'Performance Overview';
      doc.text(perfTitle, isArabic ? 185 : 25, yPosition + 5, { align: isArabic ? 'right' : 'left' });
      yPosition += 15;

      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);

      // Performance metrics in a grid
      const metrics = [
        { label: isArabic ? 'متوسط الدرجات' : 'Average Score', value: `${planData.performance.averageScore}%`, color: planData.performance.averageScore >= 70 ? [34, 197, 94] : [239, 68, 68] },
        { label: isArabic ? 'نسبة الإكمال' : 'Completion Rate', value: `${planData.performance.completionRate}%`, color: [59, 130, 246] },
        { label: isArabic ? 'الاختبارات المكتملة' : 'Quizzes Taken', value: `${planData.performance.totalQuizzesTaken}`, color: [139, 92, 246] },
        { label: isArabic ? 'الاتجاه' : 'Trend', value: isArabic ? (planData.performance.recentTrend === 'improving' ? '↑ تحسن' : planData.performance.recentTrend === 'declining' ? '↓ انخفاض' : '→ مستقر') : (planData.performance.recentTrend === 'improving' ? '↑ Improving' : planData.performance.recentTrend === 'declining' ? '↓ Declining' : '→ Stable'), color: planData.performance.recentTrend === 'improving' ? [34, 197, 94] : planData.performance.recentTrend === 'declining' ? [239, 68, 68] : [100, 100, 100] }
      ];

      metrics.forEach((metric, idx) => {
        const xBase = isArabic ? 175 - (idx * 45) : 30 + (idx * 45);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(metric.label, xBase, yPosition, { align: 'center' });
        doc.setFontSize(14);
        doc.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
        doc.text(metric.value, xBase, yPosition + 8, { align: 'center' });
      });
      yPosition += 20;

      // Best/Worst subjects
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      const bestLabel = isArabic ? 'أفضل مادة:' : 'Best Subject:';
      const worstLabel = isArabic ? 'تحتاج تحسين:' : 'Needs Work:';
      doc.text(`${bestLabel} ${planData.performance.bestSubject}`, isArabic ? 185 : 25, yPosition, { align: isArabic ? 'right' : 'left' });
      doc.text(`${worstLabel} ${planData.performance.worstSubject}`, isArabic ? 95 : 115, yPosition, { align: isArabic ? 'right' : 'left' });
      yPosition += 20;

      // ===== Strengths & Weaknesses Side by Side =====
      const colWidth = 85;
      
      // Strengths
      if (planData.performance.strengths.length > 0) {
        doc.setFontSize(13);
        doc.setTextColor(34, 197, 94);
        const strengthsTitle = isArabic ? 'نقاط القوة ✓' : '✓ Strengths';
        doc.text(strengthsTitle, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
        
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        planData.performance.strengths.forEach((strength, idx) => {
          doc.text(`• ${strength}`, isArabic ? 185 : 25, yPosition + 8 + (idx * 5), { align: isArabic ? 'right' : 'left' });
        });
      }

      // Weaknesses
      if (planData.performance.weakAreas.length > 0) {
        doc.setFontSize(13);
        doc.setTextColor(239, 68, 68);
        const weakTitle = isArabic ? 'مجالات التحسين ✗' : '✗ Areas to Improve';
        doc.text(weakTitle, isArabic ? 95 : 110, yPosition, { align: isArabic ? 'right' : 'left' });
        
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        planData.performance.weakAreas.forEach((area, idx) => {
          doc.text(`• ${area}`, isArabic ? 90 : 115, yPosition + 8 + (idx * 5), { align: isArabic ? 'right' : 'left' });
        });
      }
      yPosition += 8 + Math.max(planData.performance.strengths.length, planData.performance.weakAreas.length) * 5 + 15;

      // ===== PAGE 2: Weekly Plan =====
      doc.addPage();
      yPosition = 20;

      doc.setFontSize(18);
      doc.setTextColor(59, 130, 246);
      const weeklyTitle = isArabic ? 'الخطة الأسبوعية التفصيلية' : 'Detailed Weekly Plan';
      doc.text(weeklyTitle, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
      yPosition += 12;

      // Weekly Plan Table
      const tableHeaders = isArabic 
        ? ['الأهداف', 'المدة', 'الأنشطة', 'التركيز', 'اليوم']
        : ['Day', 'Focus', 'Activities', 'Duration', 'Goals'];

      const tableData = planData.weeklyPlan.map(day => {
        if (isArabic) {
          return [
            day.goals.join('\n'),
            `${day.duration} دقيقة`,
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
        theme: 'striped',
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
        alternateRowStyles: {
          fillColor: [248, 250, 252]
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

      yPosition = (doc as any).lastAutoTable.finalY + 20;

      // ===== PAGE 3: Future Plans (4-Week Outlook) =====
      doc.addPage();
      yPosition = 20;

      doc.setFontSize(18);
      doc.setTextColor(139, 92, 246);
      const futurePlanTitle = isArabic ? 'الخطة المستقبلية (4 أسابيع)' : '4-Week Future Plan';
      doc.text(futurePlanTitle, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
      yPosition += 15;

      planData.futurePlans.forEach((plan, idx) => {
        // Week header
        doc.setFillColor(idx % 2 === 0 ? 248 : 239, idx % 2 === 0 ? 250 : 246, idx % 2 === 0 ? 252 : 255);
        doc.roundedRect(15, yPosition - 5, 180, 45, 3, 3, 'F');
        
        doc.setFontSize(14);
        doc.setTextColor(59, 130, 246);
        const weekLabel = isArabic ? `الأسبوع ${plan.week}: ${plan.focus}` : `Week ${plan.week}: ${plan.focus}`;
        doc.text(weekLabel, isArabic ? 185 : 25, yPosition + 3, { align: isArabic ? 'right' : 'left' });
        yPosition += 12;

        // Objectives
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        const objLabel = isArabic ? 'الأهداف:' : 'Objectives:';
        doc.text(objLabel, isArabic ? 185 : 25, yPosition, { align: isArabic ? 'right' : 'left' });
        plan.objectives.forEach((obj, i) => {
          doc.text(`• ${obj}`, isArabic ? 180 : 30, yPosition + 5 + (i * 5), { align: isArabic ? 'right' : 'left' });
        });
        yPosition += 5 + plan.objectives.length * 5 + 3;

        // Milestones
        doc.setTextColor(34, 197, 94);
        const mileLabel = isArabic ? 'المعالم:' : 'Milestones:';
        doc.text(mileLabel, isArabic ? 185 : 25, yPosition, { align: isArabic ? 'right' : 'left' });
        doc.setTextColor(71, 85, 105);
        plan.milestones.forEach((mile, i) => {
          doc.text(`✓ ${mile}`, isArabic ? 180 : 30, yPosition + 5 + (i * 5), { align: isArabic ? 'right' : 'left' });
        });
        yPosition += 5 + plan.milestones.length * 5 + 15;
      });

      // ===== PAGE 4: Progress Milestones & Goals =====
      doc.addPage();
      yPosition = 20;

      // Progress Milestones
      doc.setFontSize(18);
      doc.setTextColor(249, 115, 22);
      const milestonesTitle = isArabic ? 'إنجازاتك ومعالم التقدم' : 'Your Achievements & Milestones';
      doc.text(milestonesTitle, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
      yPosition += 15;

      planData.milestones.forEach(milestone => {
        const icon = milestone.achieved ? '✅' : '⬜';
        doc.setFontSize(11);
        doc.setTextColor(milestone.achieved ? 34 : 150, milestone.achieved ? 197 : 150, milestone.achieved ? 94 : 150);
        const dateStr = milestone.date ? ` (${milestone.date})` : '';
        doc.text(`${icon} ${milestone.title}${dateStr}`, isArabic ? 185 : 25, yPosition, { align: isArabic ? 'right' : 'left' });
        yPosition += 8;
      });
      yPosition += 15;

      // Long-Term Goals
      doc.setFontSize(16);
      doc.setTextColor(139, 92, 246);
      const longTermTitle = isArabic ? 'الأهداف طويلة المدى' : 'Long-Term Goals';
      doc.text(longTermTitle, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
      yPosition += 10;

      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      planData.longTermGoals.forEach((goal, idx) => {
        doc.text(`${idx + 1}. ${goal}`, isArabic ? 185 : 25, yPosition, { align: isArabic ? 'right' : 'left' });
        yPosition += 7;
      });
      yPosition += 15;

      // Next Steps
      doc.setFontSize(16);
      doc.setTextColor(249, 115, 22);
      const nextStepsTitle = isArabic ? 'الخطوات التالية الموصى بها' : 'Recommended Next Steps';
      doc.text(nextStepsTitle, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
      yPosition += 10;

      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      planData.nextSteps.forEach(step => {
        const wrappedText = doc.splitTextToSize(`→ ${step}`, 165);
        doc.text(wrappedText, isArabic ? 185 : 25, yPosition, { align: isArabic ? 'right' : 'left' });
        yPosition += wrappedText.length * 5 + 3;
      });
      yPosition += 10;

      // Recommendations
      doc.setFontSize(16);
      doc.setTextColor(59, 130, 246);
      const recsTitle = isArabic ? 'توصيات مخصصة لك' : 'Personalized Recommendations';
      doc.text(recsTitle, isArabic ? 190 : 20, yPosition, { align: isArabic ? 'right' : 'left' });
      yPosition += 10;

      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      planData.recommendations.forEach(rec => {
        const wrappedText = doc.splitTextToSize(`💡 ${rec}`, 165);
        doc.text(wrappedText, isArabic ? 185 : 25, yPosition, { align: isArabic ? 'right' : 'left' });
        yPosition += wrappedText.length * 5 + 3;
      });

      // Footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        const footerText = isArabic 
          ? `الصفحة ${i} من ${pageCount} | تم إنشاؤها بواسطة Smarty Pants AI | ${planData.generatedAt.toLocaleDateString()}`
          : `Page ${i} of ${pageCount} | Generated by Smarty Pants AI | ${planData.generatedAt.toLocaleDateString()}`;
        doc.text(footerText, 105, 290, { align: 'center' });
      }

      // Save the PDF
      const fileName = isArabic 
        ? `خطة_الدراسة_الشاملة_${planData.studentData.studentName}_${new Date().toISOString().split('T')[0]}.pdf`
        : `Comprehensive_Study_Plan_${planData.studentData.studentName}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      doc.save(fileName);

      toast({
        title: isArabic ? 'تم إنشاء الخطة!' : 'Study Plan Generated!',
        description: isArabic ? 'تم تحميل ملف PDF بنجاح (4 صفحات)' : 'PDF downloaded successfully (4 pages)'
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
