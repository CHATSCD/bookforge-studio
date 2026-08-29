import JSZip from "jszip";
import { escapeXml, textToHtml, inline } from "@/lib/text";

export interface ExportChapter {
  title: string;
  body: string;
}

export interface ExportCharacter {
  name: string;
  role: string;
  appearance: string;
  personality: string;
  backstory: string;
}

export interface ExportPayload {
  title: string;
  subtitle?: string;
  author: string;
  chapters: ExportChapter[];
  characters?: ExportCharacter[];
  includeCopyright: boolean;
  includeDedication: boolean;
  includeToc: boolean;
  includeDramatisPersonae?: boolean;
  dramatisTitle?: string;
  copyright: string;
  dedication: string;
  coverDataUrl?: string;
  blurb?: string;
  tocTitle?: string;
}

const CSS = `
 @page { margin: 5% 6%; }
 body { font-family: Georgia, 'Times New Roman', serif; font-size: 1em; line-height: 1.55; color: #1a1a1a; }
 h1.chapter-title { text-align: center; font-size: 1.5em; margin: 0 0 1.5em 0; page-break-before: always; }
 h2 { text-align: center; font-size: 1.15em; margin: 1.5em 0 0.75em; }
 p { margin: 0 0 0.45em 0; text-align: justify; text-indent: 1.25em; }
 p:first-of-type, .no-indent { text-indent: 0; }
 .center { text-align: center; }
 .titlepage { margin-top: 35%; }
 .titlepage h1 { font-size: 2.2em; text-align: center; }
 .titlepage h2 { font-size: 1.2em; text-align: center; font-weight: normal; }
 .titlepage .author { text-align: center; margin-top: 2em; font-size: 1.3em; }
 .copyright { font-size: 0.85em; }
 .copyright p { text-indent: 0; }
 .toc ul, .toc ol { list-style: none; }
 .toc li { margin: 0.5em 0; }
 .toc a { text-decoration: none; color: inherit; }
 .dedication { margin-top: 40%; text-align: center; font-style: italic; font-size: 1.1em; }
 .dramatis .dp-entry { margin-bottom: 1.2em; }
 .dramatis .dp-name { font-weight: bold; margin-bottom: 0.2em; }
 .dramatis .dp-role { font-weight: normal; font-style: italic; }
 .dramatis .dp-desc { font-size: 0.9em; text-indent: 0; }
 hr { border: none; border-top: 1px solid #999; width: 30%; margin: 2em auto; }
`;

