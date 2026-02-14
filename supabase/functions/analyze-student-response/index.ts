
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
    const { studentResponse, question, subject, sessionId } = await req.json()
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Analyze response with OpenAI
    const analysisPrompt = `
      Analyze this student's response for understanding and topic identification:
      
      Question/Context: ${question}
      Student Response: ${studentResponse}
      Subject: ${subject}
      
      Please provide a JSON response with:
      {
        "understanding_score": 0.0-1.0,
        "topic_identified": "specific topic name",
        "strengths": ["list of demonstrated strengths"],
        "areas_for_improvement": ["list of areas needing work"],
        "response_quality": "excellent|good|fair|poor",
        "key_concepts_understood": ["concepts the student grasps"],
        "misconceptions": ["any misconceptions identified"]
      }
    `

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an educational AI that analyzes student responses. Always return valid JSON.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`)
    }

    const openaiData = await openaiResponse.json()
    const analysisText = openaiData.choices[0].message.content
    
    let analysis
    try {
      analysis = JSON.parse(analysisText)
    } catch (error) {
      // Fallback analysis if JSON parsing fails
      analysis = {
        understanding_score: 0.5,
        topic_identified: subject,
        strengths: [],
        areas_for_improvement: [],
        response_quality: "fair",
        key_concepts_understood: [],
        misconceptions: []
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      analysis,
      sessionId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error analyzing student response:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
