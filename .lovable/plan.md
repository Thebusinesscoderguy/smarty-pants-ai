

## AI-Generated Chat Titles Based on Conversation Topic

### Problem
Chat sessions in the sidebar are currently titled using the first ~50 characters of the first message (e.g., "interesting"), which is not descriptive. They should instead reflect the overall topic of the conversation.

### Solution
Use the existing `generate-conversation-title` edge function to generate meaningful topic-based titles after the first AI response completes. This function already uses GPT to analyze the conversation and produce a 2-6 word descriptive title like "Photosynthesis Process" or "Calculus Integration Methods".

### Changes

**1. `src/pages/Chat.tsx`**
- After the AI response is saved to the database (around line 366), call the `generate-conversation-title` edge function with the conversation messages
- Update the session title in `chatSessions` state with the AI-generated title
- Only generate a title for new sessions (when it's the first exchange)

**2. `src/components/chat/ChatSidebar.tsx`**
- Same change: replace `generateTitleFromContent` with a call to the `generate-conversation-title` edge function when loading sessions, or store/cache the AI-generated title

### Technical Details

- The `generate-conversation-title` edge function already exists and works -- it takes a `messages` array and returns a `{ title }` response
- The title generation will happen asynchronously after the first AI reply, so it won't slow down the chat
- The function uses `gpt-5-mini` to analyze the first few messages and produce a concise topic title
- For the sidebar's historical sessions, we'll generate titles on load using the stored messages (with caching to avoid re-generating)
- Fallback title remains "Learning Session" if the API call fails

