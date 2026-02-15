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

    const gradeDepthMap: Record<string, string> = {
      'Grade 1': 'Use very simple words (1-2 syllable). Short sentences. Fun facts and colorful analogies. No technical terms. Think "picture book" level.',
      'Grade 2': 'Use very simple words (1-2 syllable). Short sentences. Fun facts and colorful analogies. No technical terms. Think "picture book" level.',
      'Grade 3': 'Use simple vocabulary with occasional new words defined in context. Use analogies to everyday life. Basic cause-and-effect. Keep sentences short and clear.',
      'Grade 4': 'Introduce basic subject-specific vocabulary with definitions. Use comparisons and simple diagrams. Explain "why" and "how" with concrete examples.',
      'Grade 5': 'Use grade-appropriate academic vocabulary. Include specific numbers, dates, and named examples. Introduce basic classification and categorization.',
      'Grade 6': 'Use academic vocabulary confidently. Include data, statistics, and real-world applications. Explain processes step-by-step with cause-and-effect reasoning.',
      'Grade 7': 'Introduce technical terminology with context. Use evidence-based explanations. Include historical context, scientific data, and cross-topic connections.',
      'Grade 8': 'Use technical and domain-specific language. Present multiple perspectives. Include primary source references, experimental data, and analytical reasoning.',
      'Grade 9': 'Use formal academic language. Introduce theoretical frameworks. Include detailed evidence, statistical analysis, and critical evaluation of sources.',
      'Grade 10': 'Use advanced academic and discipline-specific language. Analyze complex systems and relationships. Include peer-reviewed findings, historical analysis, and nuanced arguments.',
      'Grade 11': 'Use sophisticated academic language. Present advanced theoretical concepts. Include research citations, comparative analysis, and critical thinking challenges. Content should prepare for AP/IB level.',
      'Grade 12': 'Use college-preparatory academic language. Cover advanced topics with depth and rigor. Include scholarly references, complex analysis, synthesis of multiple sources, and evaluation of competing theories.',
      'College': 'Use discipline-specific jargon and research-level vocabulary. Include citations to seminal works, current research findings, methodological considerations, and advanced theoretical frameworks.',
      'Professional': 'Use industry-standard terminology and cutting-edge research. Include case studies, empirical data, professional best practices, and references to current literature in the field.',
    };

    const depthInstruction = gradeDepthMap[gradeLevel] || gradeDepthMap['Grade 6'];

    const prompt = `You are a curriculum specialist creating a presentation about "${topic}" for ${gradeLevel} students.

GRADE-LEVEL DEPTH REQUIREMENT:
${depthInstruction}

STYLE: ${styleDescriptions[style] || styleDescriptions.educational}

${isArabic ? 'Write ALL content in Arabic. Match the academic depth to the equivalent grade level in Arabic-language education.' : ''}
${includeQuiz ? 'Include quiz questions on the last slide that test comprehension at the appropriate grade level.' : ''}
${includeExamples ? 'Include specific, real-world examples with actual names, dates, figures, and data points throughout. No vague or generic examples.' : ''}

CONTENT QUALITY RULES:
- Each bullet point MUST be 2-3 detailed sentences with specific facts, figures, or named examples. Never write shallow one-liners.
- Use vocabulary and sentence complexity appropriate for ${gradeLevel} students.
- Include real data, dates, statistics, and named examples where applicable. Avoid vague generalities like "it is very important" or "there are many types."
- Content should align with standard curriculum expectations for ${gradeLevel}.

Return ONLY a valid JSON array of exactly ${slideCount} slide objects. Each object must have:
- "title": string (slide title)
- "bullets": string[] (3-5 bullet points, each being 2-3 substantive sentences)
- "type": one of "title", "content", "quiz", "summary"
- "icon": an emoji that represents the slide content
- "visual": (optional) an object to display a diagram or visual element on the slide. Include this on roughly half of the "content" slides to make the presentation visually rich. Choose ONE of these visual types per slide:
  - { "type": "comparison", "headers": ["Column A", "Column B"], "rows": [["item1a", "item1b"], ["item2a", "item2b"]] } — for comparing two things
  - { "type": "timeline", "events": [{ "year": "1900", "label": "Event description" }, ...] } — for chronological events (3-6 events)
  - { "type": "diagram", "center": "Main Concept", "branches": ["Branch 1", "Branch 2", "Branch 3"] } — for mind maps or concept webs
  - { "type": "stats", "items": [{ "value": "85%", "label": "Description" }, ...] } — for key statistics (2-4 items)
  - { "type": "steps", "items": ["Step 1", "Step 2", ...] } — for processes or sequences (3-6 steps)
  Do NOT include a visual on "title", "quiz", or "summary" slides.

The first slide should be type "title" with a compelling subtitle as the first bullet.
The second-to-last slide should be type "summary" with key takeaways.
${includeQuiz ? 'The last slide should be type "quiz" with grade-appropriate questions as bullets.' : 'The last slide should be type "summary".'}

IMPORTANT: Return ONLY the JSON array, no markdown, no code fences, no explanation.`;

    console.log("Generating presentation slides with AI...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: isArabic
            ? "أنت متخصص في المناهج الدراسية. أنشئ محتوى تعليمي يتناسب مع المستوى الأكاديمي للطالب بدقة من حيث المفردات والعمق والتعقيد. أرجع فقط JSON صالح بدون أي نص إضافي."
            : "You are a curriculum specialist who creates grade-appropriate educational content. Match vocabulary, depth, and complexity precisely to the student's grade level. Every bullet point must be substantive with specific facts and examples. Return only valid JSON with no additional text."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
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
