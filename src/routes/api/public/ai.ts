import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createOpenAI } from "@ai-sdk/openai";
import { generateImage, streamText } from "ai";

const HELP = `You are the friendly help assistant for the Dooars Khabar news app (Dooars region, West Bengal, India).
Explain simply how to use the app: Home feed with category tabs; Upload (+ button) to post news with photo/video; edit or delete your own posts from the story page; Saved stories; Profile with Creator dashboard (views, likes, followers, and monetization progress; photo/video earnings require 1,000 followers and 2,000 watch hours); Follow writers from their stories; Settings for name, address, photo, language (English, Bengali, Hindi, Nepali), Help and Contact us; Ask about Dooars to ask questions about published stories.
Contact: sumitlohar992@gmail.com. Keep answers short. Reply in the user's language. If unsure, suggest contacting support.`;

type Msg = { role: "user" | "assistant"; content: string };
type AiRequest = {
  mode?: unknown;
  messages?: unknown;
  title?: unknown;
  category?: unknown;
};

export const Route = createFileRoute("/api/public/ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null) as AiRequest | null;
        if (!body) return Response.json({ error: "Invalid request." }, { status: 400 });

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "AI generation is not configured." }, { status: 503 });

        const openai = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
        });

        if (body.mode === "image") {
          const title = typeof body.title === "string" ? body.title.trim().slice(0, 150) : "";
          const category = typeof body.category === "string" ? body.category.trim().slice(0, 40) : "";
          if (!title) return Response.json({ error: "A headline is required." }, { status: 400 });

          const authorization = request.headers.get("authorization");
          if (!authorization?.startsWith("Bearer ")) {
            return Response.json({ error: "Sign in to generate an article image." }, { status: 401 });
          }
          const supabaseUrl = process.env["SUPABASE_URL"];
          const supabaseKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
          if (!supabaseUrl || !supabaseKey) {
            return Response.json({ error: "Authentication is not configured." }, { status: 503 });
          }
          const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data, error } = await supabase.auth.getClaims(authorization.slice("Bearer ".length));
          if (error || !data?.claims?.sub) {
            return Response.json({ error: "Your sign-in session is invalid." }, { status: 401 });
          }

          try {
            const result = await generateImage({
              model: openai.image("openai/gpt-image-1"),
              prompt: `Create a realistic editorial illustration for a local news article. Use no text, letters, logos, or watermarks. Represent the headline respectfully and factually without inventing identifiable people or details. Headline: ${title}${category ? `. Category: ${category}` : ""}.`,
              size: "1536x1024",
              n: 1,
              abortSignal: request.signal,
            });
            const imageBuffer = new ArrayBuffer(result.image.uint8Array.byteLength);
            new Uint8Array(imageBuffer).set(result.image.uint8Array);
            return new Response(imageBuffer, {
              headers: {
                "Content-Type": result.image.mediaType,
                "Cache-Control": "no-store",
              },
            });
          } catch (e) {
            return Response.json({ error: e instanceof Error ? e.message : "Image generation failed." }, { status: 502 });
          }
        }

        if (body.mode !== "help" && body.mode !== "ask") {
          return Response.json({ error: "Unsupported AI request." }, { status: 400 });
        }
        const mode = body.mode;
        const messages = Array.isArray(body.messages)
          ? body.messages.filter(
              (message): message is Msg =>
                !!message &&
                typeof message === "object" &&
                "role" in message &&
                (message.role === "user" || message.role === "assistant") &&
                "content" in message &&
                typeof message.content === "string",
            )
          : [];
        const history = (messages ?? []).slice(-10).map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));
        if (!history.length) return Response.json({ error: "No question" }, { status: 400 });
        let system = HELP;
        if (mode === "ask") {
          const q = history[history.length - 1]!.content;
          const words = q.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu)?.slice(0, 6) ?? [];
          const sb = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, { auth: { persistSession: false, autoRefreshToken: false } });
          let query = sb.from("articles").select("id,title,summary,body,created_at").order("created_at", { ascending: false }).limit(12);
          if (words.length) query = query.or(words.map((w) => `title.ilike.%${w.replace(/[,()%]/g, "")}%,body.ilike.%${w.replace(/[,()%]/g, "")}%`).join(","));
          let { data } = await query;
          if (!data?.length) data = (await sb.from("articles").select("id,title,summary,body,created_at").order("created_at", { ascending: false }).limit(12)).data;
          const ctx = (data ?? []).map((a) => `[${a.id}] ${a.title} (${a.created_at.slice(0, 10)})\n${(a.summary || a.body).slice(0, 600)}`).join("\n\n");
          system = `You answer questions about the Dooars region ONLY using the published Dooars Khabar stories below. If the stories do not contain the answer, say you could not find it in published stories. After each fact, cite the story as [story:ID] using its exact ID. Be brief. Reply in the user's language.\n\nSTORIES:\n${ctx}`;
        }
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
