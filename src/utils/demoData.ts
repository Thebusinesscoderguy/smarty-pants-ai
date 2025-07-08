
// Demo data for parent dashboard when not authenticated
export const demoParentData = {
  childName: "Emma Johnson",
  childId: "demo-child-123",
  
  // Overall statistics
  overallStats: {
    completionPercentage: 89,
    totalTimeSpent: 4680, // minutes (78 hours)
    lessonsCompleted: 156,
    totalLessons: 180,
    currentStreak: 23,
    longestStreak: 31,
    averageSessionTime: 52,
    lastActivity: "2024-01-20T16:45:00Z"
  },

  // Active and completed quests
  quests: {
    active: [
      {
        id: "quest-1",
        title: "Math Master Challenge",
        description: "Complete 20 algebra problems with 90% accuracy",
        type: "weekly",
        difficulty: "intermediate",
        target_value: 20,
        current_value: 18,
        completed: false,
        expires_at: "2024-01-27T23:59:59Z",
        subjects: { name: "Mathematics" },
        progress: 90,
        reward: "Golden Calculator Badge"
      },
      {
        id: "quest-2", 
        title: "Reading Comprehension Sprint",
        description: "Read and analyze 8 short stories this week",
        type: "weekly",
        difficulty: "basic",
        target_value: 8,
        current_value: 6,
        completed: false,
        expires_at: "2024-01-27T23:59:59Z",
        subjects: { name: "English Literature" },
        progress: 75,
        reward: "Bookworm Achievement"
      },
      {
        id: "quest-3",
        title: "Science Explorer",
        description: "Complete 3 chemistry lab simulations",
        type: "assignment",
        difficulty: "hard",
        target_value: 3,
        current_value: 2,
        completed: false,
        expires_at: "2024-01-25T23:59:59Z",
        subjects: { name: "Chemistry" },
        progress: 67,
        reward: "Lab Expert Badge"
      },
      {
        id: "quest-4",
        title: "Physics Fundamentals",
        description: "Master motion and forces concepts",
        type: "weekly",
        difficulty: "intermediate",
        target_value: 12,
        current_value: 8,
        completed: false,
        expires_at: "2024-01-28T23:59:59Z",
        subjects: { name: "Physics" },
        progress: 67,
        reward: "Newton's Apple Badge"
      },
      {
        id: "quest-5",
        title: "Creative Writing Workshop",
        description: "Write and submit 3 creative essays",
        type: "project",
        difficulty: "advanced",
        target_value: 3,
        current_value: 1,
        completed: false,
        expires_at: "2024-02-01T23:59:59Z",
        subjects: { name: "English Creative Writing" },
        progress: 33,
        reward: "Literary Artist Badge"
      },
      {
        id: "quest-6",
        title: "Daily Quiz Streak",
        description: "Complete daily quizzes for 14 days straight",
        type: "daily",
        difficulty: "basic",
        target_value: 14,
        current_value: 9,
        completed: false,
        expires_at: "2024-01-26T23:59:59Z",
        subjects: { name: "General Knowledge" },
        progress: 64,
        reward: "Quiz Champion Badge"
      }
    ],
    completed: [
      {
        id: "quest-7",
        title: "Grammar Guardian",
        description: "Perfect score on grammar exercises for 7 days",
        type: "daily",
        difficulty: "basic",
        target_value: 7,
        current_value: 7,
        completed: true,
        completed_at: "2024-01-18T16:20:00Z",
        subjects: { name: "English Grammar" },
        progress: 100,
        reward: "Grammar Expert Badge"
      },
      {
        id: "quest-8",
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
      },
      {
        id: "quest-9",
        title: "Algebra Champion",
        description: "Solve 50 linear equations with 95% accuracy",
        type: "weekly",
        difficulty: "intermediate",
        target_value: 50,
        current_value: 50,
        completed: true,
        completed_at: "2024-01-14T14:30:00Z",
        subjects: { name: "Mathematics" },
        progress: 100,
        reward: "Equation Master Badge"
      },
      {
        id: "quest-10",
        title: "Science Fair Prep",
        description: "Complete all chemistry prerequisites",
        type: "project",
        difficulty: "hard",
        target_value: 8,
        current_value: 8,
        completed: true,
        completed_at: "2024-01-12T10:15:00Z",
        subjects: { name: "Chemistry" },
        progress: 100,
        reward: "Scientist Badge"
      },
      {
        id: "quest-11",
        title: "Reading Marathon",
        description: "Read 10 books this month",
        type: "monthly",
        difficulty: "advanced",
        target_value: 10,
        current_value: 10,
        completed: true,
        completed_at: "2024-01-10T18:45:00Z",
        subjects: { name: "English Literature" },
        progress: 100,
        reward: "Literature Master Badge"
      },
      {
        id: "quest-12",
        title: "Geometry Genius",
        description: "Master all triangle and circle theorems",
        type: "weekly",
        difficulty: "advanced",
        target_value: 15,
        current_value: 15,
        completed: true,
        completed_at: "2024-01-08T13:20:00Z",
        subjects: { name: "Mathematics" },
        progress: 100,
        reward: "Geometry Expert Badge"
      },
      {
        id: "quest-13",
        title: "Essay Excellence",
        description: "Write 5 analytical essays with A grades",
        type: "weekly",
        difficulty: "advanced",
        target_value: 5,
        current_value: 5,
        completed: true,
        completed_at: "2024-01-06T16:30:00Z",
        subjects: { name: "English Literature" },
        progress: 100,
        reward: "Essay Master Badge"
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
        earned_at: "2023-12-05T09:15:00Z",
        rarity: "common"
      },
      {
        id: "ach-2",
        name: "Study Streak",
        description: "Study for 7 consecutive days",
        icon: "🔥",
        type: "streak",
        earned: true,
        earned_at: "2023-12-12T20:30:00Z",
        rarity: "uncommon"
      },
      {
        id: "ach-3",
        name: "Math Whiz",
        description: "Score 90% or higher on 10 math quizzes",
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
        earned_at: "2023-12-14T15:45:00Z",
        rarity: "rare"
      },
      {
        id: "ach-6",
        name: "Marathon Learner",
        description: "Study for 30 consecutive days",
        icon: "🏃‍♀️",
        type: "streak",
        earned: true,
        earned_at: "2024-01-15T19:00:00Z",
        rarity: "epic"
      },
      {
        id: "ach-7",
        name: "Quiz Master",
        description: "Score above 85% on 15 consecutive quizzes",
        icon: "🏆",
        type: "streak",
        earned: true,
        earned_at: "2024-01-10T16:30:00Z",
        rarity: "legendary"
      },
      {
        id: "ach-8",
        name: "Science Explorer",
        description: "Complete all basic science modules",
        icon: "🔬",
        type: "completion",
        earned: true,
        earned_at: "2024-01-08T11:45:00Z",
        rarity: "rare"
      },
      {
        id: "ach-9",
        name: "Grammar Guardian",
        description: "Perfect grammar scores for 2 weeks",
        icon: "✍️",
        type: "mastery",
        earned: true,
        earned_at: "2024-01-05T14:20:00Z",
        rarity: "uncommon"
      },
      {
        id: "ach-10",
        name: "History Buff",
        description: "Master 3 historical periods",
        icon: "🏛️",
        type: "mastery",
        earned: true,
        earned_at: "2024-01-03T16:15:00Z",
        rarity: "rare"
      },
      {
        id: "ach-11",
        name: "Problem Solver",
        description: "Solve 100 math problems correctly",
        icon: "🧩",
        type: "milestone",
        earned: true,
        earned_at: "2023-12-28T13:30:00Z",
        rarity: "uncommon"
      },
      {
        id: "ach-12",
        name: "Creative Writer",
        description: "Write 10 creative pieces",
        icon: "🖋️",
        type: "completion",
        earned: true,
        earned_at: "2023-12-25T10:45:00Z",
        rarity: "rare"
      },
      {
        id: "ach-13",
        name: "Early Bird",
        description: "Study before 7 AM for 10 days",
        icon: "🌅",
        type: "streak",
        earned: true,
        earned_at: "2023-12-20T06:30:00Z",
        rarity: "uncommon"
      },
      {
        id: "ach-14",
        name: "Night Owl",
        description: "Study after 9 PM for 15 days",
        icon: "🦉",
        type: "streak",
        earned: true,
        earned_at: "2023-12-18T21:15:00Z",
        rarity: "uncommon"
      },
      {
        id: "ach-15",
        name: "Team Player",
        description: "Participate in 5 group projects",
        icon: "🤝",
        type: "collaboration",
        earned: true,
        earned_at: "2023-12-15T14:00:00Z",
        rarity: "rare"
      }
    ],
    available: [
      {
        id: "ach-16",
        name: "Knowledge Seeker",
        description: "Complete 200 lessons across all subjects",
        icon: "🎓",
        type: "milestone",
        earned: false,
        progress: 156,
        target: 200,
        rarity: "epic"
      },
      {
        id: "ach-17",
        name: "Ultimate Scholar",
        description: "Maintain 90%+ average across all subjects",
        icon: "🎖️",
        type: "mastery",
        earned: false,
        progress: 87,
        target: 90,
        rarity: "legendary"
      },
      {
        id: "ach-18",
        name: "Advanced Scientist",
        description: "Complete all advanced chemistry and physics modules",
        icon: "⚗️",
        type: "completion",
        earned: false,
        progress: 12,
        target: 20,
        rarity: "epic"
      },
      {
        id: "ach-19",
        name: "Literary Genius",
        description: "Write 25 high-quality essays",
        icon: "📝",
        type: "completion",
        earned: false,
        progress: 18,
        target: 25,
        rarity: "rare"
      },
      {
        id: "ach-20",
        name: "Math Olympian",
        description: "Solve 500 advanced math problems",
        icon: "🥇",
        type: "milestone",
        earned: false,
        progress: 342,
        target: 500,
        rarity: "legendary"
      },
      {
        id: "ach-21",
        name: "Global Citizen",
        description: "Master world geography and cultures",
        icon: "🌍",
        type: "mastery",
        earned: false,
        progress: 6,
        target: 10,
        rarity: "rare"
      }
    ]
  },

  // Subject progress and assignments
  subjects: [
    {
      id: "subj-1",
      name: "Mathematics",
      description: "Algebra, Geometry, Calculus, and Statistics",
      completion_percentage: 94,
      lessons_completed: 47,
      total_lessons: 50,
      time_spent: 1580, // minutes
      assigned_by: "school",
      last_activity: "2024-01-20T14:30:00Z",
      current_grade: "A+",
      strengths: ["Linear Equations", "Quadratic Functions", "Statistics", "Geometry Proofs"],
      needs_work: ["Advanced Calculus", "Complex Numbers"],
      recent_topics: ["Derivatives and Integrals", "Trigonometric Identities", "Matrix Operations"]
    },
    {
      id: "subj-2", 
      name: "English Literature",
      description: "Reading comprehension, literary analysis, and creative writing",
      completion_percentage: 88,
      lessons_completed: 35,
      total_lessons: 40,
      time_spent: 1240,
      assigned_by: "parent",
      last_activity: "2024-01-19T16:45:00Z",
      current_grade: "A",
      strengths: ["Character Analysis", "Reading Comprehension", "Essay Structure", "Creative Writing"],
      needs_work: ["Poetry Analysis", "Historical Context"],
      recent_topics: ["Shakespeare's Tragedies", "Modernist Literature", "Persuasive Essays"]
    },
    {
      id: "subj-3",
      name: "Chemistry", 
      description: "General chemistry, organic chemistry, and lab techniques",
      completion_percentage: 82,
      lessons_completed: 28,
      total_lessons: 34,
      time_spent: 920,
      assigned_by: "school",
      last_activity: "2024-01-18T13:20:00Z",
      current_grade: "A-",
      strengths: ["Periodic Table", "Chemical Bonding", "Stoichiometry", "Lab Safety"],
      needs_work: ["Organic Reactions", "Thermodynamics"],
      recent_topics: ["Redox Reactions", "Acid-Base Chemistry", "Chemical Kinetics"]
    },
    {
      id: "subj-4",
      name: "World History",
      description: "Ancient civilizations to modern global events",
      completion_percentage: 96,
      lessons_completed: 38,
      total_lessons: 40,
      time_spent: 1120,
      assigned_by: "self",
      last_activity: "2024-01-17T11:30:00Z",
      current_grade: "A+",
      strengths: ["Ancient Rome", "Medieval Period", "Timeline Analysis", "World Wars", "Cultural Movements"],
      needs_work: ["Contemporary Politics"],
      recent_topics: ["Cold War Era", "Decolonization", "Digital Revolution"]
    },
    {
      id: "subj-5",
      name: "Physics",
      description: "Mechanics, electricity, magnetism, and modern physics",
      completion_percentage: 76,
      lessons_completed: 23,
      total_lessons: 30,
      time_spent: 890,
      assigned_by: "school",
      last_activity: "2024-01-16T15:20:00Z",
      current_grade: "B+",
      strengths: ["Newton's Laws", "Energy Conservation", "Wave Properties"],
      needs_work: ["Electromagnetic Fields", "Quantum Mechanics"],
      recent_topics: ["Electric Circuits", "Magnetic Fields", "Light and Optics"]
    },
    {
      id: "subj-6",
      name: "Biology",
      description: "Cell biology, genetics, ecology, and human anatomy",
      completion_percentage: 91,
      lessons_completed: 32,
      total_lessons: 35,
      time_spent: 1050,
      assigned_by: "school",
      last_activity: "2024-01-15T12:10:00Z",
      current_grade: "A",
      strengths: ["Cell Structure", "Genetics", "Ecosystem Dynamics", "Human Systems"],
      needs_work: ["Molecular Biology", "Evolution"],
      recent_topics: ["DNA Replication", "Natural Selection", "Biodiversity"]
    },
    {
      id: "subj-7",
      name: "Computer Science",
      description: "Programming, algorithms, and computational thinking",
      completion_percentage: 67,
      lessons_completed: 20,
      total_lessons: 30,
      time_spent: 780,
      assigned_by: "self",
      last_activity: "2024-01-14T18:40:00Z",
      current_grade: "B+",
      strengths: ["Python Basics", "Problem Solving", "Data Structures"],
      needs_work: ["Algorithm Complexity", "Object-Oriented Programming"],
      recent_topics: ["Sorting Algorithms", "Recursion", "Web Development"]
    },
    {
      id: "subj-8",
      name: "Spanish",
      description: "Spanish language learning and cultural studies",
      completion_percentage: 85,
      lessons_completed: 42,
      total_lessons: 50,
      time_spent: 960,
      assigned_by: "parent",
      last_activity: "2024-01-13T17:25:00Z",
      current_grade: "A-",
      strengths: ["Vocabulary", "Reading Comprehension", "Cultural Knowledge"],
      needs_work: ["Speaking Fluency", "Advanced Grammar"],
      recent_topics: ["Subjunctive Mood", "Latin American Literature", "Business Spanish"]
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
      { date: "2023-12-01", score: 62, subject: "Overall" },
      { date: "2023-12-05", score: 65, subject: "Overall" },
      { date: "2023-12-10", score: 68, subject: "Overall" },
      { date: "2023-12-15", score: 71, subject: "Overall" },
      { date: "2023-12-20", score: 74, subject: "Overall" },
      { date: "2023-12-25", score: 76, subject: "Overall" },
      { date: "2023-12-30", score: 78, subject: "Overall" },
      { date: "2024-01-01", score: 80, subject: "Overall" },
      { date: "2024-01-05", score: 82, subject: "Overall" },
      { date: "2024-01-10", score: 85, subject: "Overall" },
      { date: "2024-01-15", score: 87, subject: "Overall" },
      { date: "2024-01-20", score: 89, subject: "Overall" },
      { date: "2023-12-01", score: 58, subject: "Mathematics" },
      { date: "2023-12-15", score: 72, subject: "Mathematics" },
      { date: "2024-01-01", score: 85, subject: "Mathematics" },
      { date: "2024-01-15", score: 92, subject: "Mathematics" },
      { date: "2024-01-20", score: 94, subject: "Mathematics" },
      { date: "2023-12-01", score: 64, subject: "English Literature" },
      { date: "2023-12-15", score: 70, subject: "English Literature" },
      { date: "2024-01-01", score: 78, subject: "English Literature" },
      { date: "2024-01-15", score: 84, subject: "English Literature" },
      { date: "2024-01-20", score: 88, subject: "English Literature" }
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
      title: "Completed Advanced Calculus Quiz",
      score: 98,
      subject: "Mathematics",
      timestamp: "2024-01-20T16:45:00Z",
      details: "Derivatives and Integrals - 49/50 questions correct"
    },
    {
      id: "act-2",
      type: "quest_completed",
      title: "Completed Math Master Challenge",
      subject: "Mathematics",
      timestamp: "2024-01-20T15:30:00Z",
      details: "Solved 20/20 algebra problems with 95% accuracy"
    },
    {
      id: "act-3", 
      type: "lesson_completed",
      title: "Finished Shakespeare Analysis",
      subject: "English Literature", 
      timestamp: "2024-01-20T14:20:00Z",
      time_spent: 52,
      details: "Analyzed themes in Hamlet with detailed essay"
    },
    {
      id: "act-4",
      type: "achievement_earned",
      title: "Earned 'Quiz Master' Achievement",
      timestamp: "2024-01-19T18:45:00Z",
      details: "Scored 85%+ on 15 consecutive quizzes"
    },
    {
      id: "act-5",
      type: "lab_completed",
      title: "Chemistry Lab: Acid-Base Titration",
      subject: "Chemistry",
      timestamp: "2024-01-19T16:30:00Z",
      score: 92,
      details: "Successfully completed titration with accurate calculations"
    },
    {
      id: "act-6",
      type: "project_submitted",
      title: "World War II Research Project",
      subject: "World History",
      timestamp: "2024-01-19T14:15:00Z",
      details: "15-page research paper on Pacific Theater campaigns"
    },
    {
      id: "act-7",
      type: "quiz_completed",
      title: "Physics: Electromagnetic Fields",
      score: 87,
      subject: "Physics",
      timestamp: "2024-01-19T11:20:00Z",
      details: "Magnetic field calculations - 26/30 questions correct"
    },
    {
      id: "act-8",
      type: "lesson_completed",
      title: "DNA Replication Mechanisms",
      subject: "Biology",
      timestamp: "2024-01-18T17:40:00Z",
      time_spent: 48,
      details: "Studied molecular processes with interactive simulations"
    },
    {
      id: "act-9",
      type: "programming_exercise",
      title: "Python Sorting Algorithms",
      subject: "Computer Science",
      timestamp: "2024-01-18T15:55:00Z",
      details: "Implemented quicksort and mergesort with efficiency analysis"
    },
    {
      id: "act-10",
      type: "language_practice",
      title: "Spanish Conversation Practice",
      subject: "Spanish",
      timestamp: "2024-01-18T13:30:00Z",
      score: 89,
      details: "30-minute conversation about travel and culture"
    },
    {
      id: "act-11",
      type: "achievement_earned",
      title: "Earned 'Marathon Learner' Achievement",
      timestamp: "2024-01-18T12:00:00Z",
      details: "Studied for 30 consecutive days"
    },
    {
      id: "act-12",
      type: "quest_progress",
      title: "Progress on Reading Quest",
      subject: "English Literature",
      timestamp: "2024-01-17T19:25:00Z", 
      progress: 75,
      details: "Completed 6 out of 8 required short stories"
    },
    {
      id: "act-13",
      type: "test_completed",
      title: "Midterm: Organic Chemistry",
      score: 91,
      subject: "Chemistry",
      timestamp: "2024-01-17T16:10:00Z",
      details: "Comprehensive exam covering reaction mechanisms"
    },
    {
      id: "act-14",
      type: "creative_writing",
      title: "Short Story: 'The Time Traveler'",
      subject: "English Literature",
      timestamp: "2024-01-17T14:45:00Z",
      details: "1,500-word science fiction story with character development"
    },
    {
      id: "act-15",
      type: "lesson_completed",
      title: "Advanced Geometry Proofs",
      subject: "Mathematics",
      timestamp: "2024-01-17T12:30:00Z",
      time_spent: 55,
      details: "Mastered triangle congruence and similarity proofs"
    },
    {
      id: "act-16",
      type: "quiz_completed",
      title: "World Geography Challenge",
      score: 96,
      subject: "World History",
      timestamp: "2024-01-16T18:20:00Z",
      details: "Countries, capitals, and cultural landmarks - 48/50 correct"
    },
    {
      id: "act-17",
      type: "lab_completed",
      title: "Physics: Wave Interference",
      subject: "Physics",
      timestamp: "2024-01-16T15:45:00Z",
      score: 94,
      details: "Demonstrated constructive and destructive interference patterns"
    },
    {
      id: "act-18",
      type: "achievement_earned",
      title: "Earned 'Science Explorer' Achievement",
      timestamp: "2024-01-16T14:30:00Z",
      details: "Completed all basic science modules"
    }
  ]
};

