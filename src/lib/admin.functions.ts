import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureSuccess(result: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await result;
  if (error) throw new Error(error.message);
}

export const fetchGoogleNewsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Only the app owner can do this");
    const { importGoogleNews } = await import("./google-news.server");
    return importGoogleNews();
  });

async function wipeUser(userId: string) {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const { data: arts, error: articlesError } = await db
    .from("articles")
    .select("id")
    .eq("author_id", userId);
  if (articlesError) throw new Error(articlesError.message);
  const ids = (arts ?? []).map((a) => a.id);
  if (ids.length) {
    await ensureSuccess(db.from("comments").delete().in("article_id", ids));
    await ensureSuccess(db.from("reactions").delete().in("article_id", ids));
    await ensureSuccess(db.from("bookmarks").delete().in("article_id", ids));
    await ensureSuccess(db.from("articles").delete().in("id", ids));
  }
  await ensureSuccess(db.from("comments").delete().eq("user_id", userId));
  await ensureSuccess(db.from("reactions").delete().eq("user_id", userId));
  await ensureSuccess(db.from("bookmarks").delete().eq("user_id", userId));
  await ensureSuccess(
    db.from("follows").delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`),
  );
  await ensureSuccess(
    db.from("messages").delete().or(`sender_id.eq.${userId},recipient_id.eq.${userId}`),
  );
  await ensureSuccess(db.from("user_details").delete().eq("user_id", userId));
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
  .validator((d: { userId: string; reason?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Only the app owner can do this");
    if (data.userId === context.userId) throw new Error("You can't remove yourself");
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: u, error: userError } = await db.auth.admin.getUserById(data.userId);
    if (userError) throw new Error(userError.message);
    const email = u.user?.email?.toLowerCase();
    if (email) {
      const { error } = await db
        .from("banned_emails")
        .upsert({ email, reason: data.reason ?? "Policy violation" });
      if (error) throw new Error(error.message);
    }
    await wipeUser(data.userId);
    return { ok: true, emailBlocked: !!email };
  });
