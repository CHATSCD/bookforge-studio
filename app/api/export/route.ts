import { NextRequest, NextResponse } from "next/server";
import { buildEpub } from "@/lib/exporters/epub";
import { buildPdf } from "@/lib/exporters/pdf";
import { buildDocx } from "@/lib/exporters/docx";
import { buildHtml } from "@/lib/exporters/html";
import { copyrightText } from "@/lib/frontmatter";
import type { Settings } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const format = (req.nextUrl.searchParams.get("format") || "epub").toLowerCase();
  const body = await req.json();
  const s: Settings = body.settings || {};
  const chapters = Array.isArray(body.chapters) && body.chapters.length
    ? body.chapters
    : [{ title: body.title || "Manuscript", body: body.rawText || "" }];

  const characters = Array.isArray(body.characters)
    ? body.characters.map((c: any) => ({
        name: c.name || "Unnamed",
        role: c.role || "Other",
        appearance: c.appearance || "",
        personality: c.personality || "",
        backstory: c.backstory || "",
      }))
    : [];

  const payload = {
    title: body.title || "Untitled",
    subtitle: body.subtitle || "",
    author: body.author || "Unknown Author",
    chapters,
    characters,
    includeCopyright: s.includeCopyright !== false,
    includeDedication: s.includeDedication === true,
    includeToc: s.includeToc !== false,
    includeDramatisPersonae: s.includeDramatisPersonae === true,
    dramatisTitle: s.dramatisTitle || "Dramatis Personae",
    copyright: body.copyright || copyrightText(s),
    dedication: body.dedication || s.dedication || "",
    coverDataUrl: body.coverDataUrl || undefined,
    blurb: s.blurb || "",
    tocTitle: s.tocTitle || "Contents",
  };

  const slug =
    (body.title || "book").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "book";

  let buffer: Uint8Array;
  let mime: string;
  let ext: string;

  switch (format) {
    case "pdf":
      buffer = await buildPdf(payload);
      mime = "application/pdf";
      ext = "pdf";
      break;
    case "docx":
      buffer = new Uint8Array(await buildDocx(payload));
      mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      ext = "docx";
      break;
    case "html":
      buffer = new TextEncoder().encode(buildHtml(payload));
      mime = "text/html";
      ext = "html";
      break;
    case "txt": {
      const txt = payload.chapters
        .map((c: any) => `${c.title.toUpperCase()}\n\n${c.body}`)
        .join("\n\n\n");
      buffer = new TextEncoder().encode(txt);
      mime = "text/plain";
      ext = "txt";
      break;
    }
    case "epub":
    default:
      buffer = await buildEpub(payload);
      mime = "application/epub+zip";
      ext = "epub";
      break;
  }

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${slug}.${ext}"`,
    },
  });
}
