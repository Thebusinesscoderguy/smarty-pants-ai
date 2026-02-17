

## Fix Study Plan Generation "Could Not Generate Plan" Error

### Root Cause

The edge function works correctly on the backend (logs confirm successful generation in 20-40 seconds). However, the Supabase gateway can return an **HTML error page** (502/504 timeout) instead of JSON when the response takes too long. The Supabase JS client's `functions.invoke()` then fails to parse this as JSON, returns `null` data with an error, and the client shows "Could not generate plan."

A secondary issue: the default plan generates **14 days** with example questions, producing very large AI responses (up to 8192 tokens). This increases the chance of gateway timeouts.

### Changes

#### 1. Reduce Default Plan Size (`supabase/functions/generate-study-plan/index.ts`)

- Change the default from 14 days to **7 days** when the user doesn't specify a number (`const actualDays = planDays ?? 7`). This roughly halves the AI response time and token usage.
- Reduce `max_tokens` from 8192 to 6000 -- still plenty for 7 days with examples, but reduces the chance of hitting gateway limits.

#### 2. Add Response Content-Type Validation (`src/hooks/useStudyPlanGenerator.ts`)

- After receiving the result from `supabase.functions.invoke`, check if the error message or data suggests an HTML response was returned instead of JSON.
- Add a specific, user-friendly error message: "The server took too long to respond. Try a shorter plan (fewer days) or try again."
- Add a retry mechanism: if the first attempt fails with a timeout-like error, automatically retry once before showing the error to the user.

#### 3. Better Error Differentiation in the UI (`src/components/quiz/StudyPlanGenerator.tsx`)

- Remove the duplicate toast on line 225 -- the hook already shows a toast with detailed error info. The "Could not generate plan" toast is redundant and confusing.
- Instead, just log to console when `plan` is null (the hook's toast already informed the user).

### Technical Details

**Edge function change (index.ts, line 261):**
```text
// Before
const actualDays = planDays ?? 14;
// After
const actualDays = planDays ?? 7;
```

**Edge function change (index.ts, line 384):**
```text
// Before
max_tokens: 8192,
// After  
max_tokens: 6000,
```

**Hook change (useStudyPlanGenerator.ts) -- add HTML response detection:**
```text
// After getting result from supabase.functions.invoke:
if (error) {
  const errorMsg = error?.message || '';
  // Detect HTML responses from gateway timeouts
  if (errorMsg.includes('<!') || errorMsg.includes('<html') || errorMsg.includes('FunctionsFetchError')) {
    throw new Error('The server took too long to respond. Please try again.');
  }
  // ... existing error handling
}
```

**StudyPlanGenerator.tsx change (line 224-226) -- remove duplicate toast:**
```text
// Before
} else {
  toast({ title: t('studyPlan.couldNotGenerate'), ... });
}
// After
} else {
  console.warn('Study plan generation returned null (error toast already shown by hook)');
}
```

### Expected Result
- Faster generation (7 days default instead of 14) reduces gateway timeout risk
- When timeouts do occur, users get a clear, actionable error message instead of the generic "Could not generate plan"
- No more duplicate error toasts confusing users
