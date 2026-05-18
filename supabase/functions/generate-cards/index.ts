import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic } = await req.json();
    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert educator. Given a topic, generate 28-35 high-quality flashcards organized into 5-7 subtopics, with 4-6 cards per subtopic. Each card must be substantive, specific, and non-redundant — go deep into fundamentals, intermediate concepts, advanced topics, real-world applications, history, edge cases, common misconceptions, and notable examples. Avoid surface-level or duplicate questions. Return ONLY a valid JSON object (no markdown, no code fences) with this exact structure:
{
  "topic": "the topic",
  "cards": [
    {
      "id": "unique-id-1",
      "title": "Short card title",
      "question": "Clear question text",
      "answer": "Comprehensive answer (2-4 sentences)",
      "subtopic": "Subtopic Name",
      "difficulty": null,
      "source": "https://en.wikipedia.org/wiki/relevant_article"
    }
  ]
}
Use numbered IDs like "1", "2", etc. Include real Wikipedia or educational source URLs when possible. Generate 4-6 distinct, non-overlapping cards per subtopic. Each answer should be 3-5 sentences with concrete details, examples, or mechanisms — not generic definitions. Cover the topic thoroughly from fundamentals to advanced concepts, including practical applications, common misconceptions, historical context, and edge cases.`
          },
          { role: "user", content: `Generate flashcards for the topic: "${topic}"` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_flashcards",
              description: "Generate structured flashcards for a learning topic",
              parameters: {
                type: "object",
                properties: {
                  topic: { type: "string" },
                  cards: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        title: { type: "string" },
                        question: { type: "string" },
                        answer: { type: "string" },
                        subtopic: { type: "string" },
                        difficulty: { type: "string", nullable: true },
                        source: { type: "string" }
                      },
                      required: ["id", "title", "question", "answer", "subtopic", "source"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["topic", "cards"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_flashcards" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    
    // Extract from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let cards;
    if (toolCall) {
      cards = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing content directly
      const content = data.choices?.[0]?.message?.content || "";
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      cards = JSON.parse(cleaned);
    }

    // Ensure difficulty is null for all cards
    if (cards.cards) {
      cards.cards = cards.cards.map((c: any) => ({ ...c, difficulty: null }));
    }

    return new Response(JSON.stringify(cards), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-cards error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
