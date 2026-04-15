

# Add Student Dashboard Page

## Overview
Enhance the existing `StudentDashboard` component to prominently display three key sections: assigned homework, upcoming quizzes (from school assessments), and recent school news. Also wire `/dashboard` route to render the `StudentDashboard` instead of the current empty `<div />`.

## Current State
- `StudentDashboard.tsx` exists with stats, quick actions, weekly progress, homework list, and active quests
- `HomeworkList` component already fetches and displays homework from `homework_assignments` table
- `NewsFeed` component already renders school news posts
- `/dashboard` route currently renders an empty `<div />`
- No component currently shows upcoming assigned quizzes for students

## Plan

### 1. Fix the `/dashboard` route
- In `App.tsx`, replace `<div />` with `<StudentDashboard />` (import it)

### 2. Add "Upcoming Quizzes" section to StudentDashboard
- Query `content_assignments` table where `content_type = 'quiz'` and `assignment_type` matches the student (individual, classification, or all), joined with `quizzes` for title/description
- Also check `homework_assignments` with `assignment_type = 'quiz'` for teacher-assigned quizzes
- Display as cards with title, due date, and a "Take Quiz" button

### 3. Add "Recent News" section to StudentDashboard
- Embed the existing `NewsFeed` component (already handles RLS-based filtering for students)
- Show the 5 most recent posts in a compact format below homework

### 4. Reorganize the dashboard layout
- Reorder sections: Stats grid → Quick Actions → Homework → Upcoming Quizzes → Recent News → Active Quests
- Use the project's existing card styling with `bg-card border-border` semantic tokens (not hardcoded dark colors)
- Apply RTL support via `useLanguage`

## Technical Details

**Files to modify:**
- `src/App.tsx` — wire `/dashboard` to `StudentDashboard`
- `src/components/dashboards/StudentDashboard.tsx` — add upcoming quizzes query, embed `NewsFeed`, fix color tokens

**No database changes needed** — all required tables (`homework_assignments`, `content_assignments`, `school_news`) and RLS policies already exist.

