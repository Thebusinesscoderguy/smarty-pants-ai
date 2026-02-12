

## Fix: Adaptive Quiz Showing Wrong Answer for Wrong Question

### Problem
When submitting an answer, the following race condition occurs:
1. User submits answer, `feedbackQuestion` is snapshotted
2. `submitAnswer` in the hook immediately advances `currentQuestionIndex`
3. A `useEffect` watching `currentQuestionIndex` fires and **clears** `feedbackQuestion`, `showFeedback`, and `lastResult`
4. `submitAnswer` returns, and `handleSubmitAnswer` tries to set feedback -- but `feedbackQuestion` is already gone
5. The UI falls back to showing `currentQuestion` (which is now the NEXT question), displaying its correct answer prematurely

### Solution
Split "record answer" from "advance to next question" so feedback is never cleared prematurely.

### Changes

**1. `src/hooks/useAdaptiveQuiz.ts`** -- Don't advance `currentQuestionIndex` or fetch the next question inside `submitAnswer`. Instead, add a separate `advanceToNext` function.

- `submitAnswer`: Only records the answer, updates score, performance history, and checks completion. Does NOT change `currentQuestionIndex` or `currentQuestion`.
- New `advanceToNext` function: Increments `currentQuestionIndex`, calculates next difficulty, and fetches the next question. Called from the UI when user clicks "Next Question".

**2. `src/components/quiz/AdaptiveQuizEngine.tsx`** -- Remove the `useEffect` that watches `currentQuestionIndex` (the source of the race condition). Instead:

- `handleSubmitAnswer`: Snapshots `feedbackQuestion`, calls `submitAnswer`, shows feedback. No question advancement happens.
- `handleNextQuestion`: Clears feedback state, then calls `advanceToNext()` to move to the next question.

This cleanly separates the "show feedback" phase from the "load next question" phase, eliminating the race condition entirely.

### Technical Details

```text
BEFORE (broken):
  Submit --> hook advances index --> useEffect clears feedback --> feedback lost

AFTER (fixed):
  Submit --> hook records answer only --> feedback shown safely
  Next   --> UI clears feedback --> hook advances index + fetches next question
```

**File 1: `src/hooks/useAdaptiveQuiz.ts`**
- In `submitAnswer`: Remove lines that update `currentQuestionIndex`, `currentDifficulty`, `currentQuestion`, `isActive`, and the entire "fetch next question" block. Only update `performanceHistory`, `answeredQuestions`, and `score`. Return `{ isCorrect, earnedPoints, isComplete }`.
- Add new `advanceToNext` callback: Takes no arguments. Reads current state, increments `currentQuestionIndex`, calculates next difficulty via `calculateNextDifficulty`, sets `isActive = false` if complete, or fetches the next question if not. Updates `currentQuestion` when the fetch resolves.
- Export `advanceToNext` alongside existing functions.

**File 2: `src/components/quiz/AdaptiveQuizEngine.tsx`**
- Remove the `useEffect` that watches `currentQuestionIndex` (lines 62-68) and the `prevQuestionIndexRef`.
- Destructure `advanceToNext` from `useAdaptiveQuiz()`.
- `handleNextQuestion`: Clear `selectedAnswer`, `showFeedback`, `lastResult`, `feedbackQuestion`, then call `advanceToNext()`.
- No other logic changes needed -- the snapshot mechanism (`feedbackQuestion` / `questionForRender`) stays as-is and will now work correctly since nothing clears it prematurely.

