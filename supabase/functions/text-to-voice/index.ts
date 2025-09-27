import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    const { text, voice } = await req.json()

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Allow only OpenAI-supported voices
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
    const selectedVoice = validVoices.includes(voice) ? voice : 'alloy'

    // Call OpenAI TTS API with optimized settings
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
      },
      body: JSON.stringify({
        model: 'tts-1-hd', // Faster model
        input: text.trim().slice(0, 300), // Reduced length for speed
        voice: selectedVoice,
        response_format: 'mp3',
        speed: 1.25, // Slightly faster speech
      }),
    })

    if (!response.ok) {
      let message = `OpenAI error (${response.status})`
      try {
        const err = await response.json()
        message = err?.error?.message || message
      } catch (_) {}
      return new Response(
        JSON.stringify({ error: message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const buffer = await response.arrayBuffer()
    if (buffer.byteLength === 0) {
      return new Response(
        JSON.stringify({ error: 'Empty audio from OpenAI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Safer base64 encoding to avoid stack overflows on large buffers
    const uint8 = new Uint8Array(buffer)
    let binary = ''
    const chunkSize = 0x8000
    for (let i = 0; i < uint8.length; i += chunkSize) {
      binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize))
    }
    const base64Audio = btoa(binary)

    return new Response(
      JSON.stringify({ audioContent: base64Audio, provider: 'openai', voice: selectedVoice }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
