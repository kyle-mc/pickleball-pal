// Transcribes a voice memo describing a pickleball game and parses out the
// players + score. Uses Lovable AI Gateway (no extra API key needed).
//
// POST { audio: "base64", mimeType: "audio/webm", knownPlayers: string[] }
// → { transcript, parsed: { winners, losers, winningScore, losingScore } | null }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function bad(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Require authenticated caller to prevent abuse of AI credits
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return bad("Unauthorized", 401);
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) return bad("Unauthorized", 401);
  } catch {
    return bad("Unauthorized", 401);
  }

  let body: { audio?: string; mimeType?: string; knownPlayers?: string[] };
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON body");
  }
  if (!body?.audio || typeof body.audio !== "string") return bad("Missing audio");
  const mimeType = body.mimeType || "audio/webm";
  const knownPlayers = Array.isArray(body.knownPlayers) ? body.knownPlayers.slice(0, 200) : [];

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return bad("LOVABLE_API_KEY not configured", 500);

  const systemPrompt = `You are a transcription + structured extraction assistant for a pickleball app.
The user records a short voice memo describing the result of a single pickleball game.
Examples:
  "Chris and Braden beat Kyle and Stephen eleven to seven"
  "I lost to Billy eleven to four singles"

Step 1: transcribe the audio.
Step 2: extract the WINNING players, the LOSING players, and the score.

Player name matching:
- Match spoken names to this list of known players when possible (case-insensitive,
  forgiving of slight mishearings): ${JSON.stringify(knownPlayers)}.
- If a spoken name does not match the list closely, return it with the spoken
  capitalisation so the user can correct it.
- A doubles game has 2 winners + 2 losers. A singles game has 1 + 1.

Respond ONLY with strict JSON in this shape:
{
  "transcript": "<verbatim transcript>",
  "parsed": {
    "gameMode": "doubles" | "singles",
    "winners": ["Name", ...],
    "losers": ["Name", ...],
    "winningScore": <number>,
    "losingScore": <number>
  }
}
If you cannot confidently extract a structured result, set "parsed" to null but
still include the transcript.`;

  let aiResponse: Response;
  try {
    aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Here is the voice memo. Transcribe and extract." },
              {
                type: "input_audio",
                input_audio: {
                  data: body.audio,
                  format: mimeType.includes("mp3") ? "mp3"
                    : mimeType.includes("wav") ? "wav"
                    : mimeType.includes("m4a") || mimeType.includes("mp4") ? "m4a"
                    : "webm",
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
  } catch (e) {
    console.error("AI gateway fetch failed", e);
    return bad("AI gateway unreachable", 502);
  }

  if (!aiResponse.ok) {
    const text = await aiResponse.text();
    console.error("AI gateway error", aiResponse.status, text);
    if (aiResponse.status === 429) return bad("Rate limit exceeded, try again soon", 429);
    if (aiResponse.status === 402) return bad("AI credits exhausted — top up Lovable AI", 402);
    return bad(`AI error: ${aiResponse.status}`, 502);
  }

  const data = await aiResponse.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { transcript: content, parsed: null };
  }

  return new Response(JSON.stringify(parsed), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
