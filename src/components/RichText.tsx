// Renders simple formatting: blank-line paragraphs, "## " headings, **bold**, *italic*.
function inline(s: string) {
  const parts = s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong>
    : p.startsWith("*") && p.endsWith("*") && p.length > 2 ? <em key={i}>{p.slice(1, -1)}</em>
    : p,
  );
}

export function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).filter((b) => b.trim());
  return (
    <div className="mt-4 space-y-4 text-[17px] leading-relaxed">
      {blocks.map((b, i) =>
        b.startsWith("## ") ? (
          <h3 key={i} className="text-xl font-bold">{b.slice(3)}</h3>
        ) : (
          <p key={i} className="whitespace-pre-line">{inline(b)}</p>
        ),
      )}
    </div>
  );
}
