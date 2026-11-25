import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Send, Loader2, LifeBuoy, MapPin } from "lucide-react";
import { Header, Page } from "@/components/AppShell";

export const Route = createFileRoute("/assistant")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s["mode"] === "ask" ? ("ask" as const) : ("help" as const),
  }),
  head: () => ({
    meta: [
      { title: "Help & Ask about Dooars — Dooars Khabar" },
      {
        name: "description",
        content:
          "Get help with the app or ask questions answered from published Dooars Khabar stories.",
      },
      { property: "og:title", content: "Dooars Khabar assistant" },
      {
        property: "og:description",
        content: "App help and answers from published Dooars stories.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; content: string };

function renderAnswer(text: string): ReactNode[] {
  return text.split(/(\[story:[0-9a-f-]{36}\])/g).map((part, i) => {
    const m = part.match(/^\[story:([0-9a-f-]{36})\]$/);
    return m ? (
      <Link
        key={i}
        to="/article/$id"
        params={{ id: m[1]! }}
        className="mx-0.5 rounded bg-sky-soft px-1.5 text-xs font-bold text-primary"
      >
        story
      </Link>
    ) : (
      <span key={i}>{part}</span>
    );
  });
}

function AssistantPage() {
  const { mode } = Route.useSearch();
  const nav = Route.useNavigate();
  const [chats, setChats] = useState<Record<string, Msg[]>>({ help: [], ask: [] });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const msgs = chats[mode]!;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setChats((c) => ({ ...c, [mode]: [...next, { role: "assistant", content: "" }] }));
    setInput("");
    setBusy(true);
    const put = (content: string) =>
      setChats((c) => ({ ...c, [mode]: [...next, { role: "assistant", content }] }));
    try {
      const res = await fetch("/api/public/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, messages: next }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        put(
          res.status === 429
            ? "Too many questions right now — please try again in a minute."
            : (err as { error?: string }).error || "Sorry, the assistant is unavailable right now.",
        );
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        put(text);
      }
      if (!text) put("Sorry, I couldn't answer that.");
    } catch {
      put("Network problem — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header title={mode === "ask" ? "Ask about Dooars" : "Help"} />
      <Page>
        <div className="grid grid-cols-2 gap-2 p-4">
          {(["help", "ask"] as const).map((m) => (
            <button
              key={m}
              onClick={() => nav({ search: { mode: m } })}
              className={`flex items-center justify-center gap-2 rounded-full py-2 text-sm font-bold ${mode === m ? "bg-sky text-secondary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {m === "help" ? <LifeBuoy className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              {m === "help" ? "App help" : "Ask about Dooars"}
            </button>
          ))}
        </div>
        <div className="space-y-3 px-4 pb-32">
          {!msgs.length && (
            <p className="rounded-2xl bg-sky-soft p-4 text-sm text-primary">
              {mode === "help"
                ? "Ask anything about using Dooars Khabar — posting news, saving stories, settings…"
                : "Ask about events in the Dooars. Answers come only from stories published in this app, with links to them."}
            </p>
          )}
          {msgs.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-primary-foreground"
                  : "max-w-[95%] whitespace-pre-wrap text-[15px] leading-relaxed"
              }
            >
              {m.role === "assistant" ? (
                m.content ? (
                  renderAnswer(m.content)
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )
              ) : (
                m.content
              )}
            </div>
          ))}
        </div>
        <form
          onSubmit={send}
          className="fixed inset-x-0 bottom-16 z-30 mx-auto flex max-w-xl gap-2 border-t bg-card p-3 md:max-w-3xl"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={500}
            placeholder="Type your question…"
            className="h-11 flex-1 rounded-full border bg-background px-4 outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            disabled={busy}
            aria-label="Send"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </Page>
    </>
  );
}
