import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, gradeLevel, slideCount, style, language, includeQuiz, includeExamples } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isArabic = language === 'ar';

    const styleDescriptions: Record<string, string> = {
      educational: 'Formal educational with clear explanations and structured learning',
      fun: 'Fun and engaging with emojis, analogies, and real-world connections',
      visual: 'Visual focus with descriptive imagery and diagram descriptions',
      concise: 'Brief and to-the-point with key bullet points and clear takeaways',
    };

    const prompt = `You are an expert educator. Create a presentation about "${topic}" for ${gradeLevel} students.

Style: ${styleDescriptions[style] || styleDescriptions.educational}
${isArabic ? 'Write ALL content in Arabic.' : ''}
${includeQuiz ? 'Include quiz questions on the last slide.' : ''}
${includeExamples ? 'Include practical examples throughout.' : ''}

Return ONLY a valid JSON array of exactly ${slideCount} slide objects. Each object must have:
- "title": string (slide title)
- "bullets": string[] (3-5 bullet points with detailed explanations)
- "type": one of "title", "content", "quiz", "summary"
- "icon": an emoji that represents the slide content

The first slide should be type "title" with a subtitle as the first bullet.
The second-to-last slide should be type "summary".
${includeQuiz ? 'The last slide should be type "quiz" with questions as bullets.' : 'The last slide should be type "summary".'}

IMPORTANT: Return ONLY the JSON array, no markdown, no code fences, no explanation.`;

    console.log("Generating presentation slides with AI...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: isArabic
            ? "أنت مدرس خبير. أرجع فقط JSON صالح بدون أي نص إضافي."
            : "You are an expert educator. Return only valid JSON with no additional text."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI API error:", status, errorText);
      throw new Error(`AI API error: ${status}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content returned from AI");

    // Clean up markdown fences if present
    content = content.trim();
    if (content.startsWith("```")) {
      content = content.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const slides = JSON.parse(content);
    
    if (!Array.isArray(slides) || slides.length === 0) {
      throw new Error("Invalid slide data returned from AI");
    }

    console.log(`Successfully generated ${slides.length} slides`);

    const title = isArabic ? `${topic} - عرض تقديمي` : `${topic} - ${gradeLevel}`;

    return new Response(JSON.stringify({
      success: true,
      title,
      slides,
      slideCount: slides.length,
      topic,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating presentation:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate presentation" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
