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
    const { subject, gradeLevel, type, difficulty, count } = await req.json();
    
    if (!subject || !gradeLevel || !count) {
      return new Response(
        JSON.stringify({ error: "Subject, gradeLevel, and count are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = `Generate ${count} ${difficulty} ${type} quest${count > 1 ? 's' : ''} for ${subject} at ${gradeLevel} level. Each quest should be unique and engaging.`;

    const systemPrompt = `You are a quest generation assistant. Generate educational quests based on provided parameters.

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
        tools: [
          {
            type: "function",
            function: {
              name: "generate_quests",
              description: `Generate ${count} quest${count > 1 ? 's' : ''} with structured data`,
              parameters: {
                type: "object",
                properties: {
                  quests: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        type: { type: "string", enum: ["daily", "weekly"] },
                        difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                        target_value: { type: "number" },
                        rewards: {
                          type: "object",
                          properties: {
                            xp: { type: "number" }
                          },
                          required: ["xp"]
                        },
                        requirements: { type: "object" }
                      },
                      required: ["title", "description", "type", "difficulty", "target_value", "rewards", "requirements"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["quests"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_quests" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const data = JSON.parse(toolCall.function.arguments);
    const quests = data.quests || [];

    return new Response(
      JSON.stringify({ quests }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-quest error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
