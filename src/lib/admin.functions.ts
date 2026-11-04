import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const fetchGoogleNewsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Only the app owner can do this");
    const { importGoogleNews } = await import("./google-news.server");
    return importGoogleNews();
  });

async function wipeUser(userId: string) {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const { data: arts } = await db.from("articles").select("id").eq("author_id", userId);
  const ids = (arts ?? []).map((a) => a.id);
  if (ids.length) {
    await db.from("comments").delete().in("article_id", ids);
    await db.from("reactions").delete().in("article_id", ids);
    await db.from("bookmarks").delete().in("article_id", ids);
    await db.from("articles").delete().in("id", ids);
  }
  await db.from("comments").delete().eq("user_id", userId);
  await db.from("reactions").delete().eq("user_id", userId);
  await db.from("bookmarks").delete().eq("user_id", userId);
  await db.from("follows").delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`);
  await db.from("messages").delete().or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
  await db.from("user_details").delete().eq("user_id", userId);
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  return db;
}

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await wipeUser(context.userId);
    return { ok: true };
  });

export const banUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; reason?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Only the app owner can do this");
    if (data.userId === context.userId) throw new Error("You can't remove yourself");
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: u } = await db.auth.admin.getUserById(data.userId);
    const email = u.user?.email?.toLowerCase();
    if (email) await db.from("banned_emails").upsert({ email, reason: data.reason ?? "Broke the terms" });
    await wipeUser(data.userId);
    return { ok: true };
  });
