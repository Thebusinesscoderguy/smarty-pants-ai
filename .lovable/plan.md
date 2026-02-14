

## Remove Custom Instructions from Chat

### Goal
Strip all custom persona/teaching instructions from the chat system, keeping only the factual accuracy guardrail.

### Changes

**1. `src/pages/Chat.tsx`**
- Remove the entire `systemMessage` object that defines the "Teachly AI" persona (Socratic method, teaching style, response structure, etc.)
- Remove the code that prepends `systemMessage` to the conversation history when calling the edge function
- Messages sent to the backend will contain only the raw conversation history

**2. `supabase/functions/chat-completion/index.ts`**
- Keep the existing accuracy instruction: *"CRITICAL: If you encounter any conflicting information or are uncertain about factual accuracy, do NOT present that information to the student. Only provide information you are confident is accurate and consistent. If uncertain, acknowledge your uncertainty rather than presenting potentially incorrect information."*
- Keep the language instruction that appends "Always respond in [language]" when language is not English
- No other system instructions

### Result
The AI will behave as a standard GPT assistant with no forced teaching persona, while still maintaining factual accuracy safeguards and language support.

