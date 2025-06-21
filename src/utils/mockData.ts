
// Comprehensive mock data for achievements, quests, and dashboard
export const mockAchievements = [
  {
    id: 'mock-1',
    name: 'First Steps',
    description: 'Complete your first lesson',
    icon: '🚀',
    type: 'milestone',
    earned: true,
    earned_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'mock-2',
    name: 'Math Master',
    description: 'Excel in mathematics',
    icon: '🧮',
    type: 'mastery',
    earned: true,
    earned_at: '2024-01-20T14:30:00Z'
  },
  {
    id: 'mock-3',
    name: 'Speed Reader',
    description: 'Read 10 lessons in one day',
    icon: '📚',
    type: 'streak',
    earned: false,
    earned_at: null
  },
  {
    id: 'mock-4',
    name: 'Perfect Score',
    description: 'Get 100% on 5 quizzes',
    icon: '🎯',
    type: 'completion',
    earned: false,
    earned_at: null
  }
];

export const mockQuests = {
  active: [
    {
      id: 'quest-1',
      title: 'Daily Math Challenge',
      description: 'Complete 3 math problems today',
      type: 'daily',
      difficulty: 'basic',
      target_value: 3,
      current_value: 1,
      progress: 33,
      reward: '50 XP',
      expires_at: '2024-01-22T23:59:59Z',
      subjects: { name: 'Mathematics' }
    },
    {
      id: 'quest-2',
      title: 'Science Explorer',
      description: 'Learn about the solar system',
      type: 'weekly',
      difficulty: 'intermediate',
      target_value: 5,
      current_value: 3,
      progress: 60,
      reward: '100 XP + Badge',
      expires_at: '2024-01-28T23:59:59Z',
      subjects: { name: 'Science' }
    }
  ],
  completed: [
    {
      id: 'quest-3',
      title: 'Reading Streak',
      description: 'Read for 7 consecutive days',
      type: 'weekly',
      difficulty: 'basic',
      target_value: 7,
      current_value: 7,
      progress: 100,
      reward: '75 XP',
      completed_at: '2024-01-18T16:20:00Z',
      subjects: { name: 'Literature' }
    }
  ]
};

export const mockSubjects = [
  {
    id: 'subj-1',
    name: 'Mathematics',
    description: 'Algebra, Geometry, and Calculus',
    completion_percentage: 75,
    lessons_completed: 15,
    total_lessons: 20,
    time_spent: 180, // minutes
    current_grade: 'A-',
    assigned_by: 'school',
    last_activity: '2024-01-21T10:30:00Z',
    strengths: ['Problem Solving', 'Algebra'],
    needs_work: ['Geometry'],
    recent_topics: ['Quadratic Equations', 'Linear Functions']
  },
  {
    id: 'subj-2',
    name: 'Science',
    description: 'Physics, Chemistry, and Biology',
    completion_percentage: 60,
    lessons_completed: 12,
    total_lessons: 20,
    time_spent: 150,
    current_grade: 'B+',
    assigned_by: 'parent',
    last_activity: '2024-01-20T15:45:00Z',
    strengths: ['Scientific Method', 'Biology'],
    needs_work: ['Chemistry Formulas'],
    recent_topics: ['Cell Structure', 'Chemical Reactions']
  },
  {
    id: 'subj-3',
    name: 'Literature',
    description: 'Reading comprehension and writing',
    completion_percentage: 90,
    lessons_completed: 18,
    total_lessons: 20,
    time_spent: 120,
    current_grade: 'A',
    assigned_by: 'self',
    last_activity: '2024-01-21T09:15:00Z',
    strengths: ['Reading Comprehension', 'Creative Writing'],
    needs_work: ['Grammar'],
    recent_topics: ['Shakespeare', 'Essay Writing']
  }
];

export const mockAnalytics = {
  strengths: [
    { topic: 'Algebra', score: 95, subject: 'Mathematics' },
    { topic: 'Reading Comprehension', score: 90, subject: 'Literature' },
    { topic: 'Biology', score: 85, subject: 'Science' }
  ],
  weaknesses: [
    { topic: 'Geometry', score: 65, subject: 'Mathematics' },
    { topic: 'Chemistry', score: 60, subject: 'Science' },
    { topic: 'Grammar', score: 70, subject: 'Literature' }
  ],
  improvement_paragraph: "Emma is excelling in algebra and reading comprehension, showing strong analytical skills. She demonstrates excellent understanding in biology concepts. To continue growing, focus on geometry where visual-spatial reasoning can be strengthened through practice. Chemistry formulas would benefit from regular review and application. Grammar skills are developing well and consistent practice will build confidence."
};

export const mockParentDashboard = {
  student_id: 'mock-student-1',
  student_name: 'Emma Johnson',
  ...mockAnalytics
};
