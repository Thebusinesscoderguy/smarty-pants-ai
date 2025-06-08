
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, difficulty = 'medium', questionCount = 5, conversationHistory } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create context from conversation history if provided
    let context = '';
    if (conversationHistory && conversationHistory.length > 0) {
      context = conversationHistory
        .map((msg: any) => `${msg.role}: ${msg.content}`)
        .join('\n');
    }

    const prompt = `Create a ${difficulty} difficulty quiz about "${topic}" with ${questionCount} questions.
    ${context ? `Base the questions on this conversation context:\n${context}\n\n` : ''}
    
    Generate questions in this exact JSON format:
    {
      "title": "Quiz about [topic]",
      "description": "Brief description of the quiz",
      "questions": [
        {
          "question": "Question text",
          "type": "multiple_choice",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct_answer": "Option A",
          "explanation": "Why this answer is correct"
        }
      ]
    }
    
    Mix question types: multiple_choice, true_false, and short_answer.
    For true_false questions, options should be ["True", "False"].
    For short_answer questions, omit the options field.
    Make sure all questions are educational and test understanding of the topic.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert educator creating quiz questions. Always respond with valid JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const quizContent = data.choices[0].message.content;
    
    let quizData;
    try {
      quizData = JSON.parse(quizContent);
    } catch (parseError) {
      console.error('Failed to parse quiz JSON:', quizContent);
      throw new Error('Failed to generate valid quiz format');
    }

    return new Response(JSON.stringify(quizData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-quiz function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