// Demo AI Student Summaries
export const demoAISummaries = [
  {
    id: 'ai-summary-1',
    student_id: 'student-1',
    student_name: 'Emma Johnson',
    summary_text: 'Emma demonstrates exceptional analytical thinking and consistently excels in mathematical concepts across all difficulty levels. She shows particular strength in advanced algebra, calculus, and statistical analysis, often completing complex problems ahead of schedule with remarkable 98% accuracy. Her logical approach to problem-solving, attention to detail, and ability to connect abstract concepts make her a standout performer in quantitative subjects. Her recent work in derivatives and integrals shows mastery beyond grade level.\n\nTo further enhance her learning journey, Emma could benefit from acceleration into advanced placement mathematics and early introduction to university-level concepts. Consider enrolling her in competitive mathematics programs, advanced computer science courses focusing on algorithms, and research opportunities in data science. Her exceptional mathematical foundation makes her an ideal candidate for STEM leadership roles and peer tutoring programs that would develop both her technical and interpersonal skills.',
    strengths: ['Advanced Calculus', 'Statistical Analysis', 'Problem Solving', 'Mathematical Proofs', 'Logical Reasoning'],
    weaknesses: ['Advanced Poetry Analysis', 'Art History'],
    improvement_metrics: {
      overall_trend: 'exceptional_growth',
      focus_areas: ['University-Level Mathematics', 'Research Methods', 'Leadership Development'],
      recommended_actions: ['Enroll in AP Calculus BC', 'Join mathematics competition team', 'Consider early college enrollment', 'Peer tutoring opportunities']
    },
    generated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ai-summary-2',
    student_id: 'student-2',
    student_name: 'Marcus Chen',
    summary_text: 'Marcus demonstrates exceptional scientific aptitude with particular excellence in biology, chemistry, and laboratory techniques. His methodical approach to experiments, accurate data collection, and ability to draw meaningful conclusions from complex scientific phenomena showcase advanced analytical thinking. Recent work in DNA replication and chemical kinetics demonstrates mastery of sophisticated concepts typically reserved for advanced students. His 94% average in laboratory work reflects both technical skill and deep conceptual understanding.\n\nMarcus would benefit from enrichment opportunities in advanced scientific research and early exposure to university-level laboratory experiences. Consider facilitating mentorship with local research institutions, enrollment in summer science programs, and opportunities to participate in regional science fairs. His strong foundation in experimental design and data analysis makes him an excellent candidate for independent research projects that could lead to publication opportunities.',
    strengths: ['Experimental Design', 'Molecular Biology', 'Chemical Analysis', 'Data Interpretation', 'Laboratory Safety'],
    weaknesses: ['Advanced Calculus Applications', 'Historical Context in Literature'],
    improvement_metrics: {
      overall_trend: 'accelerating',
      focus_areas: ['Research Methodology', 'Advanced Laboratory Techniques', 'Scientific Communication'],
      recommended_actions: ['Research mentorship program', 'University lab visits', 'Science fair participation', 'Advanced chemistry track']
    },
    generated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ai-summary-3',
    student_id: 'student-3',
    student_name: 'Sophia Rodriguez',
    summary_text: 'Sophia exhibits exceptional literary and communication abilities, consistently producing sophisticated analyses and creative works that demonstrate advanced critical thinking skills. Her recent essay on Shakespeare\'s tragic heroes showcased university-level insight into character development and thematic complexity. She excels in both analytical and creative writing, with her latest short story receiving recognition for its innovative narrative structure and emotional depth. Her presentation skills and ability to engage audiences make her a natural leader in group discussions.\n\nTo maximize her considerable potential, Sophia should be considered for advanced placement literature courses and creative writing programs with publication opportunities. Her analytical strengths could be enhanced through debate team participation and advanced rhetoric courses. Consider pairing her literary skills with interdisciplinary projects that incorporate historical research and cultural analysis, which could lead to scholarship opportunities in humanities programs.',
    strengths: ['Literary Analysis', 'Creative Writing', 'Public Speaking', 'Critical Thinking', 'Cultural Studies'],
    weaknesses: ['Advanced Mathematical Modeling', 'Scientific Research Methods'],
    improvement_metrics: {
      overall_trend: 'outstanding_progress',
      focus_areas: ['Advanced Literary Theory', 'Publication Opportunities', 'Leadership Development'],
      recommended_actions: ['AP Literature enrollment', 'Literary magazine editor', 'Debate team captain', 'Writing competition participation']
    },
    generated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ai-summary-4',
    student_id: 'student-4',
    student_name: 'Alex Thompson',
    summary_text: 'Alex demonstrates remarkable versatility across multiple disciplines with particular strength in technology integration and problem-solving. His programming abilities have advanced rapidly, showing mastery of multiple languages and algorithm design that exceeds grade-level expectations. Recent projects in web development and data analysis showcase both technical proficiency and creative application of computational thinking. His ability to bridge technical concepts with practical applications makes him a valuable collaborator in group projects.\n\nAlex would benefit from advanced computer science opportunities including internship programs with local tech companies and participation in programming competitions. His interest in both technology and creative applications suggests potential for game development or digital media projects. Consider advanced placement computer science courses and opportunities to mentor younger students in coding, which would develop both his technical leadership and communication skills.',
    strengths: ['Programming', 'Algorithm Design', 'Web Development', 'Creative Problem Solving', 'Technology Integration'],
    weaknesses: ['Classical Literature Interpretation', 'Historical Essay Writing'],
    improvement_metrics: {
      overall_trend: 'rapid_advancement',
      focus_areas: ['Advanced Programming Concepts', 'Software Engineering', 'Project Management'],
      recommended_actions: ['Tech internship opportunities', 'Coding competition participation', 'Open source contributions', 'Peer mentoring in CS']
    },
    generated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ai-summary-5',
    student_id: 'student-5',
    student_name: 'Maria Gonzalez',
    summary_text: 'Maria excels in multilingual communication and cultural studies, demonstrating exceptional aptitude for language acquisition and cross-cultural analysis. Her Spanish proficiency has reached near-native levels, and her recent work analyzing Latin American literature shows sophisticated understanding of cultural contexts and historical influences. She consistently bridges her language skills with academic content, producing bilingual presentations that showcase deep cultural knowledge and linguistic precision.\n\nMaria would benefit from advanced language programs including dual enrollment in college-level linguistics courses and opportunities for cultural exchange programs. Her strength in languages combined with her interest in global cultures makes her an ideal candidate for international studies programs and translation opportunities. Consider leadership roles in multicultural student organizations and opportunities to assist other students with language learning.',
    strengths: ['Multilingual Communication', 'Cultural Analysis', 'Translation Skills', 'Global Awareness', 'Cross-Cultural Competency'],
    weaknesses: ['Advanced Mathematics Applications', 'Scientific Research Methods'],
    improvement_metrics: {
      overall_trend: 'consistent_excellence',
      focus_areas: ['Advanced Linguistics', 'International Relations', 'Cultural Leadership'],
      recommended_actions: ['Study abroad programs', 'Translation certification', 'Multicultural club leadership', 'College dual enrollment']
    },
    generated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Helper functions to get demo data
export const getDemoQuestData = () => demoParentData.quests;
export const getDemoAchievementData = () => demoParentData.achievements;
export const getDemoSubjectData = () => demoParentData.subjects;
export const getDemoAnalyticsData = () => demoParentData.analytics;
export const getDemoMonitoringData = () => demoParentData.monitoring;
export const getDemoRecentActivity = () => demoParentData.recentActivity;
export const getDemoAISummaries = () => demoAISummaries;
export const getDemoChildName = () => demoParentData.childName;

// Demo student progress data for monitoring dashboard
export const getDemoStudentProgress = () => [
  {
    student_id: 'student-1',
    student_name: 'Emma Johnson',
    email: 'emma.johnson@school.edu',
    completion_percentage: 89,
    total_time_spent: 4680, // 78 hours in minutes
    completed_lessons: 156,
    total_lessons: 180,
    last_activity: '2024-01-20T16:45:00Z',
    subjects: [
      { subject_name: 'Mathematics', completion_percentage: 94, lessons_completed: 47, total_lessons: 50, time_spent: 1580 },
      { subject_name: 'English Literature', completion_percentage: 88, lessons_completed: 35, total_lessons: 40, time_spent: 1240 },
      { subject_name: 'Chemistry', completion_percentage: 82, lessons_completed: 28, total_lessons: 34, time_spent: 920 },
      { subject_name: 'World History', completion_percentage: 96, lessons_completed: 38, total_lessons: 40, time_spent: 1120 }
    ],
    strengths: ['Linear Equations', 'Reading Comprehension', 'Historical Timeline', 'Chemical Bonding'],
    weak_areas: ['Advanced Calculus', 'Poetry Analysis'],
    test_scores: [
      { test_name: 'Algebra Assessment', score: 94, percentage: 94, completed_at: '2024-01-18T14:30:00Z' },
      { test_name: 'Literature Analysis', score: 88, percentage: 88, completed_at: '2024-01-17T10:15:00Z' }
    ],
    achievements: [
      { name: 'Math Champion', earned_at: '2024-01-15T12:00:00Z', points: 50 },
      { name: 'Dedicated Learner', earned_at: '2024-01-10T09:30:00Z', points: 25 }
    ]
  },
  {
    student_id: 'student-2',
    student_name: 'Marcus Chen',
    email: 'marcus.chen@school.edu',
    completion_percentage: 92,
    total_time_spent: 3840, // 64 hours in minutes
    completed_lessons: 138,
    total_lessons: 150,
    last_activity: '2024-01-19T15:20:00Z',
    subjects: [
      { subject_name: 'Biology', completion_percentage: 91, lessons_completed: 32, total_lessons: 35, time_spent: 1050 },
      { subject_name: 'Chemistry', completion_percentage: 89, lessons_completed: 30, total_lessons: 34, time_spent: 980 },
      { subject_name: 'Physics', completion_percentage: 85, lessons_completed: 26, total_lessons: 30, time_spent: 890 },
      { subject_name: 'Mathematics', completion_percentage: 93, lessons_completed: 28, total_lessons: 30, time_spent: 920 }
    ],
    strengths: ['Experimental Design', 'Molecular Biology', 'Problem Solving'],
    weak_areas: ['Advanced Calculus Applications', 'Literary Analysis'],
    test_scores: [
      { test_name: 'Biology Midterm', score: 91, percentage: 91, completed_at: '2024-01-16T11:00:00Z' },
      { test_name: 'Chemistry Lab Practical', score: 94, percentage: 94, completed_at: '2024-01-14T13:45:00Z' }
    ],
    achievements: [
      { name: 'Science Explorer', earned_at: '2024-01-12T14:20:00Z', points: 40 },
      { name: 'Lab Safety Expert', earned_at: '2024-01-08T16:10:00Z', points: 30 }
    ]
  },
  {
    student_id: 'student-3',
    student_name: 'Sophia Rodriguez',
    email: 'sophia.rodriguez@school.edu',
    completion_percentage: 95,
    total_time_spent: 4200, // 70 hours in minutes
    completed_lessons: 171,
    total_lessons: 180,
    last_activity: '2024-01-20T14:30:00Z',
    subjects: [
      { subject_name: 'English Literature', completion_percentage: 96, lessons_completed: 48, total_lessons: 50, time_spent: 1440 },
      { subject_name: 'World History', completion_percentage: 94, lessons_completed: 47, total_lessons: 50, time_spent: 1320 },
      { subject_name: 'Spanish', completion_percentage: 92, lessons_completed: 46, total_lessons: 50, time_spent: 1200 },
      { subject_name: 'Art History', completion_percentage: 88, lessons_completed: 30, total_lessons: 30, time_spent: 240 }
    ],
    strengths: ['Literary Analysis', 'Creative Writing', 'Cultural Studies', 'Public Speaking'],
    weak_areas: ['Mathematical Modeling', 'Scientific Research'],
    test_scores: [
      { test_name: 'Shakespeare Analysis', score: 96, percentage: 96, completed_at: '2024-01-17T09:30:00Z' },
      { test_name: 'Spanish Oral Exam', score: 92, percentage: 92, completed_at: '2024-01-15T11:15:00Z' }
    ],
    achievements: [
      { name: 'Literary Scholar', earned_at: '2024-01-14T10:45:00Z', points: 45 },
      { name: 'Cultural Ambassador', earned_at: '2024-01-11T13:20:00Z', points: 35 }
    ]
  },
  {
    student_id: 'student-4',
    student_name: 'Alex Thompson',
    email: 'alex.thompson@school.edu',
    completion_percentage: 87,
    total_time_spent: 3600, // 60 hours in minutes
    completed_lessons: 131,
    total_lessons: 150,
    last_activity: '2024-01-19T12:15:00Z',
    subjects: [
      { subject_name: 'Computer Science', completion_percentage: 95, lessons_completed: 29, total_lessons: 30, time_spent: 1200 },
      { subject_name: 'Mathematics', completion_percentage: 91, lessons_completed: 46, total_lessons: 50, time_spent: 1380 },
      { subject_name: 'Physics', completion_percentage: 84, lessons_completed: 34, total_lessons: 40, time_spent: 960 },
      { subject_name: 'English Literature', completion_percentage: 78, lessons_completed: 22, total_lessons: 30, time_spent: 60 }
    ],
    strengths: ['Programming', 'Algorithm Design', 'Web Development', 'Problem Solving'],
    weak_areas: ['Classical Literature', 'Historical Analysis'],
    test_scores: [
      { test_name: 'Programming Project', score: 98, percentage: 98, completed_at: '2024-01-18T16:00:00Z' },
      { test_name: 'Calculus Quiz', score: 89, percentage: 89, completed_at: '2024-01-16T14:20:00Z' }
    ],
    achievements: [
      { name: 'Code Master', earned_at: '2024-01-13T15:30:00Z', points: 50 },
      { name: 'Tech Innovator', earned_at: '2024-01-09T17:45:00Z', points: 40 }
    ]
  },
  {
    student_id: 'student-5',
    student_name: 'Maria Gonzalez',
    email: 'maria.gonzalez@school.edu',
    completion_percentage: 90,
    total_time_spent: 3960, // 66 hours in minutes
    completed_lessons: 144,
    total_lessons: 160,
    last_activity: '2024-01-18T13:45:00Z',
    subjects: [
      { subject_name: 'Spanish', completion_percentage: 98, lessons_completed: 49, total_lessons: 50, time_spent: 1440 },
      { subject_name: 'French', completion_percentage: 92, lessons_completed: 37, total_lessons: 40, time_spent: 1200 },
      { subject_name: 'Cultural Studies', completion_percentage: 89, lessons_completed: 32, total_lessons: 35, time_spent: 960 },
      { subject_name: 'English Literature', completion_percentage: 85, lessons_completed: 26, total_lessons: 35, time_spent: 360 }
    ],
    strengths: ['Multilingual Communication', 'Cultural Analysis', 'Translation Skills'],
    weak_areas: ['Advanced Mathematics', 'Scientific Research'],
    test_scores: [
      { test_name: 'Spanish Literature', score: 95, percentage: 95, completed_at: '2024-01-17T10:30:00Z' },
      { test_name: 'Cultural Analysis Essay', score: 92, percentage: 92, completed_at: '2024-01-15T15:00:00Z' }
    ],
    achievements: [
      { name: 'Polyglot', earned_at: '2024-01-16T12:15:00Z', points: 55 },
      { name: 'Global Citizen', earned_at: '2024-01-12T14:30:00Z', points: 40 }
    ]
  }
];

export const getDemoMonitoringOverviewStats = () => ({
  totalStudents: 5,
  avgCompletion: 91,
  totalStudyTime: 333, // Total hours across all students
  totalLessonsCompleted: 740,
  totalTests: 12,
  totalCurricula: 8,
  totalQuests: 15,
  totalAchievements: 23
});

// For the parent dashboard
export const getDemoOverallStats = () => demoParentData.overallStats;

export const demoStudentClassifications = [
  {
    id: 'class-1',
    student_id: 'demo-student-1',
    classification_tag: 'High Achiever',
    assigned_automatically: true,
    assigned_by: 'demo-admin-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Emma Johnson'
  },
  {
    id: 'class-2', 
    student_id: 'demo-student-1',
    classification_tag: 'STEM Excellence',
    assigned_automatically: true,
    assigned_by: 'demo-admin-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Emma Johnson'
  },
  {
    id: 'class-3',
    student_id: 'demo-student-1',
    classification_tag: 'Advanced Mathematics',
    assigned_automatically: false,
    assigned_by: 'demo-admin-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Emma Johnson'
  },
  {
    id: 'class-4',
    student_id: 'demo-student-2', 
    classification_tag: 'Science Excellence',
    assigned_automatically: true,
    assigned_by: 'demo-admin-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Marcus Chen'
  },
  {
    id: 'class-5',
    student_id: 'demo-student-2',
    classification_tag: 'Laboratory Skills',
    assigned_automatically: true,
    assigned_by: 'demo-admin-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Marcus Chen'
  },
  {
    id: 'class-6',
    student_id: 'demo-student-3',
    classification_tag: 'Literary Excellence',
    assigned_automatically: true,
    assigned_by: 'demo-admin-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Sophia Rodriguez'
  },
  {
    id: 'class-7',
    student_id: 'demo-student-3',
    classification_tag: 'Creative Writing',
    assigned_automatically: false,
    assigned_by: 'demo-admin-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Sophia Rodriguez'
  },
  {
    id: 'class-8',
    student_id: 'demo-student-4',
    classification_tag: 'Technology Leader',
    assigned_automatically: true,
    assigned_by: 'demo-admin-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Alex Thompson'
  },
  {
    id: 'class-9',
    student_id: 'demo-student-4',
    classification_tag: 'Programming Prodigy',
    assigned_automatically: true,
    assigned_by: 'demo-admin-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Alex Thompson'
  },
  {
    id: 'class-10',
    student_id: 'demo-student-5',
    classification_tag: 'Multilingual Excellence',
    assigned_automatically: true,
    assigned_by: 'demo-admin-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Maria Gonzalez'
  },
  {
    id: 'class-11',
    student_id: 'demo-student-5',
    classification_tag: 'Cultural Ambassador',
    assigned_automatically: false,
    assigned_by: 'demo-admin-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Maria Gonzalez'
  },
  {
    id: 'class-12',
    student_id: 'demo-student-6',
    classification_tag: 'Needs Support',
    assigned_automatically: true,
    assigned_by: 'demo-admin-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Jordan Lee'
  },
  {
    id: 'class-13',
    student_id: 'demo-student-7',
    classification_tag: 'Well-Rounded',
    assigned_automatically: true,
    assigned_by: 'demo-admin-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Taylor Kim'
  },
  {
    id: 'class-14',
    student_id: 'demo-student-8',
    classification_tag: 'Arts Excellence',
    assigned_automatically: true,
    assigned_by: 'demo-admin-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student_name: 'Casey Williams'
  }
];

export const demoContentAssignments = [
  {
    id: 'assign-1',
    content_type: 'test' as const,
    content_id: 'test-1',
    content_title: 'Advanced Calculus Assessment',
    assignment_type: 'classification' as const,
    classification_tag: 'Advanced Mathematics',
    student_count: 3,
    assigned_by: 'demo-admin',
    created_at: new Date().toISOString(),
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true
  },
  {
    id: 'assign-2',
    content_type: 'quest' as const,
    content_id: 'quest-1', 
    content_title: 'Math Master Challenge',
    assignment_type: 'classification' as const,
    classification_tag: 'High Achiever',
    student_count: 8,
    assigned_by: 'demo-admin',
    created_at: new Date().toISOString(),
    is_active: true
  },
  {
    id: 'assign-3',
    content_type: 'curriculum' as const,
    content_id: 'curr-1',
    content_title: 'Advanced Chemistry Research Methods',
    assignment_type: 'classification' as const,
    classification_tag: 'Science Excellence',
    student_count: 6,
    assigned_by: 'demo-admin',
    created_at: new Date().toISOString(),
    is_active: true
  },
  {
    id: 'assign-4',
    content_type: 'test' as const,
    content_id: 'test-2',
    content_title: 'Creative Writing Portfolio Review',
    assignment_type: 'classification' as const,
    classification_tag: 'Literary Excellence',
    student_count: 4,
    assigned_by: 'demo-admin',
    created_at: new Date().toISOString(),
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true
  },
  {
    id: 'assign-5',
    content_type: 'quest' as const,
    content_id: 'quest-2',
    content_title: 'Programming Competition Prep',
    assignment_type: 'classification' as const,
    classification_tag: 'Technology Leader',
    student_count: 5,
    assigned_by: 'demo-admin',
    created_at: new Date().toISOString(),
    is_active: true
  },
  {
    id: 'assign-6',
    content_type: 'curriculum' as const,
    content_id: 'curr-2',
    content_title: 'Multilingual Literature Analysis',
    assignment_type: 'classification' as const,
    classification_tag: 'Multilingual Excellence',
    student_count: 3,
    assigned_by: 'demo-admin',
    created_at: new Date().toISOString(),
    is_active: true
  },
  {
    id: 'assign-7',
    content_type: 'test' as const,
    content_id: 'test-3',
    content_title: 'Basic Algebra Support Quiz',
    assignment_type: 'classification' as const,
    classification_tag: 'Needs Support',
    student_count: 7,
    assigned_by: 'demo-admin',
    created_at: new Date().toISOString(),
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true
  },
  {
    id: 'assign-8',
    content_type: 'quest' as const,
    content_id: 'quest-3',
    content_title: 'Laboratory Excellence Challenge',
    assignment_type: 'classification' as const,
    classification_tag: 'Laboratory Skills',
    student_count: 4,
    assigned_by: 'demo-admin',
    created_at: new Date().toISOString(),
    is_active: true
  },
  {
    id: 'assign-9',
    content_type: 'curriculum' as const,
    content_id: 'curr-3',
    content_title: 'Interdisciplinary Arts Program',
    assignment_type: 'classification' as const,
    classification_tag: 'Arts Excellence',
    student_count: 6,
    assigned_by: 'demo-admin',
    created_at: new Date().toISOString(),
    is_active: true
  },
  {
    id: 'assign-10',
    content_type: 'achievement' as const,
    content_id: 'ach-1',
    content_title: 'STEM Leadership Badge',
    assignment_type: 'classification' as const,
    classification_tag: 'STEM Excellence',
    student_count: 9,
    assigned_by: 'demo-admin',
    created_at: new Date().toISOString(),
    is_active: true
  }
];

// Additional demo data exports
export const getDemoClassifications = () => demoStudentClassifications;
export const getDemoContentAssignments = () => demoContentAssignments;
