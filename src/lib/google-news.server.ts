import type { NewsLanguage } from "@/lib/news";

// Pulls Dooars-region stories and category-based international stories from Google News RSS.
const LOCAL_FEEDS = [
  {
    category: "Local",
    language: "en",
    query: "Dooars OR Jalpaiguri OR Alipurduar OR Siliguri",
    hl: "en-IN",
    gl: "IN",
    ceid: "IN:en",
  },
  {
    category: "Local",
    language: "bn",
    query: "ডুয়ার্স OR জলপাইগুড়ি OR আলিপুরদুয়ার OR শিলিগুড়ি",
    hl: "bn-IN",
    gl: "IN",
    ceid: "IN:bn",
  },
  {
    category: "Local",
    language: "hi",
    query: "डुआर्स OR जलपाईगुड़ी OR अलीपुरद्वार OR सिलीगुड़ी",
    hl: "hi-IN",
    gl: "IN",
    ceid: "IN:hi",
  },
] as const;

const CATEGORY_FEEDS = [
  {
    category: "West Bengal",
    language: "en",
    query: "West Bengal news",
    hl: "en-IN",
    gl: "IN",
    ceid: "IN:en",
  },
  {
    category: "National",
    language: "en",
    query: "India news",
    hl: "en-IN",
    gl: "IN",
    ceid: "IN:en",
  },
  {
    category: "Politics",
    language: "en",
    query: "world politics OR international politics",
    hl: "en-US",
    gl: "US",
    ceid: "US:en",
  },
  {
    category: "Sports",
    language: "en",
    topic: "SPORTS",
    hl: "en-US",
    gl: "US",
    ceid: "US:en",
  },
  {
    category: "Entertainment",
    language: "en",
    topic: "ENTERTAINMENT",
    hl: "en-US",
    gl: "US",
    ceid: "US:en",
  },
  {
    category: "Business",
    language: "en",
    topic: "BUSINESS",
    hl: "en-US",
    gl: "US",
    ceid: "US:en",
  },
  {
    category: "Health",
    language: "en",
    topic: "HEALTH",
    hl: "en-US",
    gl: "US",
    ceid: "US:en",
  },
] as const;

type Feed = (typeof LOCAL_FEEDS)[number] | (typeof CATEGORY_FEEDS)[number];
type ImportedArticle = {
  title: string;
  source_url: string;
  source_name: string;
  author_name: string;
  category: string;
  source_language: NewsLanguage;
  image_url: string | null;
  summary: string | null;
  body: string;
  created_at: string;
};

function feedUrl(feed: Feed) {
  const params = new URLSearchParams({ hl: feed.hl, gl: feed.gl, ceid: feed.ceid });
  if ("topic" in feed) {
    return `https://news.google.com/rss/headlines/section/topic/${feed.topic}?${params}`;
  }
  params.set("q", feed.query);
  return `https://news.google.com/rss/search?${params}`;
}

function decode(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}
const tag = (xml: string, name: string) => {
  const m = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(xml);
  return m ? decode(m[1]!).trim() : "";
};

function imageUrl(xml: string) {
  const candidates = [
    /<(?:media:content|media:thumbnail|enclosure)\b[^>]*\burl=["']([^"']+)["']/i.exec(xml)?.[1],
    ...["description", "content:encoded"].map(
      (name) => /<img\b[^>]*\bsrc=["']([^"']+)["']/i.exec(tag(xml, name))?.[1],
    ),
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const url = decode(candidate);
    if (/^https?:\/\//i.test(url)) return url;
  }
  return null;
}

export function parseGoogleNewsItems(
  xml: string,
  category: string,
  language: NewsLanguage,
): ImportedArticle[] {
  const items: ImportedArticle[] = [];
  for (const chunk of xml.split("<item>").slice(1, 101)) {
    const source = tag(chunk, "source") || "Google News";
    let title = tag(chunk, "title");
    if (title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
    const desc = tag(chunk, "description")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const sourceUrl = tag(chunk, "link");
    if (!title || !sourceUrl) continue;
    const pub = tag(chunk, "pubDate");
    const parsedDate = pub ? new Date(pub) : null;
    items.push({
      title: title.slice(0, 300),
      source_url: sourceUrl,
      source_name: source,
      author_name: source,
      category,
      source_language: language,
      image_url: imageUrl(chunk),
      summary: desc && desc !== title ? desc.slice(0, 280) : null,
      body: `${desc || title}\n\nThis story was found automatically on Google News. Tap "Read full story" to open it on ${source}.`,
      created_at:
        parsedDate && !Number.isNaN(parsedDate.getTime())
          ? parsedDate.toISOString()
          : new Date().toISOString(),
    });
  }
  return items;
}

export async function importGoogleNews() {
  const feeds: readonly Feed[] = [...LOCAL_FEEDS, ...CATEGORY_FEEDS];
  const responses = await Promise.allSettled(
    feeds.map(async (feed) => {
      const res = await fetch(feedUrl(feed), {
        headers: { "user-agent": "Mozilla/5.0 DooarsKhabar" },
      });
      if (!res.ok) throw new Error(`Google News feed failed [${res.status}] (${feed.hl})`);
      return {
        xml: await res.text(),
        category: feed.category,
        language: feed.language,
      };
    }),
  );
  const xmlFeeds = responses.flatMap((response) => {
    if (response.status === "fulfilled") return [response.value];
    console.warn("Google News feed failed", response.reason);
    return [];
  });
  if (!xmlFeeds.length) throw new Error("All Google News feeds failed");

  const byUrl = new Map<string, ImportedArticle>();
  for (const { xml, category, language } of xmlFeeds) {
    for (const item of parseGoogleNewsItems(xml, category, language)) {
      const existing = byUrl.get(item.source_url);
      if (!existing || (!existing.image_url && item.image_url)) byUrl.set(item.source_url, item);
    }
  }
  const items = [...byUrl.values()];

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("articles")
    .upsert(items, { onConflict: "source_url", ignoreDuplicates: true })
    .select("id");
  if (error) throw new Error(error.message);
  const updates = await Promise.all(
    items.map(async (item) => {
      const results = await Promise.all([
        item.image_url
          ? supabaseAdmin
              .from("articles")
              .update({ image_url: item.image_url })
              .eq("source_url", item.source_url)
              .is("image_url", null)
          : Promise.resolve({ error: null }),
        supabaseAdmin
          .from("articles")
          .update({ source_language: item.source_language })
          .eq("source_url", item.source_url)
          .is("source_language", null),
      ]);
      return results.find((result) => result.error)?.error;
    }),
  );
  const updateError = updates.find((error) => error);
  if (updateError) throw new Error(updateError.message);
  return { found: items.length, added: data?.length ?? 0 };
}
