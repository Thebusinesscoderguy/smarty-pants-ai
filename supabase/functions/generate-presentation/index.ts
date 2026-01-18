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
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const isArabic = language === 'ar';
    
    const styleDescriptions: Record<string, string> = {
      educational: isArabic ? 'تعليمي رسمي مع تفسيرات واضحة' : 'Formal educational with clear explanations',
      fun: isArabic ? 'ممتع وتفاعلي مع رموز تعبيرية وأمثلة مرحة' : 'Fun and engaging with emojis and playful examples',
      visual: isArabic ? 'بصري مع تركيز على الصور والرسوم البيانية' : 'Visual focus with emphasis on diagrams and imagery',
      concise: isArabic ? 'موجز ومختصر مع نقاط رئيسية فقط' : 'Brief and to-the-point with key bullet points only'
    };

    const systemPrompt = isArabic
      ? `أنت مدرس خبير ينشئ عروض تقديمية تعليمية. أنشئ عرضًا تقديميًا بالعربية فقط. يجب أن يكون كل المحتوى بالعربية.`
      : `You are an expert educator creating educational presentations. Create engaging, age-appropriate content.`;

    const userPrompt = isArabic
      ? `أنشئ عرضًا تقديميًا تعليميًا عن "${topic}" للمستوى ${gradeLevel}.

المتطلبات:
- عدد الشرائح: ${slideCount} شريحة بالضبط
- النمط: ${styleDescriptions[style] || styleDescriptions.educational}
${includeQuiz ? '- أضف أسئلة اختبار في النهاية' : ''}
${includeExamples ? '- أضف أمثلة عملية وتمارين' : ''}

أرجع JSON بالتنسيق التالي:
{
  "title": "عنوان العرض",
  "slides": [
    {
      "slideNumber": 1,
      "title": "عنوان الشريحة",
      "content": ["نقطة 1", "نقطة 2", "نقطة 3"],
      "notes": "ملاحظات للمتحدث",
      "visualSuggestion": "اقتراح لصورة أو رسم بياني"
    }
  ],
  "quizQuestions": [
    {
      "question": "السؤال",
      "options": ["أ", "ب", "ج", "د"],
      "correctAnswer": "أ",
      "explanation": "شرح الإجابة"
    }
  ]
}`
      : `Create an educational presentation about "${topic}" for ${gradeLevel} level students.

Requirements:
- Number of slides: Exactly ${slideCount} slides
- Style: ${styleDescriptions[style] || styleDescriptions.educational}
${includeQuiz ? '- Include quiz questions at the end' : ''}
${includeExamples ? '- Include practical examples and exercises' : ''}

Structure the presentation logically:
1. Introduction/Hook slide
2. Main content slides (concepts, explanations)
3. Examples/Practice slides (if requested)
4. Summary/Key takeaways
5. Quiz slides (if requested)

Return JSON in this exact format:
{
  "title": "Presentation Title",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide Title",
      "content": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
      "notes": "Speaker notes for this slide",
      "visualSuggestion": "Suggestion for an image or diagram"
    }
  ],
  "quizQuestions": [
    {
      "question": "Quiz question text",
      "options": ["A) Option", "B) Option", "C) Option", "D) Option"],
      "correctAnswer": "A",
      "explanation": "Why this is correct"
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI API error:", status, errorText);
      throw new Error(`AI API error: ${status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from AI");
    }

    console.log("AI response received, attempting to parse...");

    // Parse JSON from response with robust error handling
    let presentationData;
    try {
      // Clean up common JSON issues
      let cleanedContent = content;
      
      // Remove markdown code blocks if present
      cleanedContent = cleanedContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      
      // Try to extract JSON object
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in response");
      }
      
      let jsonStr = jsonMatch[0];
      
      // Fix common JSON issues
      // Fix double opening braces: {{ -> {
      jsonStr = jsonStr.replace(/\{\s*\{/g, '{');
      // Fix double closing braces: }} -> }
      jsonStr = jsonStr.replace(/\}\s*\}/g, '}');
      // Remove trailing commas before closing brackets
      jsonStr = jsonStr.replace(/,\s*(\]|\})/g, '$1');
      // Fix unescaped newlines in strings
      jsonStr = jsonStr.replace(/:\s*"([^"]*)\n([^"]*)"/g, (match, p1, p2) => {
        return `: "${p1}\\n${p2}"`;
      });
      
      presentationData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("JSON parse error, attempting fallback...", parseError);
      
      // Fallback: Create a simple presentation structure
      const isArabic = language === 'ar';
      presentationData = {
        title: topic,
        slides: Array.from({ length: slideCount }, (_, i) => ({
          slideNumber: i + 1,
          title: isArabic ? `شريحة ${i + 1}` : `Slide ${i + 1}`,
          content: [isArabic ? 'جاري إنشاء المحتوى...' : 'Content being generated...'],
          notes: '',
          visualSuggestion: ''
        })),
        quizQuestions: []
      };
      
      // Try to extract any valid slide data from the malformed response
      try {
        const slidesMatch = content.match(/"slides"\s*:\s*\[([\s\S]*?)\]/);
        if (slidesMatch) {
          // Try to parse individual slides
          const slideRegex = /\{\s*"slideNumber"\s*:\s*(\d+)\s*,\s*"title"\s*:\s*"([^"]+)"/g;
          let match;
          let slideIndex = 0;
          while ((match = slideRegex.exec(content)) !== null && slideIndex < slideCount) {
            presentationData.slides[slideIndex].title = match[2];
            slideIndex++;
          }
        }
      } catch (e) {
        console.log("Could not extract partial slide data");
      }
    }

    // Validate and normalize the data
    if (!presentationData.slides || !Array.isArray(presentationData.slides)) {
      presentationData.slides = [];
    }

    // Ensure we have the requested number of slides
    while (presentationData.slides.length < slideCount) {
      presentationData.slides.push({
        slideNumber: presentationData.slides.length + 1,
        title: isArabic ? `شريحة ${presentationData.slides.length + 1}` : `Slide ${presentationData.slides.length + 1}`,
        content: [isArabic ? 'محتوى إضافي' : 'Additional content'],
        notes: '',
        visualSuggestion: ''
      });
    }

    // Trim if we have too many slides
    presentationData.slides = presentationData.slides.slice(0, slideCount);

    // Ensure each slide has required fields
    presentationData.slides = presentationData.slides.map((slide: any, idx: number) => ({
      slideNumber: idx + 1,
      title: slide.title || (isArabic ? `شريحة ${idx + 1}` : `Slide ${idx + 1}`),
      content: Array.isArray(slide.content) ? slide.content : [slide.content || ''],
      notes: slide.notes || '',
      visualSuggestion: slide.visualSuggestion || ''
    }));

    console.log("Presentation generated successfully with", presentationData.slides.length, "slides");

    return new Response(JSON.stringify(presentationData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating presentation:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate presentation" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
