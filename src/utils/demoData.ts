
// Demo data for parent dashboard when not authenticated
export const demoParentData = {
  childName: "Emma Johnson",
  childId: "demo-child-123",
  
  // Overall statistics
  overallStats: {
    completionPercentage: 78,
    totalTimeSpent: 2340, // minutes
    lessonsCompleted: 28,
    totalLessons: 36,
    currentStreak: 7,
    longestStreak: 12,
    averageSessionTime: 45,
    lastActivity: "2024-01-20T14:30:00Z"
  },

  // Active and completed quests
  quests: {
    active: [
      {
        id: "quest-1",
        title: "Math Master Challenge",
        description: "Complete 15 algebra problems with 85% accuracy",
        type: "weekly",
        difficulty: "intermediate",
        target_value: 15,
        current_value: 11,
        completed: false,
        expires_at: "2024-01-27T23:59:59Z",
        subjects: { name: "Mathematics" },
        progress: 73,
        reward: "Golden Calculator Badge"
      },
      {
        id: "quest-2", 
        title: "Reading Comprehension Sprint",
        description: "Read and analyze 5 short stories this week",
        type: "weekly",
        difficulty: "basic",
        target_value: 5,
        current_value: 3,
        completed: false,
        expires_at: "2024-01-27T23:59:59Z",
        subjects: { name: "English Literature" },
        progress: 60,
        reward: "Bookworm Achievement"
      },
      {
        id: "quest-3",
        title: "Science Explorer",
        description: "Complete the chemistry lab simulation",
        type: "assignment",
        difficulty: "hard",
        target_value: 1,
        current_value: 0,
        completed: false,
        expires_at: "2024-01-25T23:59:59Z",
        subjects: { name: "Chemistry" },
        progress: 0,
        reward: "Lab Expert Badge"
      }
    ],
    completed: [
      {
        id: "quest-4",
        title: "Grammar Guardian",
        description: "Perfect score on grammar exercises for 3 days",
        type: "daily",
        difficulty: "basic",
        target_value: 3,
        current_value: 3,
        completed: true,
        completed_at: "2024-01-18T16:20:00Z",
        subjects: { name: "English Grammar" },
        progress: 100,
        reward: "Grammar Expert Badge"
      },
      {
        id: "quest-5",
        title: "History Detective",
        description: "Research and present on Ancient Rome",
        type: "project",
        difficulty: "intermediate",
        target_value: 1,
        current_value: 1,
        completed: true,
        completed_at: "2024-01-15T11:45:00Z",
        subjects: { name: "World History" },
        progress: 100,
        reward: "Historian Badge"
      }
    ]
  },

  // Achievements earned and available
  achievements: {
    earned: [
      {
        id: "ach-1",
        name: "First Steps",
        description: "Complete your first lesson",
        icon: "🎯",
        type: "milestone",
        earned: true,
        earned_at: "2024-01-05T09:15:00Z",
        rarity: "common"
      },
      {
        id: "ach-2",
        name: "Study Streak",
        description: "Study for 7 consecutive days",
        icon: "🔥",
        type: "streak",
        earned: true,
        earned_at: "2024-01-12T20:30:00Z",
        rarity: "uncommon"
      },
      {
        id: "ach-3",
        name: "Math Whiz",
        description: "Score 90% or higher on 5 math quizzes",
        icon: "🧮",
        type: "mastery",
        earned: true,
        earned_at: "2024-01-18T14:22:00Z",
        rarity: "rare"
      },
      {
        id: "ach-4",
        name: "Speed Reader",
        description: "Complete reading assignments in record time",
        icon: "📚",
        type: "completion",
        earned: true,
        earned_at: "2024-01-16T10:18:00Z",
        rarity: "uncommon"
      },
      {
        id: "ach-5",
        name: "Perfect Score",
        description: "Get 100% on any quiz",
        icon: "⭐",
        type: "milestone",
        earned: true,
        earned_at: "2024-01-14T15:45:00Z",
        rarity: "rare"
      }
    ],
    available: [
      {
        id: "ach-6",
        name: "Knowledge Seeker",
        description: "Complete 50 lessons across all subjects",
        icon: "🎓",
        type: "milestone",
        earned: false,
        progress: 28,
        target: 50,
        rarity: "epic"
      },
      {
        id: "ach-7",
        name: "Quiz Master",
        description: "Score above 85% on 10 consecutive quizzes",
        icon: "🏆",
        type: "streak",
        earned: false,
        progress: 6,
        target: 10,
        rarity: "legendary"
      },
      {
        id: "ach-8",
        name: "Science Enthusiast",
        description: "Complete all chemistry and physics modules",
        icon: "🔬",
        type: "completion",
        earned: false,
        progress: 3,
        target: 8,
        rarity: "rare"
      }
    ]
  },

  // Subject progress and assignments
  subjects: [
    {
      id: "subj-1",
      name: "Mathematics",
      description: "Algebra, Geometry, and Statistics",
      completion_percentage: 85,
      lessons_completed: 12,
      total_lessons: 14,
      time_spent: 780, // minutes
      assigned_by: "school",
      last_activity: "2024-01-20T14:30:00Z",
      current_grade: "A-",
      strengths: ["Linear Equations", "Basic Statistics"],
      needs_work: ["Quadratic Functions"],
      recent_topics: ["Solving Systems of Equations", "Graphing Linear Functions"]
    },
    {
      id: "subj-2", 
      name: "English Literature",
      description: "Reading comprehension and literary analysis",
      completion_percentage: 72,
      lessons_completed: 8,
      total_lessons: 11,
      time_spent: 520,
      assigned_by: "parent",
      last_activity: "2024-01-19T16:45:00Z",
      current_grade: "B+",
      strengths: ["Character Analysis", "Reading Comprehension"],
      needs_work: ["Essay Writing", "Poetry Analysis"],
      recent_topics: ["Romeo and Juliet Analysis", "Metaphor and Symbolism"]
    },
    {
      id: "subj-3",
      name: "Chemistry", 
      description: "Basic chemistry concepts and lab work",
      completion_percentage: 65,
      lessons_completed: 6,
      total_lessons: 9,
      time_spent: 420,
      assigned_by: "school",
      last_activity: "2024-01-18T13:20:00Z",
      current_grade: "B",
      strengths: ["Periodic Table", "Chemical Bonding"],
      needs_work: ["Balancing Equations", "Reaction Types"],
      recent_topics: ["Ionic vs Covalent Bonds", "Molecular Structure"]
    },
    {
      id: "subj-4",
      name: "World History",
      description: "Ancient civilizations to modern times",
      completion_percentage: 90,
      lessons_completed: 9,
      total_lessons: 10,
      time_spent: 615,
      assigned_by: "self",
      last_activity: "2024-01-17T11:30:00Z",
      current_grade: "A",
      strengths: ["Ancient Rome", "Medieval Period", "Timeline Analysis"],
      needs_work: ["Modern History"],
      recent_topics: ["Fall of Roman Empire", "Renaissance Period"]
    }
  ],

  // Analytics and strengths/weaknesses
  analytics: {
    strengths: [
      {
        id: "str-1",
        topic_name: "Linear Equations",
        strength_score: 0.92,
        total_attempts: 25,
        correct_attempts: 23,
        subjects: { name: "Mathematics" },
        improvement_trend: "stable",
        last_practiced: "2024-01-20T14:30:00Z"
      },
      {
        id: "str-2", 
        topic_name: "Reading Comprehension",
        strength_score: 0.88,
        total_attempts: 18,
        correct_attempts: 16,
        subjects: { name: "English Literature" },
        improvement_trend: "improving",
        last_practiced: "2024-01-19T16:45:00Z"
      },
      {
        id: "str-3",
        topic_name: "Historical Timeline",
        strength_score: 0.95,
        total_attempts: 20,
        correct_attempts: 19,
        subjects: { name: "World History" },
        improvement_trend: "stable",
        last_practiced: "2024-01-17T11:30:00Z"
      },
      {
        id: "str-4",
        topic_name: "Chemical Bonding",
        strength_score: 0.83,
        total_attempts: 15,
        correct_attempts: 12,
        subjects: { name: "Chemistry" },
        improvement_trend: "improving",
        last_practiced: "2024-01-18T13:20:00Z"
      }
    ],
    weaknesses: [
      {
        id: "weak-1",
        topic_name: "Quadratic Functions", 
        strength_score: 0.45,
        total_attempts: 20,
        correct_attempts: 9,
        subjects: { name: "Mathematics" },
        improvement_trend: "needs_attention",
        last_practiced: "2024-01-19T10:15:00Z",
        recommended_action: "Schedule extra practice sessions"
      },
      {
        id: "weak-2",
        topic_name: "Essay Writing Structure",
        strength_score: 0.52,
        total_attempts: 12,
        correct_attempts: 6,
        subjects: { name: "English Literature" },
        improvement_trend: "slowly_improving",
        last_practiced: "2024-01-18T15:20:00Z",
        recommended_action: "Focus on paragraph organization"
      },
      {
        id: "weak-3", 
        topic_name: "Balancing Chemical Equations",
        strength_score: 0.38,
        total_attempts: 22,
        correct_attempts: 8,
        subjects: { name: "Chemistry" },
        improvement_trend: "needs_attention",
        last_practiced: "2024-01-17T14:10:00Z",
        recommended_action: "Review fundamental concepts"
      }
    ],
    progressOverTime: [
      { date: "2024-01-01", score: 65, subject: "Overall" },
      { date: "2024-01-05", score: 68, subject: "Overall" },
      { date: "2024-01-10", score: 72, subject: "Overall" },
      { date: "2024-01-15", score: 75, subject: "Overall" },
      { date: "2024-01-20", score: 78, subject: "Overall" }
    ]
  },

  // Monitoring insights and recommendations
  monitoring: {
    studyPatterns: {
      preferredStudyTime: "After school (3-5 PM)",
      averageSessionLength: 45,
      mostProductiveDays: ["Tuesday", "Wednesday", "Thursday"],
      attentionSpan: "Good - maintains focus for 30-40 minutes",
      breakFrequency: "Every 35 minutes"
    },
    recommendations: [
      {
        type: "academic",
        priority: "high",
        title: "Focus on Quadratic Functions",
        description: "Emma is struggling with quadratic functions in math. Consider scheduling extra practice sessions or tutoring.",
        actionable: true,
        resources: ["Khan Academy Quadratics", "Practice Worksheets", "Video Tutorials"]
      },
      {
        type: "behavioral",
        priority: "medium", 
        title: "Maintain Study Streak",
        description: "Emma has a 7-day study streak! Encourage her to continue this great habit.",
        actionable: false,
        celebration: true
      },
      {
        type: "academic",
        priority: "medium",
        title: "Chemistry Lab Practice",
        description: "More hands-on chemistry practice would help with equation balancing.",
        actionable: true,
        resources: ["Virtual Labs", "Chemistry Simulations"]
      }
    ],
    alerts: [
      {
        type: "positive",
        message: "Emma scored 95% on her latest History quiz!",
        timestamp: "2024-01-20T15:30:00Z"
      },
      {
        type: "neutral",
        message: "Study session completed: 45 minutes of Mathematics",
        timestamp: "2024-01-20T14:30:00Z"
      },
      {
        type: "attention",
        message: "Chemistry assignment due in 2 days",
        timestamp: "2024-01-20T08:00:00Z"
      }
    ]
  },

  // Recent activity feed
  recentActivity: [
    {
      id: "act-1",
      type: "quiz_completed",
      title: "Completed World History Quiz",
      score: 95,
      subject: "World History",
      timestamp: "2024-01-20T15:30:00Z",
      details: "Renaissance Period - 19/20 questions correct"
    },
    {
      id: "act-2", 
      type: "lesson_completed",
      title: "Finished Linear Equations Practice",
      subject: "Mathematics", 
      timestamp: "2024-01-20T14:30:00Z",
      time_spent: 45,
      details: "Solved 12 problems with 85% accuracy"
    },
    {
      id: "act-3",
      type: "achievement_earned",
      title: "Earned 'Math Whiz' Achievement",
      timestamp: "2024-01-18T14:22:00Z",
      details: "Scored 90%+ on 5 consecutive math quizzes"
    },
    {
      id: "act-4",
      type: "quest_progress",
      title: "Progress on Reading Quest",
      subject: "English Literature",
      timestamp: "2024-01-19T16:45:00Z", 
      progress: 60,
      details: "Completed 3 out of 5 required stories"
    }
  ]
};

// Helper functions to get demo data
export const getDemoQuestData = () => demoParentData.quests;
export const getDemoAchievementData = () => demoParentData.achievements;
export const getDemoSubjectData = () => demoParentData.subjects;
export const getDemoAnalyticsData = () => demoParentData.analytics;
export const getDemoMonitoringData = () => demoParentData.monitoring;
export const getDemoOverallStats = () => demoParentData.overallStats;
export const getDemoRecentActivity = () => demoParentData.recentActivity;
export const getDemoChildName = () => demoParentData.childName;