function xhtml(title: string, body: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${escapeXml(title)}</title><link rel="stylesheet" type="text/css" href="styles.css"/></head>
<body>${body}</body>
</html>`;
}

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function dramatisHtml(p: ExportPayload): string {
  const title = p.dramatisTitle || "Dramatis Personae";
  const items = (p.characters || [])
    .map((ch) => {
      const name = `<p class="dp-name">${escapeXml(ch.name)} <span class="dp-role">(${escapeXml(ch.role)})</span></p>`;
      const appearance = ch.appearance ? `<p class="dp-desc">${textToHtml(ch.appearance)}</p>` : "";
      const personality = ch.personality ? `<p class="dp-desc">${textToHtml(ch.personality)}</p>` : "";
      const backstory = ch.backstory ? `<p class="dp-desc">${textToHtml(ch.backstory)}</p>` : "";
      return `<div class="dp-entry">${name}${appearance}${personality}${backstory}</div>`;
    })
    .join("");
  return `<div class="dramatis"><h1 class="chapter-title">${escapeXml(title)}</h1>${items}</div>`;
}

export async function buildEpub(p: ExportPayload): Promise<Buffer> {
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  const meta = zip.folder("META-INF")!;
  meta.file(
    "container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`
  );

  const oebps = zip.folder("OEBPS")!;
  const files: { id: string; href: string; media: string }[] = [];
  const spine: string[] = [];
  const pushFile = (id: string, href: string, media: string) => {
    files.push({ id, href, media });
    spine.push(id);
  };

  let coverHref = "titlepage.xhtml";
  if (p.coverDataUrl) {
    const b64 = p.coverDataUrl.replace(/^data:[^;]+;base64,/, "");
    oebps.folder("images")!.file("cover.png", b64, { base64: true });
    pushFile("cover-image", "images/cover.png", "image/png");
    coverHref = "images/cover.png";
  }

  const navItems = p.chapters
    .map((c, i) => `<li><a href="chapter${i + 1}.xhtml">${escapeXml(c.title)}</a></li>`)
    .join("");

  oebps.file(
    "toc.xhtml",
    xhtml(
      "Table of Contents",
      `<nav epub:type="toc"><h1>${escapeXml(p.tocTitle || "Contents")}</h1><ol>${navItems}</ol></nav>`
    )
  );
  files.push({ id: "nav", href: "toc.xhtml", media: "application/xhtml+xml" });
  spine.push("nav");

  if (p.includeToc) {
    oebps.file(
      "tocpage.xhtml",
      xhtml("Contents", `<div class="toc"><h1>${escapeXml(p.tocTitle || "Contents")}</h1><ul>${navItems}</ul></div>`)
    );
    pushFile("tocpage", "tocpage.xhtml", "application/xhtml+xml");
  }

  oebps.file(
    "titlepage.xhtml",
    xhtml(
      p.title,
      `<div class="titlepage"><h1>${escapeXml(p.title)}</h1>${
        p.subtitle ? `<h2>${escapeXml(p.subtitle)}</h2>` : ""
      }<p class="author">${escapeXml(p.author)}</p></div>`
    )
  );
  pushFile("titlepage", "titlepage.xhtml", "application/xhtml+xml");

  if (p.includeCopyright) {
    oebps.file("copyright.xhtml", xhtml("Copyright", `<div class="copyright">${textToHtml(p.copyright)}</div>`));
    pushFile("copyright", "copyright.xhtml", "application/xhtml+xml");
  }

  if (p.includeDedication && p.dedication) {
    oebps.file("dedication.xhtml", xhtml("Dedication", `<p class="dedication">${inline(p.dedication)}</p>`));
    pushFile("dedication", "dedication.xhtml", "application/xhtml+xml");
  }

  if (p.includeDramatisPersonae && p.characters?.length) {
    oebps.file("dramatis.xhtml", xhtml(p.dramatisTitle || "Dramatis Personae", dramatisHtml(p)));
    pushFile("dramatis", "dramatis.xhtml", "application/xhtml+xml");
  }

  p.chapters.forEach((c, i) => {
    const id = `chapter${i + 1}`;
    oebps.file(`${id}.xhtml`, xhtml(c.title, `<h1 class="chapter-title">${escapeXml(c.title)}</h1>${textToHtml(c.body)}`));
    pushFile(id, `${id}.xhtml`, "application/xhtml+xml");
  });

  oebps.file("styles.css", CSS);

  const manifest = files.map((f) => `<item id="${f.id}" href="${f.href}" media-type="${f.media}"/>`).join("\n ");
  const spineItems = spine.map((id) => `<itemref idref="${id}"/>`).join("\n ");

  oebps.file(
    "content.opf",
    `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="en">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:${uuid()}</dc:identifier>
    <dc:title>${escapeXml(p.title)}</dc:title>
    <dc:creator>${escapeXml(p.author)}</dc:creator>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString()}</meta>
    ${p.coverDataUrl ? '<meta name="cover" content="cover-image"/>' : ""}
  </metadata>
  <manifest>
    ${manifest}
    <item id="styles" href="styles.css" media-type="text/css"/>
  </manifest>
  <spine>
    ${spineItems}
  </spine>
  <guide><reference type="cover" title="Cover" href="${coverHref}"/></guide>
</package>`
  );

  return zip.generateAsync({ type: "nodebuffer", mimeType: "application/epub+zip", compression: "DEFLATE" });
}
