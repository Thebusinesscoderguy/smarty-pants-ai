import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    const { lessonTitle, lessonContent, conversationHistory, userMessage, conversationDepth } = await req.json();

    // Create system prompt for AI tutor using Socratic method
    const systemPrompt = `You are an expert AI tutor using the Socratic method to teach "${lessonTitle}".

LESSON CONTEXT:
${lessonContent}

CRITICAL ACCURACY REQUIREMENT:
If you encounter any conflicting information or are uncertain about the factual accuracy of any concept, do NOT present that information to the student. Only discuss concepts you are confident are accurate and consistent. If uncertain, acknowledge your uncertainty rather than presenting potentially incorrect information.

TEACHING PRINCIPLES:
1. Use guided questioning - never just give answers directly
2. Ask probing questions to check understanding before moving forward
3. Build on student responses with follow-up questions
4. Encourage critical thinking and self-discovery
5. Adapt difficulty based on student responses
6. Keep responses conversational and encouraging
7. When student shows understanding, introduce new related concepts
8. Use real-world examples and analogies when helpful

CONVERSATION STAGE: ${conversationDepth < 3 ? 'Early - Focus on basics and prior knowledge' : conversationDepth < 6 ? 'Middle - Explore concepts deeper' : 'Advanced - Apply knowledge and synthesize'}

GUIDELINES:
- Ask 1-2 thoughtful questions per response
- Keep responses under 150 words
- Be encouraging and patient
- Check understanding before introducing new concepts
- If student struggles, break down concepts into smaller parts
- If student excels, challenge them with more complex applications
- After significant learning progress, acknowledge it and suggest they can complete the lesson

Remember: Your goal is to guide discovery, not lecture. Let the student construct their own understanding through your questions.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
    ];

    console.log('Sending request to OpenAI with messages:', messages.length);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: messages,
        max_completion_tokens: 300,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    // Return the streaming response
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain',
      },
    });

  } catch (error: any) {
    console.error('Error in ai-tutor function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'AI tutor processing failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});