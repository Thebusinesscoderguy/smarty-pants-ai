

## Upgrade Presentation Quality to Match Grade Level

### Problem
The current prompt is too generic -- it just says "create a presentation for Grade X students" without specifying what academic depth, vocabulary, or curriculum standards to target. A Grade 12 presentation ends up reading like a Grade 6 one.

### Changes

**File: `supabase/functions/generate-presentation/index.ts`**

1. **Upgrade the model** from `google/gemini-2.5-flash` to `google/gemini-2.5-pro` for higher quality reasoning and content generation.

2. **Rewrite the prompt** to include grade-specific depth instructions:
   - Define explicit academic expectations per grade band (e.g., Grades 1-3: simple vocabulary, analogies; Grades 7-9: introduce technical terminology, cause-effect; Grades 10-12: advanced analysis, critical thinking, academic language; College/Professional: research-level depth, citations, domain jargon).
   - Instruct the AI to match vocabulary complexity, sentence structure, and conceptual depth to the specific grade level.
   - Require each bullet point to be a full, substantive explanation (2-3 sentences minimum) rather than a shallow one-liner.
   - Ask for real data, dates, figures, and named examples where applicable instead of vague generalities.

3. **Enhance the system prompt** from a simple "return JSON" instruction to one that emphasizes academic rigor and grade-appropriate depth.

4. **Raise temperature slightly** to `0.8` for richer, more varied content.

### Technical Details

The updated prompt structure will look like:

```text
System: You are a curriculum specialist who creates grade-appropriate 
educational content. Match vocabulary, depth, and complexity precisely 
to the student's grade level. Return only valid JSON.

User prompt additions:
- Grade-band depth mapping (elementary/middle/high/college)
- "Each bullet must be 2-3 detailed sentences with specific facts, 
   figures, or named examples. Avoid vague or surface-level statements."
- "Use vocabulary and sentence complexity appropriate for {gradeLevel}."
- "Content should align with standard curriculum expectations for 
   this grade level."
```

### Expected Result
- A Grade 3 presentation on "The Solar System" will use simple words and fun facts
- A Grade 11 presentation on "The Solar System" will cover Kepler's laws, orbital mechanics, and comparative planetology with proper terminology
