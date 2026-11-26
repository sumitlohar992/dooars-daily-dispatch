import { describe, expect, it } from "vitest";
import { parseGoogleNewsItems } from "./google-news.server";

describe("Google News RSS parsing", () => {
  it("preserves localized headlines and records the source language", () => {
    const xml = `
      <item>
        <title>জলপাইগুড়িতে খবর &amp; আপডেট - Publisher</title>
        <link>https://news.google.com/rss/articles/example</link>
        <source url="https://publisher.example">Publisher</source>
        <description>স্থানীয় খবর</description>
        <pubDate>Thu, 26 Nov 2026 18:00:00 GMT</pubDate>
      </item>`;

    expect(parseGoogleNewsItems(xml, "Local", "bn")).toMatchObject([
      {
        title: "জলপাইগুড়িতে খবর & আপডেট",
        source_url: "https://news.google.com/rss/articles/example",
        source_language: "bn",
        category: "Local",
      },
    ]);
  });

  it("imports up to 100 items from a language feed", () => {
    const items = Array.from(
      { length: 101 },
      (_, index) => `
        <item>
          <title>Headline ${index}</title>
          <link>https://news.google.com/rss/articles/${index}</link>
        </item>`,
    ).join("");

    const parsed = parseGoogleNewsItems(items, "Local", "hi");

    expect(parsed).toHaveLength(100);
    expect(parsed[0]?.source_language).toBe("hi");
  });
});
