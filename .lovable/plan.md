

# Fix: Chat Completion "Unsupported Value" Error

## Problem
The OpenAI API is rejecting requests because `temperature: 0.7` is being sent, which `gpt-5-mini` does not support. Even though the code was edited to remove `temperature`, the **deployed Edge Function is still running the old version** with that parameter.

## Root Cause
The Edge Function deployment did not successfully replace the running version. This can happen due to deployment caching or a stale `deno.lock` file.

## Fix Steps

### 1. Delete and recreate `deno.lock` (if it exists)
Remove any `deno.lock` file that could cause deployment issues with stale cached dependencies.

### 2. Force redeploy `chat-completion`
Redeploy the Edge Function to ensure the updated code (without `temperature`) is live.

### 3. Verify deployment with a test call
Call the function directly using the curl tool to confirm the new version is running and returning streaming responses without errors.

### 4. Add better error forwarding to the frontend
Currently, when OpenAI returns a 400 error, the Edge Function returns the error as JSON -- but the frontend code expects a stream and throws a generic "Failed to get response from AI" error. Update `useMessageHandler.ts` to read the error body and display the actual error message from OpenAI, making future debugging easier.

## Technical Details

**Edge Function (`supabase/functions/chat-completion/index.ts`):**
- Confirmed: code already has `temperature` removed (line 66-70)
- No code changes needed -- just a forced redeploy

**Frontend (`src/hooks/useMessageHandler.ts`):**
- Improve error handling around lines 100-108 to parse JSON error responses from the Edge Function and show the actual error message in the toast notification

**Timeout concern:**
- The 8-second timeout (line 57) may be too short for `gpt-5-mini` streaming. Will increase to 30 seconds to prevent premature aborts.
