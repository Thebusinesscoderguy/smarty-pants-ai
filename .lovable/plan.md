## Goal
Simplify the exam settings UI by removing the explicit "Lock question order" switch and making order behavior automatic.

## Changes

### 1. Remove "Lock question order" UI toggle
In `src/components/admin/AssessmentManagement.tsx` (around line 538), remove the `<label>` containing the "Lock question order" switch.

### 2. Update randomize toggle behavior
In `src/components/admin/AssessmentManagement.tsx` (around line 526), keep the "Randomize questions" switch but simplify its `onCheckedChange` to just toggle `randomization`. The `orderLocked` value will now be derived logically:
- `orderLocked = !randomization` (implicit, computed where needed)
- Randomize OFF → questions are in fixed (locked) order
- Randomize ON → questions are shuffled

### 3. Update any `orderLocked` references
Replace direct usage of `examSettings.orderLocked` with `!examSettings.randomization` wherever the locked state is consumed in the same component or passed down, ensuring saved assessments serialize the correct behavior.

## Result
One fewer toggle for teachers. Question order is locked unless they explicitly enable randomization.