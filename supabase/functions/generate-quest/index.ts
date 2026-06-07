import { buildCorsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

let corsHeaders = buildCorsHeaders();

serve(async (req) => {
  corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("generate-quest: Request received");
    const body = await req.json();
    // SECURITY (sensitive logging): avoid dumping the full request body; log keys only.
    console.log("generate-quest: Body parsed, keys:", Object.keys(body ?? {}));
    
    const { subject, gradeLevel, type, difficulty, count, language } = body;
    
    if (!subject || !gradeLevel || !count) {
      console.error("generate-quest: Missing required fields", { subject, gradeLevel, count });
      return new Response(
        JSON.stringify({ error: "Subject, gradeLevel, and count are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    function getLanguageName(code: string): string {
      const languages: Record<string, string> = {
        'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German', 'it': 'Italian',
        'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese', 'ko': 'Korean', 'zh': 'Chinese',
        'ar': 'Arabic', 'hi': 'Hindi', 'tr': 'Turkish', 'pl': 'Polish', 'nl': 'Dutch'
      };
      return languages[code] || 'English';
    }

    const targetLanguage = language && language !== 'en' ? getLanguageName(language) : null;
    const languageInstruction = targetLanguage 
      ? ` Generate quest titles and descriptions in ${targetLanguage}.`
      : '';

    const userPrompt = `Generate ${count} ${difficulty} ${type} quest${count > 1 ? 's' : ''} for ${subject} at ${gradeLevel} level. Each quest should be unique and engaging.${languageInstruction}`;

    const systemPrompt = `You are a quest generation assistant. Generate educational quests based on provided parameters.${targetLanguage ? ` When generating quests, write all text (titles and descriptions) in ${targetLanguage}.` : ''}

For each quest, return a JSON object with this exact structure:
{
  "title": "Quest title (concise, engaging)",
  "description": "Quest description (what the student needs to do)",
  "type": "daily" or "weekly" (use the provided type),
  "difficulty": "easy", "medium", or "hard" (use the provided difficulty),
  "target_value": number (how many times to complete the task, typically 1-5 for daily, 3-10 for weekly),
  "rewards": { "xp": number (10 for easy, 25 for medium, 50 for hard) },
  "requirements": {}
}

Make quests:
- Educational and aligned with the subject and grade level
- Achievable and motivating
- Age-appropriate for the grade level
- Varied and engaging`;

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("generate-quest: OPENAI_API_KEY is not configured");
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const safeCount = typeof count === "number" ? count : parseInt(String(count), 10);
    if (!Number.isFinite(safeCount) || safeCount < 1 || safeCount > 10) {
      return new Response(
        JSON.stringify({ error: "count must be a number between 1 and 10" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedType = String(type || "daily").toLowerCase() === "weekly" ? "weekly" : "daily";
    const normalizedDifficulty = (() => {
      const d = String(difficulty || "medium").toLowerCase();
      if (d === "easy" || d === "hard") return d;
      return "medium";
    })();

    const toolSchema = {
      type: "object",
      properties: {
        quests: {
          type: "array",
          minItems: 1,
          maxItems: safeCount,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              type: { type: "string", enum: ["daily", "weekly"] },
              difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
              target_value: { type: "number" },
              rewards: {
                type: "object",
                additionalProperties: false,
                properties: {
                  xp: { type: "number" }
                },
                required: ["xp"]
              },
              requirements: { type: "object" }
            },
            required: [
              "title",
              "description",
              "type",
              "difficulty",
              "target_value",
              "rewards",
              "requirements"
            ]
          }
        }
      },
      required: ["quests"],
      additionalProperties: false
    } as const;

    console.log("generate-quest: Calling OpenAI for", safeCount, "quests");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Generate ${safeCount} ${normalizedDifficulty} ${normalizedType} quest${safeCount > 1 ? "s" : ""} for ${subject} at ${gradeLevel} level. Each quest should be unique and engaging.${languageInstruction}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_quests",
              description: `Generate ${safeCount} quest${safeCount > 1 ? "s" : ""} with structured data`,
              parameters: toolSchema
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_quests" } },
        temperature: 0.7,
        max_tokens: 1200
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("generate-quest: OpenAI error", response.status, errorText);

      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: "OpenAI authentication error. Check OPENAI_API_KEY." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "OpenAI request failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("generate-quest: No tool call arguments", JSON.stringify(result));
      throw new Error("AI did not return structured quest data");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("generate-quest: Failed to parse tool arguments", toolCall.function.arguments);
      throw new Error("Failed to parse AI response");
    }

    const quests = Array.isArray(parsed?.quests) ? parsed.quests : [];

    console.log("generate-quest: Successfully generated", quests.length, "quests");
    return new Response(JSON.stringify({ quests }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("generate-quest error:", error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
