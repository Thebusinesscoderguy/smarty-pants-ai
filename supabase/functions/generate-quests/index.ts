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
    const { subject, gradeLevel, difficulty, questType, count } = await req.json();

    console.log('Generating quests with params:', { subject, gradeLevel, difficulty, questType, count });

    const systemPrompt = `You are an expert educational quest designer. Create engaging, achievable quests for students that align with educational standards and gamification best practices. Each quest should be clear, measurable, and motivating.`;

    const userPrompt = `Generate ${count || 3} ${questType || 'daily'} quests for ${gradeLevel || 'middle school'} students in ${subject || 'general education'}. 
Difficulty level: ${difficulty || 'intermediate'}

Requirements:
- Each quest should have a clear, actionable title
- Descriptions should be motivating and specific
- Target values should be realistic (1-10 for daily, 5-20 for weekly)
- Include variety in quest types (completion, practice, mastery, etc.)

Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Quest title here",
    "description": "Detailed description of what students need to do",
    "type": "${questType || 'daily'}",
    "difficulty": "${difficulty || 'intermediate'}",
    "target_value": 5,
    "requirements": {
      "trigger_type": "lesson_completed"
    }
  }
]

Important: 
- title: max 60 characters, engaging and clear
- description: max 150 characters, specific and motivating
- target_value: realistic number based on quest type
- requirements.trigger_type can be: "lesson_completed", "quiz_completed", "test_completed", "interaction"`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', JSON.stringify(data, null, 2));
    
    const content = data.choices[0].message.content;
    console.log('Generated content:', content);

    let quests;
    try {
      const parsed = JSON.parse(content);
      // Handle both array and object with array property
      quests = Array.isArray(parsed) ? parsed : (parsed.quests || []);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI-generated quests');
    }

    if (!Array.isArray(quests) || quests.length === 0) {
      throw new Error('No quests were generated');
    }

    console.log('Successfully generated quests:', quests);

    return new Response(JSON.stringify({ quests }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in generate-quests function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate quests',
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
