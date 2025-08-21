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
    const { topic, description, gradeLevel = 'high school', activities, language = 'en' } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!topic) {
      throw new Error('Topic is required');
    }

    // Language instruction for AI
    const languageInstruction = language === 'en' ? '' : `Please provide all content in ${getLanguageName(language)}. `;

    // Create a comprehensive lesson content prompt
    const prompt = `${languageInstruction}Create a comprehensive ${gradeLevel} level lesson about "${topic}".

Description: ${description}

Generate extremely detailed educational content that thoroughly teaches the subject matter. Structure the lesson with these sections:

## 1. Introduction and Learning Objectives
- Detailed overview of what students will learn
- Clear, specific learning objectives for the lesson
- Context and importance of the topic

## 2. Fundamental Concepts
Provide in-depth explanations covering:
- Core definitions with multiple examples
- Historical context or development of concepts where relevant  
- Detailed step-by-step breakdowns of important processes
- Multiple worked examples with complete solutions
- Important formulas, theorems, or principles (use LaTeX math notation: $$formula$$ for display math, $formula$ for inline math)
- Common misconceptions explained in detail with corrections
- Connections between different concepts within the topic
- Visual descriptions of diagrams, graphs, or geometric relationships

## 3. Advanced Applications and Extensions  
- Real-world applications with detailed examples
- More complex problems and their solutions
- Connections to other mathematical areas
- Advanced techniques or alternative methods

## 4. Comprehensive Summary
Provide a detailed summary (300-500 words) that thoroughly covers:
- **Core Mathematical Concepts**: Detailed explanation of all key ideas, definitions, and principles covered in the lesson
- **Problem-Solving Techniques**: Comprehensive description of methods, strategies, and approaches learned
- **Formulas and Relationships**: Complete list and explanation of all important mathematical relationships
- **Real-World Connections**: Detailed examples of how these concepts apply to practical situations in science, engineering, finance, and daily life
- **Conceptual Understanding**: Deep explanation of why these concepts work and how they fit into the broader mathematical framework
- **Key Insights**: Important takeaways that help students understand the deeper meaning and significance of the material

Make this a complete, thorough lesson that provides deep understanding. Write in clear, educational prose with extensive detail and multiple examples for each concept.

For mathematical expressions, use proper LaTeX notation:
- For display math (centered): $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
- For inline math: $x^2 + y^2 = r^2$

Format as markdown with clear headings and subheadings. Focus on comprehensive teaching with extensive explanations and multiple examples.

Length: Aim for 1500-2000 words of substantial, detailed educational content.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          {
            role: 'system',
            content: `You are an expert educator who creates comprehensive, detailed lesson content that actually teaches students the subject matter. Your lessons are thorough, well-explained, and educational.${language !== 'en' ? ` Always respond in ${getLanguageName(language)}.` : ''}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 3000,
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

function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'tr': 'Turkish',
    'pl': 'Polish',
    'nl': 'Dutch'
  };
  return languages[code] || 'English';
}
    
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

Generate extremely detailed educational content that thoroughly teaches the subject matter. Structure the lesson with these sections:

## 1. Introduction and Learning Objectives
- Detailed overview of what students will learn
- Clear, specific learning objectives for the lesson
- Context and importance of the topic

## 2. Fundamental Concepts
Provide in-depth explanations covering:
- Core definitions with multiple examples
- Historical context or development of concepts where relevant  
- Detailed step-by-step breakdowns of important processes
- Multiple worked examples with complete solutions
- Important formulas, theorems, or principles (use LaTeX math notation: $$formula$$ for display math, $formula$ for inline math)
- Common misconceptions explained in detail with corrections
- Connections between different concepts within the topic
- Visual descriptions of diagrams, graphs, or geometric relationships

## 3. Advanced Applications and Extensions  
- Real-world applications with detailed examples
- More complex problems and their solutions
- Connections to other mathematical areas
- Advanced techniques or alternative methods

## 4. Comprehensive Summary
Provide a detailed summary (300-500 words) that thoroughly covers:
- **Core Mathematical Concepts**: Detailed explanation of all key ideas, definitions, and principles covered in the lesson
- **Problem-Solving Techniques**: Comprehensive description of methods, strategies, and approaches learned
- **Formulas and Relationships**: Complete list and explanation of all important mathematical relationships
- **Real-World Connections**: Detailed examples of how these concepts apply to practical situations in science, engineering, finance, and daily life
- **Conceptual Understanding**: Deep explanation of why these concepts work and how they fit into the broader mathematical framework
- **Key Insights**: Important takeaways that help students understand the deeper meaning and significance of the material

Make this a complete, thorough lesson that provides deep understanding. Write in clear, educational prose with extensive detail and multiple examples for each concept.

For mathematical expressions, use proper LaTeX notation:
- For display math (centered): $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
- For inline math: $x^2 + y^2 = r^2$

Format as markdown with clear headings and subheadings. Focus on comprehensive teaching with extensive explanations and multiple examples.

Length: Aim for 1500-2000 words of substantial, detailed educational content.`;

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