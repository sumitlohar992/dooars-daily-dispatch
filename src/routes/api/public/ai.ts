import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const HELP = `You are the friendly help assistant for the Dooars Khabar news app (Dooars region, West Bengal, India).
Explain simply how to use the app: Home feed with category tabs and Refresh button; Upload (+ button) to post news with photo/video; edit or delete your own posts from the story page; Saved stories; Profile with My dashboard (views, likes, followers; partner program unlocks at 500 followers); Follow writers from their stories; Settings for name, address, photo, language (English, Bengali, Hindi, Nepali), Help and Contact us; Ask about Dooars to ask questions about published stories.
Contact: sumitlohar992@gmail.com. Keep answers short. Reply in the user's language. If unsure, suggest contacting support.`;

type Msg = { role: "user" | "assistant"; content: string };

export const Route = createFileRoute("/api/public/ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { mode, messages } = (await request.json()) as { mode: "help" | "ask"; messages: Msg[] };
        const history = (messages ?? []).slice(-10).map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));
        if (!history.length) return Response.json({ error: "No question" }, { status: 400 });
        let system = HELP;
        if (mode === "ask") {
          const q = history[history.length - 1]!.content;
          const words = q.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu)?.slice(0, 6) ?? [];
          const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
          let query = sb.from("articles").select("id,title,summary,body,created_at").order("created_at", { ascending: false }).limit(12);
          if (words.length) query = query.or(words.map((w) => `title.ilike.%${w.replace(/[,()%]/g, "")}%,body.ilike.%${w.replace(/[,()%]/g, "")}%`).join(","));
          let { data } = await query;
          if (!data?.length) data = (await sb.from("articles").select("id,title,summary,body,created_at").order("created_at", { ascending: false }).limit(12)).data;
          const ctx = (data ?? []).map((a) => `[${a.id}] ${a.title} (${a.created_at.slice(0, 10)})\n${(a.summary || a.body).slice(0, 600)}`).join("\n\n");
          system = `You answer questions about the Dooars region ONLY using the published Dooars Khabar stories below. If the stories do not contain the answer, say you could not find it in published stories. After each fact, cite the story as [story:ID] using its exact ID. Be brief. Reply in the user's language.\n\nSTORIES:\n${ctx}`;
        }
        const openai = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey: process.env.LOVABLE_API_KEY!,
          headers: { "Lovable-API-Key": process.env.LOVABLE_API_KEY!, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
        });
        try {
          const result = streamText({
            model: openai.responses("openai/gpt-6-astra"),
            system,
            messages: history,
            providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", store: false } },
            abortSignal: request.signal,
          });
          return result.toTextStreamResponse();
        } catch (e) {
          return Response.json({ error: (e as Error).message }, { status: 502 });
        }
      },
    },
  },
});
