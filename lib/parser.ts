import type { Chapter } from "./types";

const HEADING_RE = [
  /^(chapter|part|prologue|epilogue|introduction|preface|foreword|afterword|acknowledg|dedication)\b.*$/i,
  /^#{1,6}\s+.+$/,
  /^[IVX]+\.?\s+[A-Z]/,
  /^\d{1,2}[.)]\s+[A-Z]/,
];

function isHeading(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 90) return false;
  if (/^(chapter|part|prologue|epilogue|introduction|preface|foreword|afterword|acknowledg|dedication)/i.test(t)) return true;
  if (HEADING_RE.slice(1).some((r) => r.test(t))) return true;
  if (/^[A-Z][A-Z0-9 ,'’\-—:&.]{2,60}$/.test(t) && t === t.toUpperCase()) return true;
  return false;
}

export function detectChapters(rawText: string): Chapter[] {
  const lines = rawText.split(/\r?\n/);
  const chapters: Chapter[] = [];
  let current: Chapter | null = null;
  let buf: string[] = [];
  const flushBody = () => {
    if (current) current.body = buf.join("\n");
    buf = [];
  };
  for (const line of lines) {
    if (isHeading(line)) {
      flushBody();
      current = {
        id: `c${chapters.length + 1}`,
        title: line.trim().replace(/^#+\s*/, ""),
        body: "",
      };
      chapters.push(current);
    } else {
      buf.push(line);
    }
  }
  flushBody();
  return chapters;
}
