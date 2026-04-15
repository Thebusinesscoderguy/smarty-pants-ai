

# UI Polish Plan — Consistent Orange/White Theme

## Problems Found

1. **Hardcoded dark-mode colors**: `HomeworkList.tsx` and `ProgressDisplay.tsx` use `text-white`, `bg-white/10`, `border-white/20`, `text-gray-300`, `text-gray-400` instead of semantic tokens (`text-foreground`, `bg-card`, `text-muted-foreground`). These break in light mode.

2. **Inconsistent card styling**: Some components use `bg-white/10 border-white/20` (dark-only), others use proper `bg-card border-border`. Need uniformity with `rounded-2xl` and subtle `hover:shadow-lg` transitions.

3. **Missing transitions**: `QuestionBankBrowser`, `ParentTeacherMessaging`, `ReferralProgram` cards lack hover/transition effects that exist on Index page cards.

4. **Skeleton polish**: `page-skeleton.tsx` skeletons are functional but lack the `rounded-2xl` border radius used across the app.

5. **WelcomeTour**: Uses raw `react-joyride` with no Teachly-themed styling (orange accent, rounded tooltips).

6. **ELI5 toggle styling**: The ELI5 button in `MessageBubble.tsx` is tiny and easy to miss — needs a slightly more prominent visual treatment.

7. **StudyBuddyMode**: The toggle pill looks flat — needs a subtle border and better active state.

8. **HomeworkManagement admin table**: Uses standard table with no hover rows or visual polish.

9. **Error boundary**: Functional but plain — could use the card treatment with rounded corners and a subtle background.

---

## Changes

### 1. Fix HomeworkList.tsx — Replace hardcoded colors with semantic tokens
- `bg-white/10` → `bg-card`, `border-white/20` → `border-border`
- `text-white` → `text-foreground`, `text-white/60` → `text-muted-foreground`
- `bg-white/5` → `bg-muted/50`, `border-white/10` → `border-border`
- Update gradient to `from-primary/10 to-primary/5 border-primary/20`

### 2. Fix ProgressDisplay.tsx — Same semantic token migration
- Replace all `text-white`, `text-gray-300/400`, `bg-white/10` with theme tokens
- Use `text-primary` instead of `text-blue-500` / `text-green-500` for icon colors (or keep green for quests as accent)

### 3. Polish ReferralProgram.tsx
- Add `rounded-2xl` to card, add `hover:shadow-lg transition-all duration-300`

### 4. Polish QuestionBankBrowser.tsx
- Add `rounded-2xl` to question cards, add `hover:shadow-md transition-all duration-300`
- Add subtle hover lift (`hover:-translate-y-0.5`)

### 5. Polish ParentTeacherMessaging.tsx
- Add `rounded-2xl` to cards
- Add smooth transition on thread selection
- Thread buttons get `transition-all duration-200`

### 6. Polish page-skeleton.tsx
- Update skeleton border radius to `rounded-2xl`

### 7. Style WelcomeTour.tsx
- Add Joyride `styles` prop with orange primary color, rounded tooltips, matching fonts

### 8. Polish StudyBuddyMode.tsx
- Add `border border-border` and active state: `bg-primary/10 border-primary/30` when enabled

### 9. Polish ErrorBoundary.tsx
- Wrap in `Card` with `rounded-2xl`, add subtle `bg-muted/30` background

### 10. Polish MessageBubble ELI5 button
- Add `text-primary` color to the lightbulb icon, subtle `hover:bg-primary/10` background

---

## Files Modified (~10 files, all cosmetic)
- `src/components/student/HomeworkList.tsx`
- `src/components/gamification/ProgressDisplay.tsx`
- `src/components/gamification/ReferralProgram.tsx`
- `src/components/admin/QuestionBankBrowser.tsx`
- `src/components/admin/ParentTeacherMessaging.tsx`
- `src/components/ui/page-skeleton.tsx`
- `src/components/onboarding/WelcomeTour.tsx`
- `src/components/chat/StudyBuddyMode.tsx`
- `src/components/ErrorBoundary.tsx`
- `src/components/chat/MessageBubble.tsx`

No new dependencies. No DB changes. Pure styling pass.

