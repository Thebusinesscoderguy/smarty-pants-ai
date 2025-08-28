
import { Curriculum } from '@/hooks/useCurriculumManagement';
import { Quest } from '@/hooks/useQuestManagement';
import { Achievement } from '@/hooks/useAchievementManagement';
import { Test } from '@/hooks/useTestManagement';

export const getDemoTestData = (): Test[] => [
  {
    id: 'test-1',
    title: 'Math Test 1',
    description: 'Basic math test for elementary school students',
    subject: 'Math',
    time_limit_minutes: 30,
    is_mandatory: true,
    ai_graded: false,
    ai_generated: false,
    total_points: 50,
    created_at: '2024-01-05T14:30:00.000Z',
    creator_id: 'teacher-1'
  },
  {
    id: 'test-2',
    title: 'Science Quiz 1',
    description: 'General science knowledge quiz for middle school students',
    subject: 'Science',
    time_limit_minutes: 45,
    is_mandatory: false,
    ai_graded: true,
    ai_generated: true,
    total_points: 75,
    created_at: '2024-01-10T09:00:00.000Z',
    creator_id: 'teacher-1'
  },
  {
    id: 'test-3',
    title: 'English Test 1',
    description: 'Vocabulary and grammar test for high school students',
    subject: 'English',
    time_limit_minutes: 60,
    is_mandatory: true,
    ai_graded: true,
    ai_generated: false,
    total_points: 100,
    created_at: '2024-01-15T16:00:00.000Z',
    creator_id: 'teacher-1'
  }
];

export const getDemoCurriculumData = (): Curriculum[] => [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    title: 'Elementary Math Foundations',
    description: 'Core mathematical concepts for grades 1-3',
    grade_level: 'Grade 1-3',
    content: {
      sections: [
        { title: 'Numbers and Counting', lessons: ['Basic Counting', 'Number Recognition'] },
        { title: 'Addition and Subtraction', lessons: ['Simple Addition', 'Simple Subtraction'] }
      ]
    },
    is_active: true,
    created_at: '2024-01-15T10:00:00.000Z'
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    title: 'Reading Comprehension Level 1',
    description: 'Building foundational reading skills',
    grade_level: 'Grade 2-4',
    content: {
      sections: [
        { title: 'Phonics', lessons: ['Letter Sounds', 'Blending Words'] },
        { title: 'Vocabulary', lessons: ['Sight Words', 'Context Clues'] }
      ]
    },
    is_active: true,
    created_at: '2024-01-20T14:30:00.000Z'
  },
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d481',
    title: 'Science Exploration',
    description: 'Introduction to scientific thinking and observation',
    grade_level: 'Grade 3-5',
    content: {
      sections: [
        { title: 'Scientific Method', lessons: ['Observation', 'Hypothesis'] },
        { title: 'Life Science', lessons: ['Plants', 'Animals', 'Habitats'] }
      ]
    },
    is_active: true,
    created_at: '2024-02-01T09:15:00.000Z'
  }
];

export const getDemoQuestList = (): Quest[] => [
  {
    id: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
    title: 'Math Master',
    description: 'Complete 10 math problems correctly',
    type: 'daily',
    difficulty: 'intermediate',
    target_value: 10,
    is_active: true,
    created_at: '2024-01-15T10:00:00.000Z',
    rewards: { points: 50, badge: 'Math Star' },
    requirements: { subject: 'math', accuracy: 80 },
    expires_at: '2024-12-31T23:59:59.000Z',
    created_by: 'teacher',
    created_by_id: 'teacher-uuid-1'
  },
  {
    id: 'a47ac10b-58cc-4372-a567-0e02b2c3d480',
    title: 'Reading Champion',
    description: 'Read for 30 minutes daily',
    type: 'daily',
    difficulty: 'basic',
    target_value: 30,
    is_active: true,
    created_at: '2024-01-20T14:30:00.000Z',
    rewards: { points: 25, badge: 'Bookworm' },
    requirements: { activity: 'reading', duration: 30 },
    expires_at: '2024-12-31T23:59:59.000Z',
    created_by: 'teacher',
    created_by_id: 'teacher-uuid-1'
  },
  {
    id: 'a47ac10b-58cc-4372-a567-0e02b2c3d481',
    title: 'Science Explorer',
    description: 'Complete a science experiment',
    type: 'weekly',
    difficulty: 'hard',
    target_value: 1,
    is_active: true,
    created_at: '2024-02-01T09:15:00.000Z',
    rewards: { points: 100, badge: 'Young Scientist' },
    requirements: { subject: 'science', type: 'experiment' },
    expires_at: '2024-12-31T23:59:59.000Z',
    created_by: 'teacher',
    created_by_id: 'teacher-uuid-1'
  }
];

