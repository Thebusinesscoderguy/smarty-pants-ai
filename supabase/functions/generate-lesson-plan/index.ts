import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { topic, subject, gradeLevel, durationMinutes = 45, language = 'en' } = await req.json();

    if (!topic) {
      return new Response(JSON.stringify({ error: 'Topic is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const langInstruction = language !== 'en' ? `Respond entirely in ${language === 'ar' ? 'Arabic' : language}. ` : '';

    const prompt = `${langInstruction}Create a detailed, structured lesson plan for a ${durationMinutes}-minute class.

Topic: ${topic}
${subject ? `Subject: ${subject}` : ''}
${gradeLevel ? `Grade Level: ${gradeLevel}` : ''}
Duration: ${durationMinutes} minutes

Structure the lesson plan with these sections using markdown headers:

## Learning Objectives
- List 3-5 clear, measurable objectives using Bloom's taxonomy verbs

## Materials Needed
- List all required materials and resources

## Warm-Up Activity (${Math.round(durationMinutes * 0.1)} minutes)
- Engaging opener to activate prior knowledge

## Main Lesson (${Math.round(durationMinutes * 0.5)} minutes)
- Step-by-step instruction with key concepts
- Include examples and explanations

## Practice Activities (${Math.round(durationMinutes * 0.25)} minutes)
- Guided practice exercises
- Independent practice tasks

## Assessment Questions
- 3-5 formative assessment questions to check understanding
- Include a mix of question types

## Homework Assignment
- Meaningful homework that reinforces the lesson
- Include clear instructions and expected outcomes

## Differentiation Notes
- Modifications for struggling learners
- Extensions for advanced learners

Make the plan practical, engaging, and ready to use in a real classroom.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert curriculum designer and experienced teacher. Create detailed, practical lesson plans that are ready to use.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-lesson-plan error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
