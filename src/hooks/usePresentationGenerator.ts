import { useState } from 'react';
import PptxGenJS from 'pptxgenjs';
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
  averageScore: number;
  completionRate: number;
  totalQuizzesTaken: number;
  bestSubject: string;
  worstSubject: string;
  recentTrend: 'improving' | 'stable' | 'declining';
}

interface WeeklyPlanDay {
  day: string;
  focus: string;
  activities: string[];
  duration: number;
}

interface FuturePlan {
  week: number;
  focus: string;
  objectives: string[];
  milestones: string[];
}

interface PresentationData {
  studentData: StudentData;
  performance: PerformanceData;
  weeklyPlan: WeeklyPlanDay[];
  futurePlans: FuturePlan[];
  nextSteps: string[];
  recommendations: string[];
  generatedAt: Date;
}

// Color palette - vibrant and modern
const COLORS = {
  primary: '4F46E5',      // Indigo
  secondary: '7C3AED',    // Purple
  accent: '06B6D4',       // Cyan
  success: '10B981',      // Emerald
  warning: 'F59E0B',      // Amber
  danger: 'EF4444',       // Red
  dark: '1F2937',         // Gray 800
  light: 'F9FAFB',        // Gray 50
  white: 'FFFFFF',
  gradient1: '6366F1',    // Indigo 500
  gradient2: '8B5CF6',    // Violet 500
};