export const getDemoAchievementList = (): Achievement[] => [
  {
    id: 'b47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'First Steps',
    description: 'Complete your first lesson',
    type: 'milestone',
    icon: 'trophy',
    points: 10,
    criteria: { lessons_completed: 1 },
    created_at: '2024-01-15T10:00:00.000Z',
    creator_id: 'teacher-uuid-1'
  },
  {
    id: 'b47ac10b-58cc-4372-a567-0e02b2c3d480',
    name: 'Streak Master',
    description: 'Study for 7 days in a row',
    type: 'streak',
    icon: 'flame',
    points: 50,
    criteria: { consecutive_days: 7 },
    created_at: '2024-01-20T14:30:00.000Z',
    creator_id: 'teacher-uuid-1'
  },
  {
    id: 'b47ac10b-58cc-4372-a567-0e02b2c3d481',
    name: 'Perfect Score',
    description: 'Get 100% on a test',
    type: 'mastery',
    icon: 'star',
    points: 25,
    criteria: { test_score: 100 },
    created_at: '2024-02-01T09:15:00.000Z',
    creator_id: 'teacher-uuid-1'
  },
  {
    id: 'b47ac10b-58cc-4372-a567-0e02b2c3d482',
    name: 'Quick Learner',
    description: 'Complete 5 lessons in one day',
    type: 'challenge',
    icon: 'zap',
    points: 75,
    criteria: { daily_lessons: 5 },
    created_at: '2024-02-05T11:20:00.000Z',
    creator_id: 'teacher-uuid-1'
  }
];

// Add demo data for quest completions
export const getDemoQuestCompletions = () => [
  {
    quest_id: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
    quest_title: 'Math Master',
    completed_by: [
      { student_id: 'student-1', student_name: 'Alice Johnson', completed_at: '2024-01-16T15:30:00.000Z', progress: 10 },
      { student_id: 'student-2', student_name: 'Bob Smith', completed_at: '2024-01-17T10:45:00.000Z', progress: 8 },
      { student_id: 'student-3', student_name: 'Charlie Brown', completed_at: null, progress: 6 }
    ]
  },
  {
    quest_id: 'a47ac10b-58cc-4372-a567-0e02b2c3d480',
    quest_title: 'Reading Champion',
    completed_by: [
      { student_id: 'student-1', student_name: 'Alice Johnson', completed_at: '2024-01-21T16:00:00.000Z', progress: 30 },
      { student_id: 'student-4', student_name: 'Diana Prince', completed_at: '2024-01-22T14:20:00.000Z', progress: 35 }
    ]
  }
];

// Add demo data for achievement completions
export const getDemoAchievementCompletions = () => [
  {
    achievement_id: 'b47ac10b-58cc-4372-a567-0e02b2c3d479',
    achievement_name: 'First Steps',
    earned_by: [
      { student_id: 'student-1', student_name: 'Alice Johnson', earned_at: '2024-01-16T09:30:00.000Z' },
      { student_id: 'student-2', student_name: 'Bob Smith', earned_at: '2024-01-17T11:15:00.000Z' },
      { student_id: 'student-3', student_name: 'Charlie Brown', earned_at: '2024-01-18T13:45:00.000Z' },
      { student_id: 'student-4', student_name: 'Diana Prince', earned_at: '2024-01-19T10:20:00.000Z' }
    ]
  },
  {
    achievement_id: 'b47ac10b-58cc-4372-a567-0e02b2c3d480',
    achievement_name: 'Streak Master',
    earned_by: [
      { student_id: 'student-1', student_name: 'Alice Johnson', earned_at: '2024-01-27T18:00:00.000Z' },
      { student_id: 'student-4', student_name: 'Diana Prince', earned_at: '2024-01-29T19:30:00.000Z' }
    ]
  },
  {
    achievement_id: 'b47ac10b-58cc-4372-a567-0e02b2c3d481',
    achievement_name: 'Perfect Score',
    earned_by: [
      { student_id: 'student-1', student_name: 'Alice Johnson', earned_at: '2024-02-02T14:15:00.000Z' }
    ]
  }
];

// Add missing demo data functions
export const getDemoChildName = () => 'Emma';

