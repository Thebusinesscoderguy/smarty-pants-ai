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
    console.log('Received request:', { inputType, gradeLevel, days, maxDailyMinutes, inputDataLength: inputData?.length });
    
    const planDays = typeof days === 'number' && days > 0 ? Math.min(30, Math.max(1, days)) : undefined;
    const perDayLimit = typeof maxDailyMinutes === 'number' && maxDailyMinutes > 0 ? Math.min(180, Math.max(10, maxDailyMinutes)) : undefined;
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Create different prompts based on input type
    let prompt = '';
    let titleTemplate = '';
    let descriptionTemplate = '';
    let topicTemplate = '';
    
    switch (inputType) {
      case 'file':
        prompt = `🔴 CRITICAL: ANALYZE THIS EXACT TEXT - NOT GENERIC CONCEPTS 🔴

TEXT TO ANALYZE:
"${inputData}"

YOUR JOB: Create a study plan that teaches students about THIS SPECIFIC TEXT'S content.

✅ CORRECT APPROACH:
- "Day 1: Brooks argues that dining tables create family bonds through shared ritual"
- "Day 2: Analyzing Brooks' use of personal anecdotes to support his thesis"
- "Day 3: The metaphor of the dining table as community anchor in Brooks' essay"

❌ WRONG APPROACH (DO NOT DO THIS):
- "Day 1: Understanding themes and messages in texts"
- "Day 2: Identifying literary devices"
- "Day 3: Analyzing author's purpose"

MANDATORY REQUIREMENTS:
1. Every lesson must reference SPECIFIC passages, quotes, or arguments from THIS text
2. Use direct quotes from the text to support each lesson
3. Discuss the ACTUAL themes found in THIS text, not how to find themes
4. Analyze THIS author's specific literary choices, not generic literary devices
5. Connect every concept to a concrete example from THIS text

Example: Instead of "Metaphor is when..." write "Brooks uses the dining table as a metaphor for family unity, seen when he writes '[specific quote from text]'"`;
        titleTemplate = 'the provided text';
        descriptionTemplate = 'Comprehensive study plan for analyzing and understanding the provided text';
        topicTemplate = 'Introduction and Key Themes in the Text';
        break;
      case 'chat':
        prompt = `Based on the student's described difficulties: "${inputData}", create a personalized study plan.`;
        titleTemplate = inputData;
        descriptionTemplate = `Comprehensive ${gradeLevel || ''} level study plan for mastering ${inputData}`;
        topicTemplate = `Core Concepts in ${inputData}`;
        break;
      case 'topic':
        prompt = `Create a comprehensive study plan for mastering the advanced topic: "${inputData}".`;
        titleTemplate = inputData;
        descriptionTemplate = `Comprehensive ${gradeLevel || ''} level study plan for mastering ${inputData}`;
        topicTemplate = `Core Concepts in ${inputData}`;
        break;
      default:
        prompt = `Create a study plan based on: "${inputData}".`;
        titleTemplate = inputData;
        descriptionTemplate = `Comprehensive study plan for ${inputData}`;
        topicTemplate = `Core Concepts in ${inputData}`;
    }

    const contextLine = `${gradeLevel ? `Grade level: ${gradeLevel}. ` : ''}${region ? `Curriculum/Country: ${region}. ` : ''}`;

    const actualDays = planDays ?? 14;
    const baseConstraints = [
      `YOU MUST CREATE EXACTLY ${actualDays} DAILY LESSONS - NO MORE, NO LESS.`,
      `The dailyLessons array MUST contain exactly ${actualDays} lesson objects.`,
      perDayLimit ? `Each lesson estimatedTime must be <= ${perDayLimit} minutes.` : 'Estimate realistic time commitments (30-60 minutes per day).',
      'Progress logically in a structured progression.',
      'Each day should build on the previous day\'s concepts.',
      'CRITICAL: Each lesson MUST include 2-3 example questions with detailed solutions (minimum 2, ideally 3).',
      'Examples should progress from simple to more complex to demonstrate concept mastery.',
      'Keep each solution concise (3-5 short steps). Avoid overly verbose text.'
    ];

    const literatureConstraints = [
      '🔴 MANDATORY: Reference specific passages, quotes, or paragraphs from the text in EVERY lesson',
      'Include direct quotes from the text to support analysis',
      'Connect each literary concept to a specific example from THIS text',
      'Never write "identify the themes" - write what the themes ARE',
      'Never write "analyze the author\'s purpose" - write what the purpose IS'
    ];

    const mathConstraints = [
      'Start Day 1 with essential foundations: define key variables, terms, and notation before proceeding.',
      'For example, if teaching y = mx + b, first define what y, m, x, and b represent.',
      'Build from appropriate foundations but avoid overly elementary concepts unrelated to the topic.',
      'FORMATTING: For math questions, structure solutions as numbered steps with clear spacing.',
      'FORMATTING: Use proper LaTeX notation enclosed in \\( \\) for inline math or $$ $$ for display math.',
      'FORMATTING: Each solution step should be on its own line with clear explanations.',
      'FORMATTING: Use bullet points or numbered lists for multi-step processes.'
    ];

    const specificConstraints = inputType === 'file' ? literatureConstraints : mathConstraints;
    const constraints = [...baseConstraints, ...specificConstraints].join('\n- ');

    const gradeContext = gradeLevel ? `\n\nCRITICAL: This is for a ${gradeLevel} student. Content must be appropriate for this grade level. Do NOT include elementary concepts unless specifically relevant to building toward the advanced topic. Start with concepts appropriate for ${gradeLevel} level understanding.` : '';

    const fullPrompt = `${contextLine}${prompt}${gradeContext}

    🔴 CRITICAL REQUIREMENT: You MUST generate EXACTLY ${actualDays} daily lessons. Count them carefully before submitting.

    Generate a detailed study plan in this exact JSON format only (no markdown, no extra text):
    {
      "id": "unique-study-plan-id",
      "title": "Study Plan for ${titleTemplate}",
      "description": "${descriptionTemplate}",
      "weakAreas": ["Specific Area 1", "Specific Area 2", "Specific Area 3"],
      "estimatedDuration": ${actualDays},
      "difficultyLevel": "medium",
      "dailyLessons": [
        {
          "day": 1,
          "topic": "${topicTemplate}",
          "description": "Dive into the fundamental principles and key ideas.",
          "activities": ["Deep explanation of key concepts", "Real-world applications", "Example questions with solutions"],
          "estimatedTime": ${perDayLimit ?? 45},
            "exampleQuestions": [
            {
              "question": "Close reading: \"[Insert exact quote from the provided text]\"",
              "solution": "**Step 1:** Identify devices and diction choices\\n\\n**Step 2:** Analyze syntax (sentence type, length, punctuation) and its effect\\n\\n**Step 3:** Explain how this passage advances today's theme\\n\\n**Final Insight:** [Insight tied to this specific text]"
            },
            {
              "question": "How does the text develop [specific theme] across a scene/section? Cite two quotes.",
              "solution": "**Step 1:** Summarize the scene with brief textual evidence\\n\\n**Step 2:** Link devices (imagery, motif, irony) to meaning\\n\\n**Step 3:** Synthesize what the text claims about the theme"
            },
            {
              "question": "Syntax focus: Select one sentence and analyze its structure and impact.",
              "solution": "**Step 1:** Classify sentence type (simple/compound/complex/periodic)\\n\\n**Step 2:** Note punctuation and rhythm\\n\\n**Step 3:** Connect syntax to tone/theme and reader effect"
            }
          ]
        }
      ]
    }
    Requirements:
    - Target the EXACT topic specified - no generic math introductions
    - ${constraints}
    - MANDATORY: Every lesson must have 2-3 example questions minimum (preferably 3)
    - Each day should build progressively within the SPECIFIC subject area
    - Make activities directly related to the advanced topic, not basic math concepts
    - Use grade-appropriate language and examples throughout`;

    async function callAIWithRetry(retries = 1, delayMs = 1200): Promise<Response> {
      for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 55000);
        try {
          const systemMessage = inputType === 'file' 
            ? 'You are a literature professor analyzing a specific text. Your job is to discuss the ACTUAL content of the text provided - the specific themes, passages, arguments, and literary devices used by THIS author in THIS text. NEVER create generic lessons about "how to identify themes" or "understanding literary devices." Instead, create lessons about what the themes ARE in this specific work, what literary devices the author ACTUALLY uses, and what arguments they MAKE. Every lesson must reference specific content from the provided text. Always respond with valid JSON only.'
            : 'You are an expert educational consultant who specializes in creating comprehensive, grade-appropriate study plans. When given math topics, start with essential foundations and definitions before progressing to complex concepts. Build knowledge progressively from appropriate foundations. For math content, format solutions with clear numbered steps, proper spacing, and LaTeX notation (use \\( \\) for inline math). Each step should be clearly separated with line breaks (\\n\\n). Always respond with valid JSON only.';

          const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: fullPrompt }
              ],
              tools: [
                {
                  type: 'function',
                  function: {
                    name: 'return_study_plan',
                    description: 'Return the generated study plan as structured JSON',
                    parameters: {
                      type: 'object',
                      additionalProperties: false,
                      required: ['id','title','description','weakAreas','estimatedDuration','difficultyLevel','dailyLessons'],
                      properties: {
                        id: { type: 'string' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        weakAreas: { type: 'array', items: { type: 'string' }, minItems: 1 },
                        estimatedDuration: { type: 'number' },
                        difficultyLevel: { type: 'string', enum: ['easy','medium','hard'] },
                        dailyLessons: {
                          type: 'array',
                          minItems: actualDays,
                          maxItems: actualDays,
                          items: {
                            type: 'object',
                            additionalProperties: false,
                            required: ['day','topic','description','activities','estimatedTime'],
                            properties: {
                              day: { type: 'number' },
                              topic: { type: 'string' },
                              description: { type: 'string' },
                              activities: { type: 'array', items: { type: 'string' } },
                              estimatedTime: { type: 'number' },
                              exampleQuestions: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  additionalProperties: false,
                                  required: ['question','solution'],
                                  properties: {
                                    question: { type: 'string' },
                                    solution: { type: 'string' }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              ],
              tool_choice: { type: 'function', function: { name: 'return_study_plan' } },
              temperature: 0.7,
              max_tokens: 8192,
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

    console.log('Calling Lovable AI with model: google/gemini-2.5-flash');
    const response = await callAIWithRetry();

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error - Status:', response.status);
      console.error('Lovable AI error - Response:', errorText);
      
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
      
      return new Response(JSON.stringify({ 
        error: 'Lovable AI API error',
        details: errorText,
        status: response.status 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Lovable AI request successful, parsing response...');

    const data = await response.json();

    // Prefer structured tool output when available
    let studyPlan: any | null = null;
    const rawToolArgs = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    
    function repairJsonString(s: string): string {
      let repaired = s;
      // Escape stray backslashes (e.g., LaTeX \(, \))
      repaired = repaired.replace(/\\(?!["\\\/bfnrtu])/g, "\\\\");
      // Remove trailing commas
      repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
      return repaired;
    }
    
    if (rawToolArgs) {
      try {
        studyPlan = typeof rawToolArgs === 'string' ? JSON.parse(rawToolArgs) : rawToolArgs;
      } catch (e) {
        console.error('Tool args JSON parse failed, attempting repair...', { 
          length: String(rawToolArgs).length,
          preview: String(rawToolArgs).slice(0, 200)
        });
        try {
          const repaired = repairJsonString(String(rawToolArgs));
          studyPlan = JSON.parse(repaired);
          console.log('Tool args successfully repaired and parsed');
        } catch (e2) {
          console.error('Tool args repair failed, falling back to content parsing');
          studyPlan = null; // fall back to content parsing
        }
      }
    }

    if (!studyPlan) {
      let planContent = data.choices?.[0]?.message?.content ?? '';
      if (typeof planContent !== 'string') {
        return new Response(JSON.stringify(planContent), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      planContent = planContent.trim().replace(/^```json\n?|\n?```$/g, '');

      function extractFirstJsonObject(text: string): string | null {
        let cleaned = text.replace(/^```json[\s\r\n]*/i, '').replace(/```$/i, '').trim();
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          return cleaned.slice(start, end + 1);
        }
        return null;
      }

      const jsonStr = extractFirstJsonObject(planContent);
      try {
        const toParse = jsonStr ?? planContent;
        try {
          studyPlan = JSON.parse(toParse);
        } catch (_) {
          const repaired = repairJsonString(toParse);
          studyPlan = JSON.parse(repaired);
        }
      } catch (parseError) {
        console.error('Failed to parse study plan JSON from content:', {
          contentLength: planContent.length,
          contentPreview: planContent.slice(0, 200)
        });
        return new Response(JSON.stringify({ error: 'Failed to generate valid study plan format' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!studyPlan.id) {
      studyPlan.id = crypto.randomUUID();
    }

    // Normalize and enforce exact number of days
    const targetDays = actualDays; // from earlier calculation

    // Ensure dailyLessons is an array
    let lessons: any[] = Array.isArray(studyPlan.dailyLessons)
      ? studyPlan.dailyLessons
      : (studyPlan.dailyLessons && typeof studyPlan.dailyLessons === 'object')
        ? Object.values(studyPlan.dailyLessons)
        : [];

    // Basic cleanup and ordering
    lessons = lessons
      .filter((l) => l && typeof l === 'object')
      .map((l, idx) => ({
        day: Number.isFinite(Number(l.day)) ? Number(l.day) : idx + 1,
        topic: String(l.topic || `Day ${idx + 1} Topic`),
        description: String(l.description || 'Lesson details to be refined.'),
        activities: Array.isArray(l.activities) ? l.activities.map(String) : ['Study key concepts', 'Practice problems'],
        estimatedTime: Number.isFinite(Number(l.estimatedTime)) ? Number(l.estimatedTime) : (perDayLimit ?? 45),
        exampleQuestions: Array.isArray(l.exampleQuestions) ? l.exampleQuestions.map((q: any) => ({
          question: String(q?.question || 'Example question'),
          solution: String(q?.solution || 'Solution outline')
        })) : []
      }))
      .sort((a, b) => a.day - b.day);

    // Reindex, clamp times, and enforce exact count
    lessons = lessons.map((l, i) => ({
      ...l,
      day: i + 1,
      estimatedTime: perDayLimit ? Math.min(perDayLimit, Math.max(10, l.estimatedTime)) : l.estimatedTime,
    }));

    if (lessons.length > targetDays) {
      lessons = lessons.slice(0, targetDays);
      lessons = lessons.map((l, i) => ({ ...l, day: i + 1 }));
    }

    if (lessons.length < targetDays) {
      for (let i = lessons.length + 1; i <= targetDays; i++) {
        lessons.push({
          day: i,
          topic: `Day ${i}: Continue Building Mastery`,
          description: 'Auto-generated placeholder. Focus on consolidating previous concepts and applying them to new problems.',
          activities: ['Review prior day\'s concepts', 'Apply to 2–3 new problems', 'Reflect and summarize learnings'],
          estimatedTime: perDayLimit ?? 45,
          exampleQuestions: []
        });
      }
    }

    studyPlan.dailyLessons = lessons;
    studyPlan.estimatedDuration = targetDays;

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