export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function inline(s: string): string {
  return escapeXml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

/** Convert plain manuscript text into HTML paragraphs. */
export function textToHtml(text: string): string {
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) {
      out.push(`<p>${para.map((l) => inline(l)).join(" ")}</p>`);
      para = [];
    }
  };
  for (const line of lines) {
    const t = line.trim();
    if (!t) { flush(); continue; }
    if (/^#{2,4}\s/.test(t)) {
      flush();
      out.push(`<h2>${inline(t.replace(/^#+\s*/, ""))}</h2>`);
      continue;
    }
    if (/^[-*_]{3,}$/.test(t)) {
      flush();
      out.push("<hr/>");
      continue;
    }
    para.push(t);
  }
  flush();
  return out.join("\n");
}
