import {
  AlignmentType, Document, HeadingLevel, ImageRun, Packer, PageBreak, Paragraph,
} from "docx";
import type { ExportPayload } from "./epub";

export async function buildDocx(p: ExportPayload): Promise<Buffer> {
  const children: Paragraph[] = [];

  if (p.coverDataUrl) {
    const b64 = p.coverDataUrl.split(",")[1];
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({ data: Buffer.from(b64, "base64"), transformation: { width: 320, height: 512 } })],
      })
    );
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  children.push(new Paragraph({ text: p.title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }));
  if (p.subtitle) children.push(new Paragraph({ text: p.subtitle, alignment: AlignmentType.CENTER }));
  children.push(new Paragraph({ text: p.author, alignment: AlignmentType.CENTER, spacing: { before: 500 } }));
  children.push(new Paragraph({ children: [new PageBreak()] }));

  if (p.includeCopyright) {
    p.copyright.split("\n\n").forEach((block) =>
      children.push(new Paragraph({ text: block.replace(/\n/g, " "), spacing: { after: 220 }, size: 20 }))
    );
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  if (p.includeToc) {
    children.push(new Paragraph({ text: p.tocTitle || "Contents", heading: HeadingLevel.HEADING_1 }));
    p.chapters.forEach((c) => children.push(new Paragraph({ text: c.title, spacing: { after: 160 } })));
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  if (p.includeDedication && p.dedication) {
    children.push(
      new Paragraph({ text: p.dedication, alignment: AlignmentType.CENTER, spacing: { before: 2200 } })
    );
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  if (p.includeDramatisPersonae && p.characters?.length) {
    children.push(new Paragraph({ text: p.dramatisTitle || "Dramatis Personae", heading: HeadingLevel.HEADING_1 }));
    p.characters.forEach((ch) => {
      children.push(new Paragraph({ text: `${ch.name} (${ch.role})`, heading: HeadingLevel.HEADING_2 }));
      if (ch.appearance) children.push(new Paragraph({ text: ch.appearance.replace(/\n/g, " "), spacing: { after: 120 } }));
      if (ch.personality) children.push(new Paragraph({ text: ch.personality.replace(/\n/g, " "), spacing: { after: 120 } }));
      if (ch.backstory) children.push(new Paragraph({ text: ch.backstory.replace(/\n/g, " "), spacing: { after: 240 } }));
    });
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  p.chapters.forEach((c) => {
    children.push(new Paragraph({ text: c.title, heading: HeadingLevel.HEADING_1 }));
    c.body
      .split(/\n\s*\n/)
      .forEach((block) => children.push(new Paragraph({ text: block.replace(/\n/g, " "), spacing: { after: 220 } })));
  });

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return Packer.toBuffer(doc);
}
