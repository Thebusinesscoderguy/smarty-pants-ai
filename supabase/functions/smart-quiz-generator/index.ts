
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { topic, difficulty = 'medium', studentId, chatHistory = [] } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Get student's topic mastery data
    const { data: masteryData } = await supabaseClient
      .from('student_topic_mastery')
      .select('*')
      .eq('student_id', studentId)
      .ilike('topic_name', `%${topic}%`)

    // Get student's learning analytics
    const { data: analyticsData } = await supabaseClient
      .from('learning_analytics')
      .select('*')
      .eq('user_id', studentId)
      .ilike('topic_name', `%${topic}%`)

    // Create context for quiz generation
    const studentContext = {
      mastery: masteryData || [],
      analytics: analyticsData || [],
      recentChat: chatHistory.slice(-10),
      requestedDifficulty: difficulty
    }

    // Call OpenAI to generate quiz
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are an expert quiz generator. Create a personalized quiz based on the student's learning data and topic request. 

Student Context: ${JSON.stringify(studentContext)}

Generate a quiz with 5-7 questions about "${topic}" at ${difficulty} difficulty level. Consider the student's mastery data to focus on areas that need improvement.

Return ONLY a JSON object with this structure:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correct": 0,
      "explanation": "Why this is correct",
      "difficulty": "easy|medium|hard",
      "topic": "specific subtopic"
    }
  ],
  "title": "Quiz title",
  "estimatedTime": 5
}`
          },
          {
            role: 'user',
            content: `Create a quiz about ${topic} for me.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    const aiResult = await openAIResponse.json()
    const quizData = JSON.parse(aiResult.choices[0].message.content)

    // Save quiz to database
    const { data: quiz, error } = await supabaseClient
      .from('instant_quizzes')
      .insert({
        student_id: studentId,
        topic: topic,
        questions: quizData.questions,
        total_questions: quizData.questions.length,
        difficulty_level: difficulty
      })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        quiz: {
          id: quiz.id,
          title: quizData.title,
          questions: quizData.questions,
          estimatedTime: quizData.estimatedTime
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Quiz generation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
