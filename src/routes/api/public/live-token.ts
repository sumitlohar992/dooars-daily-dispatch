import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { AccessToken } from "livekit-server-sdk";

export const Route = createFileRoute("/api/public/live-token")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = process.env["LIVEKIT_URL"];
        const apiKey = process.env["LIVEKIT_API_KEY"];
        const apiSecret = process.env["LIVEKIT_API_SECRET"];
        if (!url || !apiKey || !apiSecret) {
          return Response.json(
            { error: "Live streaming is not configured. Add LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET." },
            { status: 503 },
          );
        }

        const body = await request.json().catch(() => ({})) as { role?: "publisher" | "viewer"; roomName?: string };
        const role = body.role === "publisher" ? "publisher" : "viewer";
        const roomName = (body.roomName || "dooars-live").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "dooars-live";

        let identity = `viewer-${crypto.randomUUID()}`;
        let name = "Viewer";
        if (role === "publisher") {
          const auth = request.headers.get("authorization");
          if (!auth?.startsWith("Bearer ")) {
            return Response.json({ error: "Sign in before starting a live broadcast." }, { status: 401 });
          }

          const supabaseUrl = process.env["SUPABASE_URL"];
          const supabaseKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
          if (!supabaseUrl || !supabaseKey) {
            return Response.json({ error: "Authentication is not configured." }, { status: 503 });
          }

          const token = auth.slice("Bearer ".length);
          const sb = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { data, error } = await sb.auth.getClaims(token);
          if (error || !data?.claims?.sub) {
            return Response.json({ error: "Your sign-in session is invalid." }, { status: 401 });
          }
          identity = data.claims.sub;
          name = String(data.claims["name"] || data.claims["email"] || "Reporter").slice(0, 80);
        }

        const at = new AccessToken(apiKey, apiSecret, {
          identity,
          name,
          ttl: "2h",
        });
        at.addGrant({
          roomJoin: true,
          room: roomName,
          canPublish: role === "publisher",
          canPublishData: true,
          canSubscribe: true,
        });

        return Response.json({
          token: await at.toJwt(),
          url,
          roomName,
          canPublish: role === "publisher",
        });
      },
    },
  },
});
