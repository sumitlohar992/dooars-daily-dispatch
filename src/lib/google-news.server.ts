// Pulls Dooars-region stories from the Google News RSS feed and saves new ones as articles.
const FEED =
  "https://news.google.com/rss/search?q=" +
  encodeURIComponent("Dooars OR Jalpaiguri OR Alipurduar OR Siliguri") +
  "&hl=en-IN&gl=IN&ceid=IN:en";

function decode(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
}
const tag = (xml: string, name: string) => {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(xml);
  return m ? decode(m[1]!).trim() : "";
};

function imageUrl(xml: string) {
  const candidates = [
    /<(?:media:content|media:thumbnail|enclosure)\b[^>]*\burl=["']([^"']+)["']/i.exec(xml)?.[1],
    /<img\b[^>]*\bsrc=["']([^"']+)["']/i.exec(tag(xml, "description"))?.[1],
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const url = decode(candidate);
    if (/^https?:\/\//i.test(url)) return url;
  }
  return null;
}

export async function importGoogleNews() {
  const res = await fetch(FEED, { headers: { "user-agent": "Mozilla/5.0 DooarsKhabar" } });
  if (!res.ok) throw new Error(`Google News feed failed [${res.status}]`);
  const xml = await res.text();
  const items = xml.split("<item>").slice(1, 41).map((chunk) => {
    const source = tag(chunk, "source") || "Google News";
    let title = tag(chunk, "title");
    if (title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
    const desc = tag(chunk, "description").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const pub = tag(chunk, "pubDate");
    return {
      title: title.slice(0, 300),
      source_url: tag(chunk, "link"),
      source_name: source,
      author_name: source,
      category: "Local",
      image_url: imageUrl(chunk),
      summary: desc && desc !== title ? desc.slice(0, 280) : null,
      body: `${desc || title}\n\nThis story was found automatically on Google News. Tap "Read full story" to open it on ${source}.`,
      created_at: pub ? new Date(pub).toISOString() : new Date().toISOString(),
    };
  }).filter((i) => i.title && i.source_url);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("articles")
    .upsert(items, { onConflict: "source_url", ignoreDuplicates: true })
    .select("id");
  if (error) throw new Error(error.message);
  const imageUpdates = await Promise.all(
    items.filter((item) => item.image_url).map((item) =>
      supabaseAdmin.from("articles").update({ image_url: item.image_url }).eq("source_url", item.source_url).is("image_url", null),
    ),
  );
  const imageError = imageUpdates.find((result) => result.error)?.error;
  if (imageError) throw new Error(imageError.message);
  return { found: items.length, added: data?.length ?? 0 };
}
