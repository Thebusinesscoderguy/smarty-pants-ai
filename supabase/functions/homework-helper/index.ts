
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { problem, studentId, fileUrl, sessionId } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Analyze the problem type and complexity
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a Socratic tutor. Analyze the homework problem and provide guided learning using the Socratic method. Never give direct answers, but guide students to discover solutions themselves.

For the given problem, provide:
1. Problem type classification
2. Key concepts involved
3. Step-by-step Socratic questions to guide thinking
4. Hints that don't reveal answers
5. Follow-up questions to deepen understanding

Return JSON format:
{
  "problemType": "math|science|english|history|other",
  "subject": "specific subject",
  "difficulty": "easy|medium|hard",
  "concepts": ["concept1", "concept2"],
  "steps": [
    {
      "step": 1,
      "question": "What information do you have?",
      "hint": "Look for the given values",
      "concept": "problem analysis"
    }
  ],
  "estimatedTime": 15
}`
          },
          {
            role: 'user',
            content: `Help me understand this problem: ${problem}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    })

    const analysisResult = await analysisResponse.json()
    const guidance = JSON.parse(analysisResult.choices[0].message.content)

    // Create or update homework session
    const { data: session, error } = await supabaseClient
      .from('homework_sessions')
      .upsert({
        id: sessionId,
        student_id: studentId,
        problem_type: guidance.problemType,
        problem_description: problem,
        file_url: fileUrl,
        total_steps: guidance.steps.length,
        session_data: guidance
      })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.id,
        guidance: guidance
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Homework helper error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
