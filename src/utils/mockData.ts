
// Mock data for demo purposes
export const mockQuests = {
  active: [
    {
      id: '1',
      title: 'Complete 5 Math Problems',
      description: 'Solve 5 algebra problems to improve your problem-solving skills',
      type: 'daily',
      difficulty: 'basic',
      target_value: 5,
      current_value: 3,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      subjects: { name: 'Mathematics' },
      reward: '50 XP + Math Badge'
    },
    {
      id: '2',
      title: 'Science Reading Challenge',
      description: 'Read 3 science articles and complete comprehension questions',
      type: 'daily',
      difficulty: 'intermediate',
      target_value: 3,
      current_value: 1,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      subjects: { name: 'Science' },
      reward: '75 XP + Science Explorer Badge'
    },
    {
      id: '3',
      title: 'Weekly Writing Goal',
      description: 'Write 500 words across different subjects this week',
      type: 'weekly',
      difficulty: 'hard',
      target_value: 500,
      current_value: 280,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
      subjects: { name: 'English' },
      reward: '200 XP + Writer Badge'
    }
  ],
  completed: [
    {
      id: '4',
      title: 'History Timeline',
      description: 'Create a timeline of major historical events',
      type: 'daily',
      difficulty: 'intermediate',
      target_value: 1,
      current_value: 1,
      completed: true,
      completed_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      subjects: { name: 'History' },
      reward: '100 XP + History Buff Badge'
    }
  ]
};

export const mockSubjects = [
  {
    id: '1',
    name: 'Mathematics',
    description: 'Algebra, Geometry, and Problem Solving',
    completion_percentage: 78,
    lessons_completed: 23,
    total_lessons: 30,
    time_spent: 145,
    current_grade: 'A-',
    assigned_by: 'school',
    last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    strengths: ['Linear Equations', 'Graphing'],
    needs_work: ['Quadratic Functions'],
    recent_topics: ['Systems of Equations', 'Slope-Intercept Form', 'Function Notation']
  },
  {
    id: '2',
    name: 'Science',
    description: 'Biology, Chemistry, and Physics Fundamentals',
    completion_percentage: 65,
    lessons_completed: 18,
    total_lessons: 28,
    time_spent: 98,
    current_grade: 'B+',
    assigned_by: 'school',
    last_activity: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    strengths: ['Cell Biology', 'Chemical Reactions'],
    needs_work: ['Physics Laws', 'Molecular Structure'],
    recent_topics: ['Photosynthesis', 'Periodic Table', 'Newton\'s Laws']
  },
  {
    id: '3',
    name: 'English',
    description: 'Literature, Writing, and Communication Skills',
    completion_percentage: 82,
    lessons_completed: 25,
    total_lessons: 30,
    time_spent: 167,
    current_grade: 'A',
    assigned_by: 'school',
    last_activity: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    strengths: ['Creative Writing', 'Reading Comprehension'],
    needs_work: ['Grammar Rules'],
    recent_topics: ['Shakespeare Analysis', 'Essay Structure', 'Vocabulary Building']
  },
  {
    id: '4',
    name: 'History',
    description: 'World History and Historical Analysis',
    completion_percentage: 71,
    lessons_completed: 20,
    total_lessons: 28,
    time_spent: 112,
    current_grade: 'B+',
    assigned_by: 'school',
    last_activity: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    strengths: ['Ancient Civilizations', 'World Wars'],
    needs_work: ['Economic History'],
    recent_topics: ['Industrial Revolution', 'Cold War', 'Renaissance Period']
  }
];

export const mockAchievements = [
  {
    id: '1',
    name: 'First Steps',
    description: 'Complete your first lesson',
    icon: '🎯',
    earned: true,
    earned_at: '2024-01-15T10:30:00Z',
    type: 'milestone'
  },
  {
    id: '2',
    name: 'Math Wizard',
    description: 'Solve 50 math problems correctly',
    icon: '🧙‍♂️',
    earned: true,
    earned_at: '2024-01-20T14:15:00Z',
    type: 'mastery'
  },
  {
    id: '3',
    name: 'Streak Master',
    description: 'Complete lessons for 7 days in a row',
    icon: '🔥',
    earned: true,
    earned_at: '2024-01-25T09:45:00Z',
    type: 'streak'
  },
  {
    id: '4',
    name: 'Science Explorer',
    description: 'Complete 25 science experiments',
    icon: '🔬',
    earned: false,
    earned_at: null,
    type: 'completion'
  },
  {
    id: '5',
    name: 'Speed Reader',
    description: 'Read 10 articles in under 30 minutes total',
    icon: '📚',
    earned: false,
    earned_at: null,
    type: 'challenge'
  },
  {
    id: '6',
    name: 'Perfect Score',
    description: 'Get 100% on any quiz',
    icon: '⭐',
    earned: false,
    earned_at: null,
    type: 'milestone'
  }
];

// Add missing mock analytics data
export const mockAnalytics = {
  strengths: [
    {
      topic_name: 'Linear Equations',
      strength_score: 0.85,
      subjects: { name: 'Mathematics' }
    },
    {
      topic_name: 'Reading Comprehension',
      strength_score: 0.92,
      subjects: { name: 'English' }
    }
  ],
  weaknesses: [
    {
      topic_name: 'Physics Laws',
      strength_score: 0.35,
      subjects: { name: 'Science' }
    },
    {
      topic_name: 'Economic History',
      strength_score: 0.42,
      subjects: { name: 'History' }
    }
  ],
  improvement_paragraph: "Based on your recent activity, you're showing strong skills in Linear Equations with a strength score of 85% and excellent Reading Comprehension at 92%. To improve, focus on Physics Laws and Economic History where additional practice would be beneficial. Consistent practice and engagement will help you build a solid foundation!"
};

// Add missing mock parent dashboard data - fixed to match StudentData interface
export const mockParentDashboard = {
  student_id: 'demo-student-1',
  student_name: 'Emma Johnson',
  strengths: [
    { topic: 'Linear Equations', score: 85, subject: 'Mathematics' },
    { topic: 'Reading Comprehension', score: 92, subject: 'English' }
  ],
  weaknesses: [
    { topic: 'Physics Laws', score: 35, subject: 'Science' },
    { topic: 'Economic History', score: 42, subject: 'History' }
  ],
  improvement_paragraph: "Emma is making excellent progress with strong performance in Linear Equations (85%) and Reading Comprehension (92%). For continued growth, focus on Physics Laws and Economic History where additional practice would be beneficial. Regular practice and consistent engagement will help strengthen these areas and build confidence."
};

export const mockStudentData = {
  student_id: 'demo-student-1',
  student_name: 'Emma Johnson',
  total_lessons: 116,
  completed_lessons: 86,
  completion_percentage: 74,
  total_time_spent: 522, // minutes
  last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  subjects: mockSubjects,
  strengths: ['Mathematics', 'English'],
  weak_areas: ['Science'],
  weekly_activity: [
    { day: 'Mon', minutes: 45 },
    { day: 'Tue', minutes: 62 },
    { day: 'Wed', minutes: 38 },
    { day: 'Thu', minutes: 71 },
    { day: 'Fri', minutes: 55 },
    { day: 'Sat', minutes: 23 },
    { day: 'Sun', minutes: 41 }
  ],
  performance_trend: [
    { week: 'Week 1', score: 68 },
    { week: 'Week 2', score: 72 },
    { week: 'Week 3', score: 71 },
    { week: 'Week 4', score: 74 }
  ]
};
