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
    difficulty: 'medium',
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
    difficulty: 'easy',
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