export const usePresentationGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  const { language } = useLanguage();

  const fetchData = async (): Promise<PresentationData | null> => {
    if (!user) return null;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, role, created_at')
        .eq('id', user.id)
        .single();

      const { data: analytics } = await supabase
        .from('learning_analytics')
        .select('*, subjects (name)')
        .eq('user_id', user.id);

      const { data: quizAttempts } = await supabase
        .from('quiz_attempts')
        .select(`
          score, total_possible, completed_at,
          quizzes (title, subjects (name))
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(50);

      const { data: studyPlans } = await supabase
        .from('study_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: topicMastery } = await supabase
        .from('student_topic_mastery')
        .select('*')
        .eq('student_id', user.id);

      const { data: userProgress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

      // Process data
      const strengths: string[] = [];
      const weakAreas: string[] = [];
      const subjectScores: Record<string, number[]> = {};

      analytics?.forEach((item: any) => {
        if (item.strength_score >= 0.75) strengths.push(item.topic_name);
        else if (item.strength_score < 0.5) weakAreas.push(item.topic_name);
      });

      topicMastery?.forEach((item: any) => {
        if (item.mastery_level >= 0.8 && !strengths.includes(item.topic_name)) {
          strengths.push(item.topic_name);
        } else if (item.mastery_level < 0.5 && !weakAreas.includes(item.topic_name)) {
          weakAreas.push(item.topic_name);
        }
      });

      const quizScores = quizAttempts?.map((attempt: any) => {
        const subject = attempt.quizzes?.subjects?.name || attempt.quizzes?.title || 'General';
        const score = Math.round((attempt.score / attempt.total_possible) * 100);
        if (!subjectScores[subject]) subjectScores[subject] = [];
        subjectScores[subject].push(score);
        return { subject, score, date: new Date(attempt.completed_at).toLocaleDateString() };
      }) || [];

      let bestSubject = 'N/A', worstSubject = 'N/A', bestAvg = 0, worstAvg = 100;
      Object.entries(subjectScores).forEach(([subject, scores]) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg > bestAvg) { bestAvg = avg; bestSubject = subject; }
        if (avg < worstAvg) { worstAvg = avg; worstSubject = subject; }
      });

      const averageScore = quizScores.length > 0
        ? Math.round(quizScores.reduce((sum, q) => sum + q.score, 0) / quizScores.length) : 0;

      let recentTrend: 'improving' | 'stable' | 'declining' = 'stable';
      if (quizScores.length >= 10) {
        const recent5 = quizScores.slice(0, 5).reduce((s, q) => s + q.score, 0) / 5;
        const prev5 = quizScores.slice(5, 10).reduce((s, q) => s + q.score, 0) / 5;
        if (recent5 > prev5 + 5) recentTrend = 'improving';
        else if (recent5 < prev5 - 5) recentTrend = 'declining';
      }

      const completedCount = userProgress?.filter((p: any) => p.status === 'completed').length || 0;
      const completionRate = userProgress?.length ? Math.round((completedCount / userProgress.length) * 100) : 0;

      const latestPlan = studyPlans?.[0];
      const gradeLevel = latestPlan?.grade_level || 'Not specified';
      let currentLevel = averageScore >= 80 ? 'Advanced' : averageScore >= 60 ? 'Intermediate' : 'Beginner';
      if (language === 'ar') {
        currentLevel = averageScore >= 80 ? 'متقدم' : averageScore >= 60 ? 'متوسط' : 'مبتدئ';
      }

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
          averageScore,
          completionRate,
          totalQuizzesTaken: quizAttempts?.length || 0,
          bestSubject,
          worstSubject,
          recentTrend
        },
        weeklyPlan: generateWeeklyPlan(weakAreas, language),
        futurePlans: generateFuturePlans(weakAreas, language),
        nextSteps: generateNextSteps(weakAreas, averageScore, language),
        recommendations: generateRecommendations(strengths, weakAreas, averageScore, language),
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error fetching data:', error);
      return null;
    }
  };

  const generateWeeklyPlan = (weakAreas: string[], lang: string): WeeklyPlanDay[] => {
    const isArabic = lang === 'ar';
    const days = isArabic
      ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const planTemplates = weakAreas.length > 0 ? weakAreas : ['General Review'];

    return days.map((day, index) => {
      const focusArea = planTemplates[index % planTemplates.length];
      const isReviewDay = index === 6;
      return {
        day,
        focus: isReviewDay ? (isArabic ? 'مراجعة أسبوعية' : 'Weekly Review') : focusArea,
        activities: isReviewDay
          ? (isArabic ? ['مراجعة', 'اختبار', 'تحديد الأهداف'] : ['Review all', 'Practice quiz', 'Set goals'])
          : (isArabic ? [`دراسة ${focusArea}`, 'تمارين', 'مراجعة'] : [`Study ${focusArea}`, 'Exercises', 'Review']),
        duration: isReviewDay ? 60 : 45
      };
    });
  };

  const generateFuturePlans = (weakAreas: string[], lang: string): FuturePlan[] => {
    const isArabic = lang === 'ar';
    return [
      {
        week: 1,
        focus: isArabic ? 'بناء الأساسيات' : 'Building Foundations',
        objectives: isArabic
          ? ['مراجعة المفاهيم الأساسية', 'تحديد نقاط الضعف', 'وضع جدول دراسي']
          : ['Review core concepts', 'Identify weaknesses', 'Establish routine'],
        milestones: isArabic ? ['إكمال 3 اختبارات'] : ['Complete 3 quizzes']
      },
      {
        week: 2,
        focus: isArabic ? 'التحسين المستهدف' : 'Targeted Improvement',
        objectives: isArabic
          ? [`التركيز على: ${weakAreas[0] || 'المواضيع الضعيفة'}`, 'ممارسة يومية']
          : [`Focus on: ${weakAreas[0] || 'weak areas'}`, 'Daily practice'],
        milestones: isArabic ? ['تحسين 10%'] : ['10% improvement']
      },
      {
        week: 3,
        focus: isArabic ? 'التعزيز' : 'Consolidation',
        objectives: isArabic ? ['دمج المعرفة', 'مشاكل متنوعة'] : ['Integrate knowledge', 'Mixed problems'],
        milestones: isArabic ? ['70% في الاختبارات'] : ['70% on quizzes']
      },
      {
        week: 4,
        focus: isArabic ? 'الإتقان' : 'Mastery',
        objectives: isArabic ? ['تحديات متقدمة', 'التحضير للمستوى التالي'] : ['Advanced challenges', 'Next level prep'],
        milestones: isArabic ? ['80% معدل عام'] : ['80% average']
      }
    ];
  };

  const generateNextSteps = (weakAreas: string[], avgScore: number, lang: string): string[] => {
    const isArabic = lang === 'ar';
    const steps: string[] = [];
    if (avgScore < 60) {
      steps.push(isArabic ? 'التركيز على المفاهيم الأساسية' : 'Focus on foundational concepts');
    }
    weakAreas.slice(0, 2).forEach(area => {
      steps.push(isArabic ? `ممارسة إضافية في: ${area}` : `Extra practice in: ${area}`);
    });
    steps.push(isArabic ? 'اختبارات أسبوعية' : 'Weekly practice tests');
    steps.push(isArabic ? 'استخدام المعلم الذكي' : 'Use AI tutor for help');
    return steps;
  };

  const generateRecommendations = (strengths: string[], weakAreas: string[], avgScore: number, lang: string): string[] => {
    const isArabic = lang === 'ar';
    const recs: string[] = [];
    if (strengths.length > 0) {
      recs.push(isArabic ? `استمر في: ${strengths[0]}` : `Continue building on: ${strengths[0]}`);
    }
    if (avgScore >= 80) {
      recs.push(isArabic ? 'أداء ممتاز! جرب تحديات أصعب' : 'Excellent! Try harder challenges');
    } else if (avgScore >= 60) {
      recs.push(isArabic ? 'أداء جيد! ركز على نقاط الضعف' : 'Good! Focus on weak areas');
    } else {
      recs.push(isArabic ? 'ابدأ بالمفاهيم الأساسية' : 'Start with basic concepts');
    }
    recs.push(isArabic ? 'حافظ على الاستمرارية اليومية' : 'Maintain daily consistency');
    return recs;
  };

  const generatePresentation = async () => {
    if (!user) {
      toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please log in', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      const data = await fetchData();
      if (!data) throw new Error('Failed to fetch data');

      const isArabic = language === 'ar';
      const pptx = new PptxGenJS();
      
      // Set presentation properties
      pptx.author = 'Smarty Pants AI';
      pptx.title = isArabic ? 'خطة الدراسة الشخصية' : 'Personal Study Plan';
      pptx.subject = isArabic ? 'خطة دراسية' : 'Study Plan';
      pptx.layout = 'LAYOUT_16x9';

      // ========== SLIDE 1: Title Slide ==========
      const slide1 = pptx.addSlide();
      
      // Gradient background
      slide1.addShape('rect', {
        x: 0, y: 0, w: '100%', h: '100%',
        fill: { type: 'solid', color: COLORS.primary }
      });
      
      // Decorative circles (using lighter colors for transparency effect)
      slide1.addShape('ellipse', {
        x: -1, y: -1, w: 4, h: 4,
        fill: { type: 'solid', color: 'A78BFA' } // Lighter purple
      });
      slide1.addShape('ellipse', {
        x: 8, y: 3, w: 5, h: 5,
        fill: { type: 'solid', color: '67E8F9' } // Lighter cyan
      });

      // Main title
      slide1.addText(isArabic ? 'خطة الدراسة الشخصية' : 'Personal Study Plan', {
        x: 0.5, y: 1.8, w: 9, h: 1.2,
        fontSize: 44, bold: true, color: COLORS.white,
        align: isArabic ? 'right' : 'left',
        fontFace: 'Arial'
      });

      // Student name
      slide1.addText(data.studentData.studentName, {
        x: 0.5, y: 3.2, w: 9, h: 0.8,
        fontSize: 28, color: COLORS.light,
        align: isArabic ? 'right' : 'left',
        fontFace: 'Arial'
      });

      // Date & Level
      slide1.addText(`${isArabic ? 'المستوى: ' : 'Level: '}${data.studentData.currentLevel} | ${data.generatedAt.toLocaleDateString()}`, {
        x: 0.5, y: 4.2, w: 9, h: 0.5,
        fontSize: 16, color: COLORS.light,
        align: isArabic ? 'right' : 'left',
        transparency: 30
      });

      // Logo/brand
      slide1.addText('Smarty Pants AI', {
        x: 0.5, y: 5, w: 9, h: 0.4,
        fontSize: 14, color: COLORS.white,
        align: isArabic ? 'right' : 'left',
        transparency: 40
      });

      // ========== SLIDE 2: Performance Overview ==========
      const slide2 = pptx.addSlide();
      slide2.addShape('rect', { x: 0, y: 0, w: '100%', h: 1.2, fill: { type: 'solid', color: COLORS.primary } });
      slide2.addText(isArabic ? 'نظرة عامة على الأداء' : 'Performance Overview', {
        x: 0.5, y: 0.35, w: 9, h: 0.6, fontSize: 28, bold: true, color: COLORS.white, align: isArabic ? 'right' : 'left'
      });

      // Stats cards row
      const stats = [
        { label: isArabic ? 'المعدل' : 'Average', value: `${data.performance.averageScore}%`, color: data.performance.averageScore >= 70 ? COLORS.success : COLORS.warning },
        { label: isArabic ? 'الإكمال' : 'Completion', value: `${data.performance.completionRate}%`, color: COLORS.accent },
        { label: isArabic ? 'الاختبارات' : 'Quizzes', value: `${data.performance.totalQuizzesTaken}`, color: COLORS.secondary },
        { label: isArabic ? 'الاتجاه' : 'Trend', value: data.performance.recentTrend === 'improving' ? '📈' : data.performance.recentTrend === 'declining' ? '📉' : '➡️', color: COLORS.primary }
      ];

      stats.forEach((stat, i) => {
        const xPos = 0.5 + i * 2.4;
        slide2.addShape('roundRect', {
          x: xPos, y: 1.5, w: 2.2, h: 1.4,
          fill: { type: 'solid', color: stat.color },
          rectRadius: 0.1
        });
        slide2.addText(stat.value, {
          x: xPos, y: 1.6, w: 2.2, h: 0.8,
          fontSize: 32, bold: true, color: COLORS.white, align: 'center'
        });
        slide2.addText(stat.label, {
          x: xPos, y: 2.4, w: 2.2, h: 0.4,
          fontSize: 12, color: COLORS.white, align: 'center', transparency: 20
        });
      });

      // Best & Worst subjects
      slide2.addText(isArabic ? 'أفضل مادة' : 'Best Subject', {
        x: 0.5, y: 3.2, w: 4.5, h: 0.4, fontSize: 14, color: COLORS.dark, bold: true
      });
      slide2.addShape('roundRect', {
        x: 0.5, y: 3.6, w: 4.5, h: 0.6,
        fill: { type: 'solid', color: COLORS.success }, rectRadius: 0.05
      });
      slide2.addText(`🏆 ${data.performance.bestSubject}`, {
        x: 0.5, y: 3.65, w: 4.5, h: 0.5, fontSize: 16, color: COLORS.white, align: 'center'
      });

      slide2.addText(isArabic ? 'تحتاج تحسين' : 'Needs Improvement', {
        x: 5.2, y: 3.2, w: 4.5, h: 0.4, fontSize: 14, color: COLORS.dark, bold: true
      });
      slide2.addShape('roundRect', {
        x: 5.2, y: 3.6, w: 4.5, h: 0.6,
        fill: { type: 'solid', color: COLORS.warning }, rectRadius: 0.05
      });
      slide2.addText(`📚 ${data.performance.worstSubject}`, {
        x: 5.2, y: 3.65, w: 4.5, h: 0.5, fontSize: 16, color: COLORS.white, align: 'center'
      });

      // Strengths & Weaknesses
      slide2.addText(isArabic ? 'نقاط القوة ✅' : 'Strengths ✅', {
        x: 0.5, y: 4.4, w: 4.5, h: 0.4, fontSize: 14, color: COLORS.success, bold: true
      });
      data.performance.strengths.slice(0, 3).forEach((s, i) => {
        slide2.addText(`• ${s}`, {
          x: 0.5, y: 4.8 + i * 0.35, w: 4.5, h: 0.35, fontSize: 12, color: COLORS.dark
        });
      });

      slide2.addText(isArabic ? 'نقاط الضعف ⚠️' : 'Weak Areas ⚠️', {
        x: 5.2, y: 4.4, w: 4.5, h: 0.4, fontSize: 14, color: COLORS.danger, bold: true
      });
      data.performance.weakAreas.slice(0, 3).forEach((w, i) => {
        slide2.addText(`• ${w}`, {
          x: 5.2, y: 4.8 + i * 0.35, w: 4.5, h: 0.35, fontSize: 12, color: COLORS.dark
        });
      });

      // ========== SLIDE 3: Visual Analytics (Charts) ==========
      const slideCharts = pptx.addSlide();
      slideCharts.addShape('rect', { x: 0, y: 0, w: '100%', h: 1.2, fill: { type: 'solid', color: COLORS.gradient1 } });
      slideCharts.addText(isArabic ? 'تحليل الأداء المرئي' : 'Visual Performance Analytics', {
        x: 0.5, y: 0.35, w: 9, h: 0.6, fontSize: 28, bold: true, color: COLORS.white, align: isArabic ? 'right' : 'left'
      });

      // Prepare subject distribution data for pie chart
      const subjectCounts: Record<string, number> = {};
      data.performance.quizScores.forEach(q => {
        subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
      });
      const subjectLabels = Object.keys(subjectCounts).slice(0, 6);
      const subjectValues = subjectLabels.map(s => subjectCounts[s]);
      
      // If we have subject data, create pie chart
      if (subjectLabels.length > 0) {
        const pieColors = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.success, COLORS.warning, COLORS.danger];
        
        // Pie chart title
        slideCharts.addText(isArabic ? 'توزيع المواد 📊' : 'Subject Distribution 📊', {
          x: 0.5, y: 1.4, w: 4.5, h: 0.4, fontSize: 16, bold: true, color: COLORS.dark
        });
        
        // Draw pie chart manually using shapes (sectors approximated as wedges)
        const total = subjectValues.reduce((a, b) => a + b, 0);
        let currentAngle = 0;
        const centerX = 2.5;
        const centerY = 3.2;
        const radius = 1.2;
        
        // Draw pie segments as colored rectangles with labels (simplified visual)
        subjectLabels.forEach((label, i) => {
          const percentage = Math.round((subjectValues[i] / total) * 100);
          const yPos = 1.9 + i * 0.45;
          
          // Color box
          slideCharts.addShape('rect', {
            x: 0.5, y: yPos, w: 0.3, h: 0.3,
            fill: { type: 'solid', color: pieColors[i % pieColors.length] }
          });
          
          // Label with percentage
          slideCharts.addText(`${label}: ${percentage}%`, {
            x: 0.9, y: yPos, w: 3.5, h: 0.35,
            fontSize: 11, color: COLORS.dark
          });
        });
        
        // Visual pie representation using concentric arcs (simplified donut)
        slideCharts.addShape('ellipse', {
          x: 3.2, y: 2.4, w: 1.8, h: 1.8,
          fill: { type: 'solid', color: COLORS.primary }
        });
        slideCharts.addShape('ellipse', {
          x: 3.35, y: 2.55, w: 1.5, h: 1.5,
          fill: { type: 'solid', color: COLORS.secondary }
        });
        slideCharts.addShape('ellipse', {
          x: 3.55, y: 2.75, w: 1.1, h: 1.1,
          fill: { type: 'solid', color: COLORS.accent }
        });
        slideCharts.addShape('ellipse', {
          x: 3.75, y: 2.95, w: 0.7, h: 0.7,
          fill: { type: 'solid', color: COLORS.white }
        });
        slideCharts.addText(`${subjectLabels.length}`, {
          x: 3.75, y: 3.05, w: 0.7, h: 0.5,
          fontSize: 18, bold: true, color: COLORS.primary, align: 'center'
        });
      }

      // Bar chart for score trends (right side)
      slideCharts.addText(isArabic ? 'اتجاه الدرجات 📈' : 'Score Trends 📈', {
        x: 5.2, y: 1.4, w: 4.5, h: 0.4, fontSize: 16, bold: true, color: COLORS.dark
      });
      
      // Get last 5 quiz scores for bar chart
      const recentScores = data.performance.quizScores.slice(0, 5).reverse();
      const barWidth = 0.6;
      const barGap = 0.3;
      const maxBarHeight = 2.2;
      const barBaseY = 4.6;
      
      recentScores.forEach((quiz, i) => {
        const barHeight = (quiz.score / 100) * maxBarHeight;
        const xPos = 5.4 + i * (barWidth + barGap);
        
        // Bar
        const barColor = quiz.score >= 80 ? COLORS.success : quiz.score >= 60 ? COLORS.warning : COLORS.danger;
        slideCharts.addShape('rect', {
          x: xPos, y: barBaseY - barHeight, w: barWidth, h: barHeight,
          fill: { type: 'solid', color: barColor }
        });
        
        // Score label on top
        slideCharts.addText(`${quiz.score}%`, {
          x: xPos - 0.1, y: barBaseY - barHeight - 0.35, w: 0.8, h: 0.3,
          fontSize: 10, bold: true, color: COLORS.dark, align: 'center'
        });
        
        // Quiz number below
        slideCharts.addText(`${i + 1}`, {
          x: xPos, y: barBaseY + 0.05, w: barWidth, h: 0.25,
          fontSize: 9, color: COLORS.dark, align: 'center'
        });
      });
      
      // X-axis label
      slideCharts.addText(isArabic ? 'آخر الاختبارات' : 'Recent Quizzes', {
        x: 5.2, y: 4.95, w: 4.5, h: 0.3,
        fontSize: 10, color: COLORS.dark, align: 'center'
      });
      
      // Performance gauge / meter
      slideCharts.addShape('rect', {
        x: 0.5, y: 5.0, w: 9.2, h: 0.15,
        fill: { type: 'solid', color: 'E5E7EB' }
      });
      const gaugeWidth = (data.performance.averageScore / 100) * 9.2;
      const gaugeColor = data.performance.averageScore >= 80 ? COLORS.success : data.performance.averageScore >= 60 ? COLORS.warning : COLORS.danger;
      slideCharts.addShape('rect', {
        x: 0.5, y: 5.0, w: gaugeWidth, h: 0.15,
        fill: { type: 'solid', color: gaugeColor }
      });
      slideCharts.addText(isArabic ? `الأداء العام: ${data.performance.averageScore}%` : `Overall Performance: ${data.performance.averageScore}%`, {
        x: 0.5, y: 5.2, w: 9.2, h: 0.3,
        fontSize: 12, bold: true, color: COLORS.dark, align: 'center'
      });

      // ========== SLIDE 4: Weekly Plan ==========
      const slide4 = pptx.addSlide();
      slide4.addShape('rect', { x: 0, y: 0, w: '100%', h: 1.2, fill: { type: 'solid', color: COLORS.secondary } });
      slide4.addText(isArabic ? 'الخطة الأسبوعية' : 'Weekly Study Plan', {
        x: 0.5, y: 0.35, w: 9, h: 0.6, fontSize: 28, bold: true, color: COLORS.white, align: isArabic ? 'right' : 'left'
      });

      // Weekly calendar grid
      const dayColors = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.success, COLORS.warning, COLORS.gradient1, COLORS.danger];
      data.weeklyPlan.forEach((day, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const xPos = 0.5 + col * 2.4;
        const yPos = 1.5 + row * 2.2;

        slide4.addShape('roundRect', {
          x: xPos, y: yPos, w: 2.2, h: 2,
          fill: { type: 'solid', color: dayColors[i] },
          rectRadius: 0.1
        });
        slide4.addText(day.day, {
          x: xPos, y: yPos + 0.1, w: 2.2, h: 0.4,
          fontSize: 14, bold: true, color: COLORS.white, align: 'center'
        });
        slide4.addText(day.focus, {
          x: xPos + 0.1, y: yPos + 0.5, w: 2, h: 0.4,
          fontSize: 11, color: COLORS.white, align: 'center'
        });
        slide4.addText(`${day.duration} ${isArabic ? 'دقيقة' : 'min'}`, {
          x: xPos, y: yPos + 1.6, w: 2.2, h: 0.3,
          fontSize: 10, color: COLORS.white, align: 'center'
        });
      });

      // ========== SLIDE 5: 4-Week Future Plan ==========
      const slide5 = pptx.addSlide();
      slide5.addShape('rect', { x: 0, y: 0, w: '100%', h: 1.2, fill: { type: 'solid', color: COLORS.accent } });
      slide5.addText(isArabic ? 'خطة الأربعة أسابيع' : '4-Week Roadmap', {
        x: 0.5, y: 0.35, w: 9, h: 0.6, fontSize: 28, bold: true, color: COLORS.white, align: isArabic ? 'right' : 'left'
      });

      // Timeline visualization
      data.futurePlans.forEach((plan, i) => {
        const xPos = 0.5 + i * 2.4;
        
        // Week circle
        slide4.addShape('ellipse', {
          x: xPos + 0.85, y: 1.5, w: 0.5, h: 0.5,
          fill: { type: 'solid', color: COLORS.primary }
        });
        slide4.addText(`${plan.week}`, {
          x: xPos + 0.85, y: 1.55, w: 0.5, h: 0.4,
          fontSize: 14, bold: true, color: COLORS.white, align: 'center'
        });

        // Connecting line (except last)
        if (i < 3) {
          slide4.addShape('line', {
            x: xPos + 1.4, y: 1.75, w: 1.9, h: 0,
            line: { color: COLORS.primary, width: 2, dashType: 'dash' }
          });
        }

        // Content card
        slide4.addShape('roundRect', {
          x: xPos, y: 2.2, w: 2.2, h: 2.8,
          fill: { type: 'solid', color: COLORS.light },
          line: { color: COLORS.primary, width: 1 },
          rectRadius: 0.1
        });
        slide4.addText(plan.focus, {
          x: xPos + 0.1, y: 2.3, w: 2, h: 0.5,
          fontSize: 12, bold: true, color: COLORS.primary, align: 'center'
        });
        
        plan.objectives.slice(0, 2).forEach((obj, j) => {
          slide4.addText(`• ${obj}`, {
            x: xPos + 0.1, y: 2.8 + j * 0.4, w: 2, h: 0.4,
            fontSize: 9, color: COLORS.dark
          });
        });

        slide4.addText(isArabic ? 'الهدف:' : 'Goal:', {
          x: xPos + 0.1, y: 4, w: 2, h: 0.3,
          fontSize: 9, bold: true, color: COLORS.success
        });
        slide4.addText(plan.milestones[0] || '', {
          x: xPos + 0.1, y: 4.3, w: 2, h: 0.5,
          fontSize: 9, color: COLORS.dark
        });
      });

      // ========== SLIDE 6: Next Steps & Recommendations ==========
      const slide6 = pptx.addSlide();
      slide6.addShape('rect', { x: 0, y: 0, w: '100%', h: 1.2, fill: { type: 'solid', color: COLORS.success } });
      slide6.addText(isArabic ? 'الخطوات التالية والتوصيات' : 'Next Steps & Recommendations', {
        x: 0.5, y: 0.35, w: 9, h: 0.6, fontSize: 28, bold: true, color: COLORS.white, align: isArabic ? 'right' : 'left'
      });

      // Next Steps section
      slide6.addText(isArabic ? '🎯 الخطوات التالية' : '🎯 Next Steps', {
        x: 0.5, y: 1.5, w: 4.5, h: 0.5, fontSize: 18, bold: true, color: COLORS.primary
      });
      data.nextSteps.slice(0, 4).forEach((step, i) => {
        slide6.addShape('roundRect', {
          x: 0.5, y: 2.1 + i * 0.7, w: 4.5, h: 0.6,
          fill: { type: 'solid', color: i % 2 === 0 ? 'E0E7FF' : 'F0F9FF' },
          rectRadius: 0.05
        });
        slide6.addText(`${i + 1}. ${step}`, {
          x: 0.6, y: 2.15 + i * 0.7, w: 4.3, h: 0.5,
          fontSize: 11, color: COLORS.dark
        });
      });

      // Recommendations section
      slide6.addText(isArabic ? '💡 التوصيات' : '💡 Recommendations', {
        x: 5.2, y: 1.5, w: 4.5, h: 0.5, fontSize: 18, bold: true, color: COLORS.secondary
      });
      data.recommendations.slice(0, 4).forEach((rec, i) => {
        slide6.addShape('roundRect', {
          x: 5.2, y: 2.1 + i * 0.7, w: 4.5, h: 0.6,
          fill: { type: 'solid', color: i % 2 === 0 ? 'F3E8FF' : 'FDF4FF' },
          rectRadius: 0.05
        });
        slide6.addText(`✓ ${rec}`, {
          x: 5.3, y: 2.15 + i * 0.7, w: 4.3, h: 0.5,
          fontSize: 11, color: COLORS.dark
        });
      });

      // Motivational footer
      slide6.addShape('roundRect', {
        x: 0.5, y: 4.8, w: 9.2, h: 0.7,
        fill: { type: 'solid', color: COLORS.primary },
        rectRadius: 0.1
      });
      slide6.addText(isArabic ? '🌟 كل خطوة صغيرة تقربك من النجاح! استمر في التعلم! 🌟' : '🌟 Every small step brings you closer to success! Keep learning! 🌟', {
        x: 0.5, y: 4.9, w: 9.2, h: 0.5,
        fontSize: 14, bold: true, color: COLORS.white, align: 'center'
      });

      // ========== SLIDE 7: Summary & Contact ==========
      const slide7 = pptx.addSlide();
      slide7.addShape('rect', { x: 0, y: 0, w: '100%', h: '100%', fill: { type: 'solid', color: COLORS.primary } });
      
      slide7.addShape('ellipse', {
        x: 7, y: -2, w: 6, h: 6,
        fill: { type: 'solid', color: 'A78BFA' } // Lighter purple for visual effect
      });

      slide7.addText(isArabic ? 'ملخص خطتك' : 'Your Plan Summary', {
        x: 0.5, y: 1.5, w: 9, h: 0.8,
        fontSize: 32, bold: true, color: COLORS.white, align: isArabic ? 'right' : 'left'
      });

      const summaryItems = [
        { icon: '📊', text: isArabic ? `معدلك الحالي: ${data.performance.averageScore}%` : `Current Average: ${data.performance.averageScore}%` },
        { icon: '🎯', text: isArabic ? `المستوى: ${data.studentData.currentLevel}` : `Level: ${data.studentData.currentLevel}` },
        { icon: '📅', text: isArabic ? `أيام الدراسة: 7 أيام/أسبوع` : `Study Days: 7 days/week` },
        { icon: '⏱️', text: isArabic ? `الوقت المقترح: 45-60 دقيقة/يوم` : `Suggested Time: 45-60 min/day` }
      ];

      summaryItems.forEach((item, i) => {
        slide7.addText(`${item.icon} ${item.text}`, {
          x: 0.5, y: 2.5 + i * 0.6, w: 9, h: 0.5,
          fontSize: 18, color: COLORS.white, align: isArabic ? 'right' : 'left'
        });
      });

      slide7.addText('Smarty Pants AI', {
        x: 0.5, y: 4.8, w: 9, h: 0.4,
        fontSize: 14, color: COLORS.light, align: 'center'
      });
      slide7.addText(isArabic ? 'تم إنشاء هذا العرض آلياً' : 'Auto-generated presentation', {
        x: 0.5, y: 5.2, w: 9, h: 0.3,
        fontSize: 12, color: COLORS.light, align: 'center'
      });

      // Generate and download
      const filename = isArabic ? `خطة_الدراسة_${data.studentData.studentName}.pptx` : `Study_Plan_${data.studentData.studentName}.pptx`;
      await pptx.writeFile({ fileName: filename });

      toast({
        title: isArabic ? 'تم بنجاح!' : 'Success!',
        description: isArabic ? 'تم تحميل العرض التقديمي' : 'Presentation downloaded successfully'
      });
    } catch (error) {
      console.error('Error generating presentation:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في إنشاء العرض' : 'Failed to generate presentation',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return { isGenerating, generatePresentation };
};
