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
    const { topic, description, gradeLevel = 'high school', activities } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!topic) {
      throw new Error('Topic is required');
    }

    // Create a comprehensive lesson content prompt
    const prompt = `Create a comprehensive ${gradeLevel} level lesson about "${topic}".

Description: ${description}

Generate detailed educational content that actually teaches the subject matter. Structure the lesson with these sections:

## 1. Introduction and Learning Objectives
- Brief overview of what students will learn
- Clear learning objectives for the lesson

## 2. Core Content
Include:
- Clear explanations of key concepts
- Step-by-step breakdowns of important processes
- Real examples with worked solutions
- Important formulas, definitions, or principles (use LaTeX math notation: $$formula$$ for display math, $formula$ for inline math)
- Common misconceptions and how to avoid them
- Visual descriptions where helpful (describe diagrams, graphs, etc.)

## 3. Study Tips
Always include a "Study Tips" section with these specific points:
- Practice regularly with different types of problems
- Connect mathematical concepts to real-world examples
- Work step-by-step through complex problems
- Review and understand your mistakes

## 4. Key Points Summary
Always include a "Key Points Summary" section covering these areas where relevant to the topic:
- Numbers and Operations: Understanding different types of numbers and operations
- Algebra Basics: Working with variables, equations, and functions
- Geometry Principles: Dealing with shapes, angles, and spatial relationships
- Practical Applications: Mathematics in daily life including finance, construction, and technology
- Problem-Solving: Systematic approach to understanding and solving mathematical problems

## 5. Practice Problems (Optional)
If appropriate, include 2-3 practice problems with step-by-step solutions.

Make this a complete lesson that a student can learn from, not just instructions or activities. Write in clear, educational prose that explains the concepts thoroughly.

For mathematical expressions, use proper LaTeX notation:
- For display math (centered): $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
- For inline math: $x^2 + y^2 = r^2$

Format as markdown with proper headings and subheadings. Focus on teaching the actual subject matter with detailed explanations and examples.

Length: Aim for 1000-1500 words of substantial educational content.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educator who creates comprehensive, detailed lesson content that actually teaches students the subject matter. Your lessons are thorough, well-explained, and educational.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated from OpenAI');
    }

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in generate-lesson-content:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});