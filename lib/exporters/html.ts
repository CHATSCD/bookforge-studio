import { escapeXml, textToHtml, inline } from "@/lib/text";
import type { ExportPayload } from "./epub";

export function buildHtml(p: ExportPayload): string {
  const toc = p.chapters
    .map((c, i) => `<li><a href="#ch${i + 1}">${escapeXml(c.title)}</a></li>`)
    .join("");

  const chapters = p.chapters
    .map((c, i) => `<section id="ch${i + 1}" class="chapter"><h1>${escapeXml(c.title)}</h1>${textToHtml(c.body)}</section>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<title>${escapeXml(p.title)}</title>
<style>
body { font-family: Georgia, serif; line-height: 1.6; max-width: 720px; margin: 0 auto; padding: 2em; color: #1a1a1a; }
.cover img { width: 100%; max-width: 380px; margin: 0 auto; display: block; }
.titlepage { text-align: center; margin: 4em 0; }
.titlepage h1 { font-size: 2.4em; margin-bottom: 0.2em; }
.titlepage .author { font-size: 1.2em; margin-top: 2em; }
.copyright { font-size: 0.85em; border-top: 1px solid #ccc; padding-top: 1em; }
.toc ul { list-style: none; padding: 0; }
.toc a { text-decoration: none; color: inherit; }
.dedication { text-align: center; font-style: italic; margin: 4em 0; }
.chapter h1 { text-align: center; margin: 3em 0 1.5em; page-break-before: always; }
p { text-align: justify; margin: 0 0 0.5em; text-indent: 1.25em; }
@media print { .chapter { page-break-before: always; } }
</style></head><body>
${p.coverDataUrl ? `<div class="cover"><img src="${p.coverDataUrl}" alt="Cover"/></div>` : ""}
<header class="titlepage">
  <h1>${escapeXml(p.title)}</h1>
  ${p.subtitle ? `<h2>${escapeXml(p.subtitle)}</h2>` : ""}
  <p class="author">${escapeXml(p.author)}</p>
</header>
${p.includeCopyright ? `<div class="copyright">${textToHtml(p.copyright)}</div>` : ""}
${p.includeToc ? `<nav class="toc"><h2>${escapeXml(p.tocTitle || "Contents")}</h2><ul>${toc}</ul></nav>` : ""}
${p.includeDedication && p.dedication ? `<div class="dedication"><p>${inline(p.dedication)}</p></div>` : ""}
${chapters}
</body></html>`;
}
