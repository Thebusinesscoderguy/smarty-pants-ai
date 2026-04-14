

# Build Remaining 10 Growth Features

## Overview
Implementing all remaining features from the growth strategy, excluding social proof and SEO blog.

---

## Feature List

### 1. AI "Explain Like I'm 5" (ELI5) Mode
Add a "Simplify" button to lesson content, quiz explanations, and chat responses that re-explains concepts in ultra-simple language with analogies.

- New edge function `eli5-explain/index.ts` — takes text, returns simplified version targeted at young learners
- Add "Explain Simply" button to `LessonViewer.tsx`, `QuizResults.tsx`, and `MessageBubble.tsx`
- Uses existing `explain-text` edge function pattern but with a dedicated ELI5 prompt

### 2. Curriculum-Aligned Question Bank
Pre-built question sets organized by curriculum, grade, and subject that teachers can browse and assign.

- New DB table `question_bank` (curriculum, grade, subject, question_text, answer, difficulty, tags)
- New component `src/components/admin/QuestionBankBrowser.tsx` — filterable list with "Add to Assessment" action
- Seed initial questions via edge function using AI generation per curriculum/subject
- Add "Question Bank" tab to SchoolAdmin

### 3. AI Study Buddy with Memory
A persistent AI companion that remembers past conversations, student strengths/weaknesses, and adapts over time.

- New DB table `study_buddy_memory` (user_id, memory_key, memory_value, updated_at) to store learning context
- Modify `chat-completion` edge function to inject student's learning analytics and past memory into system prompt
- New component `src/components/chat/StudyBuddyMode.tsx` — toggle in chat that activates personalized mode
- Pulls from `learning_analytics` table to inject strengths/weaknesses into context

### 4. Video Lesson Support
Embed YouTube/external video URLs in lessons with timestamped notes and comprehension checks.

- Add `video_url` column to lessons table (or use existing content field with type detection)
- Update `LessonViewer.tsx` to render embedded YouTube player when lesson type is 'video'
- Add video URL field to lesson content generation in the study plan flow
- Use `react-player` or native iframe for YouTube embeds

### 5. Parent-Teacher Messaging
In-app messaging between parents and teachers within the school system.

- New DB tables:
  - `parent_teacher_messages` (sender_id, receiver_id, school_id, student_id, subject, message, read_at, created_at)
  - `parent_teacher_threads` (parent_id, teacher_id, student_id, school_id, last_message_at)
- New component `src/components/admin/ParentTeacherMessaging.tsx` — thread-based inbox for teachers
- New component `src/components/dashboards/ParentMessages.tsx` — parent-side messaging UI
- Add "Messages" tab to SchoolAdmin and parent dashboard
- RLS: participants can only see their own threads

### 6. Referral Program
Users share a referral link → referred user signs up → both get rewards (extended free tier or XP bonus).

- New DB table `referrals` (referrer_id, referred_email, referred_id, status, reward_claimed, created_at)
- Add `referral_code` column to profiles table
- New component `src/components/gamification/ReferralProgram.tsx` — shows unique link, tracks referrals, displays rewards
- Modify `handle_new_user()` DB function to check for referral code in signup metadata
- Add referral section to Settings page

### 7. Free Tier / Usage Limits
Enforce generation limits for logged-in free users (not just guests).

- New DB table `user_usage` (user_id, feature, count, period_start, period_end)
- New edge function `check-usage-limit/index.ts` — validates before allowing generation
- Modify quiz/study-plan/presentation generators to check limits server-side
- Update `useGuestUsage.ts` → `useUsageLimits.ts` to handle both guest and free-tier limits
- Free tier: 5 quizzes/month, 3 study plans/month, 2 presentations/month

### 8. Mobile-Responsive Polish
Audit and fix layout issues across all key pages for mobile viewports.

- Fix Header.tsx mobile menu (hamburger nav with slide-out drawer)
- Fix SchoolAdmin tabs to use horizontal scroll or dropdown on mobile
- Fix QuizGenerator tabs spacing on small screens
- Ensure chat interface is full-height on mobile without overflow
- Fix Index.tsx hero section text sizing and input layout on mobile
- Test and fix StudentDashboard card grid for single-column on mobile

### 9. Onboarding Flow Cleanup
Streamline the first-time user experience after signup.

- Add welcome tour overlay component `src/components/onboarding/WelcomeTour.tsx` using tooltips pointing at key UI elements
- Track onboarding completion in profiles table (`onboarding_completed` boolean)
- Simplify role selection UI with clearer visual cards
- Auto-redirect new users to quiz generator after onboarding (the main value prop)

### 10. Enhanced Loading & Error States
Add consistent loading skeletons and error boundaries across the app.

- Create `src/components/ui/page-skeleton.tsx` — reusable skeleton layouts for dashboard, chat, quiz pages
- Add React Error Boundary wrapper component `src/components/ErrorBoundary.tsx`
- Wrap all route components with error boundary
- Replace spinner-only loading with skeleton UI in StudentDashboard, SchoolAdmin, Chat
- Add retry buttons on error states

---

## Database Migrations Required

```text
Tables to create:
├── question_bank (curriculum, grade, subject, question data)
├── study_buddy_memory (user_id, memory_key, memory_value)
├── parent_teacher_messages (sender, receiver, message, read status)
├── parent_teacher_threads (parent, teacher, student linkage)
├── referrals (referrer, referred, status, rewards)
└── user_usage (user_id, feature, count, period tracking)

Columns to add:
├── profiles.referral_code (TEXT, unique)
└── profiles.onboarding_completed (BOOLEAN, default false)
```

## Edge Functions to Create
- `eli5-explain` — Simplify text for young learners
- `check-usage-limit` — Server-side usage validation

## NPM Packages to Install
- `react-player` — For video lesson embeds
- `react-joyride` — For onboarding tour tooltips

## Implementation Order
1. Mobile-responsive polish + Loading/Error states (foundation)
2. ELI5 mode + Video lessons (quick content wins)
3. Free tier limits + Referral program (growth mechanics)
4. Study buddy + Question bank (deeper learning features)
5. Parent-teacher messaging + Onboarding cleanup (engagement)

## Files Summary
~15 new components, 2 new edge functions, 6 new DB tables, 2 column additions, 2 npm packages. Approximately 8-10 implementation rounds.

