import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { ExportPayload } from "./epub";

const W = 432; // 6x9in at 72dpi
const H = 648;
const M = 54; // 0.75in margin

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

export async function buildPdf(p: ExportPayload): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const dark = rgb(0.1, 0.1, 0.1);

  let page = doc.addPage([W, H]);
  let y = H - M;
  const newPage = () => {
    page = doc.addPage([W, H]);
    y = H - M;
  };
  const need = (h: number) => {
    if (y - h < M) newPage();
  };
  const drawLines = (lines: string[], size: number, f: PDFFont, opts: { center?: boolean } = {}) => {
    const lh = size * 1.5;
    for (const ln of lines) {
      need(lh);
      const w = f.widthOfTextAtSize(ln, size);
      page.drawText(ln, { x: opts.center ? (W - w) / 2 : M, y: y - size, size, font: f, color: dark });
      y -= lh;
    }
  };
  const para = (text: string, size: number, opts: { center?: boolean; indent?: boolean; gap?: number; bold?: boolean } = {}) => {
    const f = opts.bold ? bold : font;
    const maxW = W - M * 2 - (opts.indent ? size * 1.25 : 0);
    const prefix = opts.indent ? " ".repeat(4) : "";
    const lines = wrap(prefix + text.trim(), f, size, maxW);
    drawLines(lines, size, f, opts);
    y -= opts.gap ?? 5;
  };

  // Cover
  if (p.coverDataUrl) {
    const b64 = p.coverDataUrl.split(",")[1];
    const img = await doc.embedPng(Buffer.from(b64, "base64"));
    newPage();
    page.drawImage(img, { x: 0, y: 0, width: W, height: H });
  }

  // Title page
  newPage();
  y = H * 0.45;
  drawLines(wrap(p.title, bold, 30, W - M * 2), 30, bold, { center: true });
  if (p.subtitle) {
    y += 10;
    drawLines(wrap(p.subtitle, font, 16, W - M * 2), 16, font, { center: true });
  }
  y = H * 0.3;
  drawLines(wrap(p.author, font, 18, W - M * 2), 18, font, { center: true });

  // Copyright
  if (p.includeCopyright) {
    newPage();
    for (const block of p.copyright.split("\n\n")) para(block, 8.5, { gap: 8 });
  }

  // TOC
  if (p.includeToc) {
    newPage();
    para(p.tocTitle || "Contents", 22, { center: true, bold: true, gap: 14 });
    p.chapters.forEach((c) => para(c.title, 12, { gap: 8 }));
  }

  // Dedication
  if (p.includeDedication && p.dedication) {
    newPage();
    y = H * 0.45;
    drawLines(wrap(p.dedication, font, 16, W - M * 2), 16, font, { center: true });
  }

  // Dramatis Personae
  if (p.includeDramatisPersonae && p.characters?.length) {
    newPage();
    para(p.dramatisTitle || "Dramatis Personae", 22, { center: true, bold: true, gap: 18 });
    p.characters.forEach((ch) => {
      para(`${ch.name} (${ch.role})`, 13, { bold: true, gap: 4 });
      if (ch.appearance) para(ch.appearance, 10, { gap: 2 });
      if (ch.personality) para(ch.personality, 10, { gap: 2 });
      if (ch.backstory) para(ch.backstory, 10, { gap: 8 });
    });
  }

  // Chapters
  p.chapters.forEach((c) => {
    newPage();
    para(c.title, 22, { center: true, bold: true, gap: 18 });
    const blocks = c.body.split(/\n\s*\n/);
    blocks.forEach((b, i) => para(b, 11, { indent: i > 0, gap: 4 }));
  });

  return doc.save();
}