export const getDemoStudentProgress = () => [
  {
    student_id: 'student-1',
    student_name: 'Alice Johnson',
    email: 'alice@example.com',
    completion_percentage: 85,
    total_time_spent: 1240,
    completed_lessons: 17,
    total_lessons: 20,
    last_activity: '2024-01-20T15:30:00.000Z',
    subjects: [
      {
        subject_name: 'Mathematics',
        completion_percentage: 90,
        lessons_completed: 9,
        total_lessons: 10,
        time_spent: 480
      },
      {
        subject_name: 'English',
        completion_percentage: 80,
        lessons_completed: 8,
        total_lessons: 10,
        time_spent: 760
      }
    ],
    strengths: ['Problem Solving', 'Reading Comprehension'],
    weak_areas: ['Grammar', 'Geometry'],
    test_scores: [
      {
        test_name: 'Math Quiz 1',
        score: 95,
        percentage: 95,
        completed_at: '2024-01-18T14:00:00.000Z'
      }
    ],
    achievements: [
      {
        name: 'First Steps',
        earned_at: '2024-01-16T09:30:00.000Z',
        points: 10
      }
    ]
  }
];

export const getDemoMonitoringOverviewStats = () => ({
  totalStudents: 25,
  avgCompletion: 78,
  totalStudyTime: 1850,
  totalLessonsCompleted: 342,
  totalTests: 12,
  totalCurricula: 8,
  totalQuests: 15,
  totalAchievements: 24
});

export const getDemoQuestData = () => ({
  active: [
    {
      id: 'q1',
      title: 'Math Explorer',
      description: 'Complete 5 algebra problems',
      type: 'daily',
      difficulty: 'intermediate',
      target_value: 5,
      current_value: 3,
      progress: 60,
      expires_at: '2024-01-25T23:59:59.000Z',
      subjects: { name: 'Mathematics' },
      reward: '50 XP + Math Badge'
    },
    {
      id: 'q2',
      title: 'Reading Champion',
      description: 'Read for 20 minutes',
      type: 'daily',
      difficulty: 'basic',
      target_value: 20,
      current_value: 15,
      progress: 75,
      expires_at: '2024-01-25T23:59:59.000Z',
      subjects: { name: 'English' },
      reward: '25 XP + Reader Badge'
    }
  ],
  completed: [
    {
      id: 'q3',
      title: 'Science Explorer',
      description: 'Complete chemistry lab',
      type: 'weekly',
      difficulty: 'hard',
      completed_at: '2024-01-20T16:30:00.000Z',
      subjects: { name: 'Chemistry' },
      reward: '100 XP + Scientist Badge'
    }
  ]
});

export const getDemoSubjectData = () => [
  {
    id: 's1',
    name: 'Mathematics',
    description: 'Algebra, Geometry, and Statistics',
    completion_percentage: 85,
    lessons_completed: 17,
    total_lessons: 20,
    time_spent: 1240,
    last_activity: '2024-01-20T15:30:00.000Z',
    current_grade: 'A-',
    assigned_by: 'school',
    strengths: ['Problem Solving', 'Logic'],
    needs_work: ['Geometry', 'Word Problems'],
    recent_topics: ['Quadratic Equations', 'Linear Functions']
  },
  {
    id: 's2',
    name: 'English Literature',
    description: 'Reading, Writing, and Comprehension',
    completion_percentage: 78,
    lessons_completed: 14,
    total_lessons: 18,
    time_spent: 980,
    last_activity: '2024-01-19T14:20:00.000Z',
    current_grade: 'B+',
    assigned_by: 'parent',
    strengths: ['Reading Comprehension', 'Vocabulary'],
    needs_work: ['Grammar', 'Essay Writing'],
    recent_topics: ['Shakespeare', 'Poetry Analysis']
  }
];

export const getDemoAchievementData = () => ({
  earned: [
    {
      id: 'a1',
      name: 'First Steps',
      description: 'Complete your first lesson',
      type: 'milestone',
      icon: '🎯',
      rarity: 'common',
      earned_at: '2024-01-15T10:00:00.000Z'
    },
    {
      id: 'a2',
      name: 'Math Wizard',
      description: 'Score 100% on 5 math quizzes',
      type: 'mastery',
      icon: '🧙‍♀️',
      rarity: 'rare',
      earned_at: '2024-01-18T16:30:00.000Z'
    }
  ],
  available: [
    {
      id: 'a3',
      name: 'Speed Reader',
      description: 'Read 10 books this month',
      type: 'completion',
      icon: '📚',
      rarity: 'uncommon',
      progress: 6,
      target: 10
    },
    {
      id: 'a4',
      name: 'Science Master',
      description: 'Complete all science experiments',
      type: 'mastery',
      icon: '🔬',
      rarity: 'epic',
      progress: 3,
      target: 8
    }
  ]
});

