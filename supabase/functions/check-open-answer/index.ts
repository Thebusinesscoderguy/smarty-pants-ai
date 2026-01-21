import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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

    console.log('Open answer check result:', { userAnswer, correctAnswer, result })

    return new Response(JSON.stringify({ 
      success: true, 
      ...result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error checking open answer:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      is_correct: false,
      score: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
