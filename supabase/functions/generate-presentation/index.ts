import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALAI_BASE_URL = "https://slides-api.getalai.com/api/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, gradeLevel, slideCount, style, language, includeQuiz, includeExamples } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const ALAI_API_KEY = Deno.env.get("ALAI_API_KEY");
    if (!ALAI_API_KEY) throw new Error("ALAI_API_KEY is not configured");

    const isArabic = language === 'ar';

    // ── Stage 1: Use AI to create detailed, rich presentation content ──
    console.log("Stage 1: Enhancing prompt with AI...");

    const styleDescriptions: Record<string, string> = {
      educational: 'Formal educational with clear explanations, definitions, and structured learning progression',
      fun: 'Fun and engaging with emojis, analogies, real-world connections, and interactive elements',
      visual: 'Visual focus with emphasis on descriptions of diagrams, charts, and imagery for each slide',
      concise: 'Brief and to-the-point with key bullet points, clear takeaways, and minimal filler',
    };

    const enhancePrompt = `You are an expert educator creating detailed presentation content about "${topic}" for ${gradeLevel} students.

Create a comprehensive, well-structured presentation outline with exactly ${slideCount} slides.
Style: ${styleDescriptions[style] || styleDescriptions.educational}
${isArabic ? 'Write ALL content in Arabic.' : ''}
${includeQuiz ? 'Include 3-5 quiz questions at the end with answers.' : ''}
${includeExamples ? 'Include practical real-world examples and exercises throughout.' : ''}

Structure:
- Slide 1: Title slide with an engaging hook
- Slide 2: Introduction / Overview
- Slides 3-${slideCount - 2}: Main content slides with detailed explanations, examples, and key points
- Slide ${slideCount - 1}: Summary / Key takeaways
- Slide ${slideCount}: ${includeQuiz ? 'Quiz / Review questions' : 'Conclusion / Next steps'}

For each slide, write detailed content (3-5 bullet points with rich explanations, not just keywords).
Make the content educational, accurate, and appropriate for ${gradeLevel} level.

Write the full presentation as a continuous document. Use "Slide X: Title" as headings (where X is the slide number), followed by bullet points with the detailed content. Do NOT use any numbered lists for slide identifiers — always use the word "Slide" followed by the number.`;

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
            ? "أنت مدرس خبير. أنشئ محتوى عرض تقديمي تعليمي مفصل وشامل بالعربية."
            : "You are an expert educator. Create detailed, comprehensive educational presentation content."
          },
          { role: "user", content: enhancePrompt }
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
    const enhancedContent = aiData.choices?.[0]?.message?.content;
    if (!enhancedContent) throw new Error("No content returned from AI");

    console.log("Stage 1 complete. Enhanced content length:", enhancedContent.length);

    // ── Stage 2: Send enhanced content to Alai API ──
    console.log("Stage 2: Sending to Alai API...");

    // Map slideCount to Alai slide_range
    let slideRange = "auto";
    if (slideCount <= 1) slideRange = "1";
    else if (slideCount <= 5) slideRange = "2-5";
    else if (slideCount <= 10) slideRange = "6-10";
    else if (slideCount <= 15) slideRange = "11-15";
    else if (slideCount <= 20) slideRange = "16-20";
    else slideRange = "21-25";

    // Map style to Alai tone
    const toneMap: Record<string, string> = {
      educational: "EDUCATIONAL",
      fun: "CASUAL",
      visual: "DEFAULT",
      concise: "PROFESSIONAL",
    };

    const title = isArabic ? `${topic} - عرض تقديمي` : `${topic} - ${gradeLevel}`;

    const alaiPayload = {
      input_text: enhancedContent,
      export_formats: ["link", "ppt", "pdf"],
      presentation_options: {
        title,
        slide_range: slideRange,
        theme_id: "Simple Light",
      },
      text_options: {
        language: isArabic ? "Hindi" : "English (US)",
        tone: toneMap[style] || "EDUCATIONAL",
        content_mode: "enhance",
        amount_mode: "balanced",
      },
      image_options: {
        include_ai_images: true,
        style: "auto",
      },
    };

    const alaiGenResponse = await fetch(`${ALAI_BASE_URL}/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ALAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(alaiPayload),
    });

    if (!alaiGenResponse.ok) {
      const errText = await alaiGenResponse.text();
      console.error("Alai API generation error:", alaiGenResponse.status, errText);
      throw new Error(`Alai API error: ${alaiGenResponse.status} - ${errText}`);
    }

    const alaiGenData = await alaiGenResponse.json();
    const generationId = alaiGenData.generation_id;
    if (!generationId) throw new Error("No generation_id returned from Alai");

    console.log("Alai generation started:", generationId);

    // ── Stage 3: Poll for completion ──
    const maxWaitMs = 180000; // 3 minutes
    const pollIntervalMs = 5000;
    const startTime = Date.now();

    let result: any = null;

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));

      const statusResponse = await fetch(`${ALAI_BASE_URL}/generations/${generationId}`, {
        headers: { Authorization: `Bearer ${ALAI_API_KEY}` },
      });

      if (!statusResponse.ok) {
        console.error("Alai status poll error:", statusResponse.status);
        continue;
      }

      const statusData = await statusResponse.json();
      console.log("Alai generation status:", statusData.status);

      if (statusData.status === "completed") {
        result = statusData;
        break;
      } else if (statusData.status === "failed") {
        throw new Error(`Alai generation failed: ${statusData.error || "Unknown error"}`);
      }
    }

    if (!result) {
      throw new Error("Alai presentation generation timed out after 3 minutes");
    }

    console.log("Alai generation completed successfully");

    // Extract download URLs from result
    const formats = result.formats || {};
    const presentationUrl = result.presentation_url || formats.link || null;
    const pptUrl = formats.ppt || null;
    const pdfUrl = formats.pdf || null;

    return new Response(JSON.stringify({
      success: true,
      generationId,
      title,
      presentationUrl,
      pptUrl,
      pdfUrl,
      slideCount: result.slide_count || slideCount,
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