export const getDemoAnalyticsData = () => ({
  strengths: [
    {
      topic_name: 'Algebraic Equations',
      subjects: { name: 'Mathematics' },
      strength_score: 0.92,
      correct_attempts: 23,
      total_attempts: 25,
      last_practiced: '2024-01-20T15:30:00.000Z',
      improvement_trend: 'improving'
    },
    {
      topic_name: 'Reading Comprehension',
      subjects: { name: 'English Literature' },
      strength_score: 0.88,
      correct_attempts: 22,
      total_attempts: 25,
      last_practiced: '2024-01-19T14:20:00.000Z',
      improvement_trend: 'improving'
    }
  ],
  weaknesses: [
    {
      topic_name: 'Geometry',
      subjects: { name: 'Mathematics' },
      strength_score: 0.45,
      correct_attempts: 9,
      total_attempts: 20,
      last_practiced: '2024-01-18T16:00:00.000Z',
      improvement_trend: 'needs_attention',
      recommended_action: 'Focus on basic geometric principles and practice with visual aids'
    },
    {
      topic_name: 'Grammar Rules',
      subjects: { name: 'English Literature' },
      strength_score: 0.52,
      correct_attempts: 13,
      total_attempts: 25,
      last_practiced: '2024-01-17T13:45:00.000Z',
      improvement_trend: 'declining',
      recommended_action: 'Review grammar fundamentals and practice with interactive exercises'
    }
  ],
  progressOverTime: [
    { date: '2024-01-15', score: 65 },
    { date: '2024-01-16', score: 68 },
    { date: '2024-01-17', score: 72 },
    { date: '2024-01-18', score: 75 },
    { date: '2024-01-19', score: 78 },
    { date: '2024-01-20', score: 82 }
  ]
});

export const getDemoOverallStats = () => ({
  completionPercentage: 82,
  totalTimeSpent: 1240,
  currentStreak: 7,
  lessonsCompleted: 17,
  totalLessons: 20,
  averageSessionTime: 35
});

export const getDemoMonitoringData = () => ({
  studyPatterns: {
    preferredStudyTime: 'Afternoon (2-4 PM)',
    averageSessionLength: 35,
    mostProductiveDays: ['Monday', 'Wednesday', 'Friday'],
    attentionSpan: 'Good (25-30 minutes)'
  },
  recommendations: [
    {
      priority: 'high',
      title: 'Excellent Progress in Math!',
      description: 'Emma has mastered algebraic equations with 92% accuracy. Consider advancing to more complex topics.',
      celebration: true,
      resources: ['Advanced Algebra Course', 'Math Challenge Problems']
    },
    {
      priority: 'medium',
      title: 'Geometry Needs Attention',
      description: 'Emma is struggling with geometric concepts. Visual learning tools might help.',
      resources: ['Geometry Visualizer', 'Shape Recognition Games']
    }
  ],
  alerts: [
    {
      type: 'positive',
      message: 'Completed 5 lessons this week - great consistency!',
      timestamp: '2024-01-20T15:30:00.000Z'
    },
    {
      type: 'attention',
      message: 'Geometry quiz score dropped to 45% - may need extra support',
      timestamp: '2024-01-19T10:15:00.000Z'
    }
  ]
});

export const getDemoRecentActivity = () => [
  {
    type: 'lesson_completed',
    title: 'Completed "Quadratic Equations"',
    timestamp: '2024-01-20T15:30:00.000Z',
    score: 88,
    details: 'Great work on solving complex equations!'
  },
  {
    type: 'quiz_completed',
    title: 'Math Quiz - Algebra Basics',
    timestamp: '2024-01-20T14:15:00.000Z',
    score: 95,
    details: 'Perfect score on variable isolation!'
  },
  {
    type: 'achievement_earned',
    title: 'Earned "Math Wizard" badge',
    timestamp: '2024-01-19T16:30:00.000Z',
    details: 'Achieved 100% on 5 consecutive math quizzes'
  },
  {
    type: 'quest_progress',
    title: 'Math Explorer Quest',
    timestamp: '2024-01-19T14:00:00.000Z',
    progress: 60,
    details: 'Completed 3 out of 5 algebra problems'
  }
];
