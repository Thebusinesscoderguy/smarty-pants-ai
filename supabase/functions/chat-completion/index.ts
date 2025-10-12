
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
    const { messages, language = 'en' } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!openAIApiKey && !lovableApiKey) {
      console.error('No AI API key configured');
      return new Response(
        JSON.stringify({ 
          error: 'No AI API key configured'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Chat completion request:', { hasMessages: !!messages, messageCount: messages?.length || 0, language });

    // Use messages as-is without custom system instructions (base GPT behavior)
    const finalMessages = messages || [{ role: 'user', content: 'Hello' }];
    
    // Add system message with accuracy requirements and language instruction
    let messagesWithSystem;
    const accuracyInstruction = 'CRITICAL: If you encounter any conflicting information or are uncertain about factual accuracy, do NOT present that information to the student. Only provide information you are confident is accurate and consistent. If uncertain, acknowledge your uncertainty rather than presenting potentially incorrect information.';
    
    if (language !== 'en') {
      const languageSystemMessage = {
        role: 'system',
        content: `${accuracyInstruction}\n\nAlways respond in ${getLanguageName(language)}.`
      };
      messagesWithSystem = [languageSystemMessage, ...finalMessages];
    } else {
      const systemMessage = {
        role: 'system',
        content: accuracyInstruction
      };
      messagesWithSystem = [systemMessage, ...finalMessages];
    }

    // Set a timeout for the fetch operation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      let response: Response;
      if (lovableApiKey) {
        const gatewayUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
        // Primary: Gemini 2.5 Flash (default, fast)
        response = await fetch(gatewayUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: messagesWithSystem,
            stream: true,
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('AI gateway error (gemini-2.5-flash):', response.status, errText);
          // Fallback to Gemini Pro
          response = await fetch(gatewayUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-pro',
              messages: messagesWithSystem,
              stream: true,
            }),
            signal: controller.signal
          });
        }
      } else {
        console.error('LOVABLE_API_KEY is not configured');
        return new Response(
          JSON.stringify({ error: 'AI gateway not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI request error:', response.status, errorText);
        return new Response(
          JSON.stringify({ 
            error: `AI request error: ${response.statusText}`,
            details: errorText
          }),
          { 
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('AI streaming response received, forwarding stream');

      // Create a streaming response
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    controller.close();
                    return;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          } catch (error) {
            console.error('Stream processing error:', error);
          } finally {
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', fetchError);
      throw fetchError;
    }

  } catch (error) {
    console.error('Error in chat-completion function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
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
