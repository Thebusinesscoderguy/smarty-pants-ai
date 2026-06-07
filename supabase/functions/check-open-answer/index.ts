import { buildCorsHeaders } from "../_shared/cors.ts";
import { enforceIpRateLimit, rateLimitedResponse } from "../_shared/rateLimit.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// SECURITY (CORS): origin allowlist via shared helper (was wildcard '*').
let corsHeaders = buildCorsHeaders();

serve(async (req) => {
  corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // SECURITY (AI bill abuse): this endpoint is intentionally anonymous, so cap
  // each client IP to 3 requests/hour before doing any AI work.
  const { allowed } = await enforceIpRateLimit(req, 'check-open-answer')
  if (!allowed) return rateLimitedResponse(corsHeaders)

  try {
    const { userAnswer, correctAnswer, question } = await req.json()
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Use AI to semantically compare the answers
    const prompt = `You are grading a student's answer to a quiz question. Be lenient and focus on whether the student demonstrates understanding of the key concepts, NOT exact wording.

Question: ${question}
Expected Answer: ${correctAnswer}
Student's Answer: ${userAnswer}

Evaluate if the student's answer is essentially correct. Consider:
- Does it capture the main concepts?
- Are the key points mentioned (even if worded differently)?
- Would a teacher reasonably accept this answer?

Respond with JSON only:
{
  "is_correct": true/false,
  "score": 0.0-1.0,
  "feedback": "brief explanation of why the answer is correct or what's missing"
}

Be generous - if the student shows understanding of the core concept, mark it correct even if:
- They use different terminology (e.g., "mirrors" vs "reflective surfaces")
- They explain things in a different order
- They're less detailed but cover the main points
- They use simpler language`

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a lenient but fair quiz grader. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`)
    }

    const openaiData = await openaiResponse.json()
    const responseText = openaiData.choices[0].message.content
    
    let result
    try {
      // Try to parse the JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { is_correct: false, score: 0, feedback: 'Could not parse response' }
    } catch (error) {
      console.error('JSON parse error:', error, responseText)
      // Fallback: if response contains "true" or positive indicators, assume correct
      const isCorrect = responseText.toLowerCase().includes('"is_correct": true') || 
                        responseText.toLowerCase().includes('"is_correct":true')
      result = {
        is_correct: isCorrect,
        score: isCorrect ? 0.8 : 0.2,
        feedback: 'Semantic comparison completed'
      }
    }

    // SECURITY (sensitive logging): removed logging of userAnswer/correctAnswer —
    // it persisted the answer key and student responses (PII) in function logs.

    return new Response(JSON.stringify({
      success: true, 
      ...result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error checking open answer:', error)
    // SECURITY (info disclosure): return a generic error; details stay in logs.
    return new Response(JSON.stringify({
      success: false,
      is_correct: false,
      score: 0,
      error: 'Could not grade the answer. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
