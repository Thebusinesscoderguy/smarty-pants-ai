import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inputData, inputType, gradeLevel, region, days, maxDailyMinutes } = await req.json();
    
    const planDays = typeof days === 'number' && days > 0 ? Math.min(30, Math.max(1, days)) : undefined;
    const perDayLimit = typeof maxDailyMinutes === 'number' && maxDailyMinutes > 0 ? Math.min(180, Math.max(10, maxDailyMinutes)) : undefined;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }
    const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

    // Create different prompts based on input type
    let prompt = '';
    
    switch (inputType) {
      case 'file':
        prompt = `Analyze the uploaded quiz/test content: "${inputData}" and create a comprehensive study plan to address weaknesses.`;
        break;
      case 'chat':
        prompt = `Based on the student's described difficulties: "${inputData}", create a personalized study plan.`;
        break;
      case 'topic':
        prompt = `Create a comprehensive study plan for mastering the advanced topic: "${inputData}".`;
        break;
      default:
        prompt = `Create a study plan based on: "${inputData}".`;
    }

    const contextLine = `${gradeLevel ? `Grade level: ${gradeLevel}. ` : ''}${region ? `Curriculum/Country: ${region}. ` : ''}`;

    const constraints = [
      planDays ? `Create exactly ${planDays} daily lessons.` : 'Create 7-14 daily lessons depending on complexity.',
      perDayLimit ? `Each lesson estimatedTime must be <= ${perDayLimit} minutes.` : 'Estimate realistic time commitments (30-60 minutes per day).',
      'Start Day 1 with essential foundations: define key variables, terms, and notation before proceeding.',
      'For example, if teaching y = mx + b, first define what y, m, x, and b represent.',
      'Build from appropriate foundations but avoid overly elementary concepts unrelated to the topic.',
      'Progress logically from foundational definitions to more complex applications.',
      'Each day should build on the previous day\'s concepts in a structured progression.',
      'Include 2-3 clear example questions with solutions to illustrate concepts.'
    ].join('\n- ');

    const gradeContext = gradeLevel ? `\n\nCRITICAL: This is for a ${gradeLevel} student. Content must be appropriate for this grade level. Do NOT include elementary concepts unless specifically relevant to building toward the advanced topic. Start with concepts appropriate for ${gradeLevel} level understanding.` : '';

    const fullPrompt = `${contextLine}${prompt}${gradeContext}

    Generate a detailed study plan in this exact JSON format only (no markdown, no extra text):
    {
      "id": "unique-study-plan-id",
      "title": "Advanced Study Plan for ${inputData}",
      "description": "Comprehensive ${gradeLevel || ''} level study plan for mastering ${inputData}",
      "weakAreas": ["Specific Area 1", "Specific Area 2", "Specific Area 3"],
      "estimatedDuration": ${planDays ?? 14},
      "difficultyLevel": "medium",
      "dailyLessons": [
        {
          "day": 1,
          "topic": "Core Concepts in ${inputData}",
          "description": "Dive into the fundamental principles and theories specific to ${inputData}.",
          "activities": ["Deep explanation of key concepts", "Real-world applications", "Example questions with solutions"],
          "estimatedTime": ${perDayLimit ?? 45},
          "exampleQuestions": [
            {
              "question": "Example question text",
              "solution": "Step-by-step solution explanation"
            }
          ]
        }
      ]
    }
    Requirements:
    - Target the EXACT topic specified - no generic math introductions
    - ${constraints}
    - Each day should build progressively within the SPECIFIC subject area
    - Make activities directly related to the advanced topic, not basic math concepts
    - Use grade-appropriate language and examples throughout`;

    async function callAIWithRetry(retries = 2, delayMs = 1200): Promise<Response> {
      for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 45000);
        try {
          const resp = await fetch(AI_GATEWAY_URL, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: 'You are an expert educational consultant who specializes in creating comprehensive, grade-appropriate study plans. Start with essential foundations and definitions before progressing to complex concepts. Build knowledge progressively from appropriate foundations. Always respond with valid JSON only.' },
                { role: 'user', content: fullPrompt }
              ]
            }),
            signal: controller.signal,
          });
          if (resp.ok) return resp;
          if (resp.status === 429 && attempt < retries) {
            await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
            continue;
          }
          return resp;
        } catch (e) {
          if ((e as Error).name === 'AbortError') {
            if (attempt < retries) {
              continue;
            }
            throw new Error('AI request timed out');
          }
          throw e;
        } finally {
          clearTimeout(timer);
        }
      }
      return new Response(null, { status: 500 });
    }

    const response = await callAIWithRetry();

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const t = await response.text();
      console.error('AI gateway error:', response.status, t);
      return new Response(JSON.stringify({ error: 'AI gateway error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    let planContent = data.choices?.[0]?.message?.content ?? '';
    planContent = planContent.trim();

    function extractFirstJsonObject(text: string): string | null {
      // Strip common code fences
      let cleaned = text.replace(/^```json[\s\r\n]*/i, '').replace(/```$/i, '').trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        return cleaned.slice(start, end + 1);
      }
      return null;
    }

    const jsonStr = extractFirstJsonObject(planContent);
    let studyPlan: any;
    try {
      const toParse = jsonStr ?? planContent;
      studyPlan = JSON.parse(toParse);
      if (!studyPlan.id) {
        studyPlan.id = crypto.randomUUID();
      }
    } catch (parseError) {
      console.error('Failed to parse study plan JSON:', planContent);
      return new Response(JSON.stringify({ error: 'Failed to generate valid study plan format' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(studyPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    return new Response(JSON.stringify(studyPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-study-plan function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});