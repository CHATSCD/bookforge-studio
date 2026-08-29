"use client";
import { useState } from "react";
import {
  Download, Loader2, FileText, FileType2, FileCode, File as FileIcon, BookOpen, AlertCircle,
} from "lucide-react";
import { copyrightText } from "@/lib/frontmatter";
import type { Project } from "@/lib/types";

const FORMATS = [
  { id: "epub", label: "EPUB", desc: "Standard for Kindle, Kobo, Apple Books & Google Play", icon: BookOpen },
  { id: "pdf", label: "PDF", desc: "Print-ready for KDP paperback & Google Play", icon: FileText },
  { id: "docx", label: "DOCX", desc: "Editable Word document for final tweaks", icon: FileType2 },
  { id: "html", label: "HTML", desc: "Web-hostable & convertible", icon: FileCode },
  { id: "txt", label: "TXT", desc: "Plain text manuscript", icon: FileIcon },
];

export default function ExportPanel({ project }: { project: Project }) {
  const [busy, setBusy] = useState<string | null>(null);

  const exportFormat = async (format: string) => {
    setBusy(format);
    try {
      const res = await fetch(`/api/export?format=${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: project.title,
          subtitle: project.subtitle,
          author: project.author,
          rawText: project.rawText,
          chapters: project.chapters,
          characters: project.characters,
          settings: project.settings,
          copyright: copyrightText({ ...project.settings, author: project.author }),
          dedication: project.settings.dedication || project.frontMatter.dedication,
          coverDataUrl: project.cover.renderedDataUrl,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(project.title || "book").replace(/[^a-z0-9]+/gi, "-")}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message || "Export failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold">Export & publish</h2>
        <p className="text-slate-500 text-sm mt-1">One click generates the complete book with front matter, cover, characters, and chapters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            disabled={busy !== null}
            onClick={() => exportFormat(f.id)}
            className="card text-left transition hover:border-indigo-400 hover:shadow-md disabled:opacity-60"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <f.icon className="text-indigo-600" size={24} />
                <div>
                  <p className="font-bold">{f.label}</p>
                  <p className="text-xs text-slate-500">{f.desc}</p>
                </div>
              </div>
              {busy === f.id ? <Loader2 className="animate-spin text-indigo-600" size={20} /> : <Download size={20} className="text-slate-400" />}
            </div>
          </button>
        ))}
      </div>

      <div className="card bg-amber-50 border-amber-200 text-sm text-amber-800">
        <p className="flex items-center gap-2 font-semibold"><AlertCircle size={16} /> Kindle note</p>
        <p className="mt-1">Amazon retired MOBI in 2023. Kindle now accepts <b>EPUB</b> — export EPUB and upload to KDP or use Send-to-Kindle.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-bold flex items-center gap-2">🛒 Amazon KDP</h3>
          <ol className="mt-2 list-decimal list-inside text-sm text-slate-600 space-y-1">
            <li>Export <b>EPUB</b> (ebook) or <b>PDF</b> (paperback).</li>
            <li>Go to <span className="font-mono text-xs">kdp.amazon.com</span> → Create.</li>
            <li>Upload your cover PNG from the Cover tab.</li>
            <li>Add ISBN (optional), blurb, and keywords.</li>
          </ol>
        </div>
        <div className="card">
          <h3 className="font-bold flex items-center gap-2">📚 Google Play Books</h3>
          <ol className="mt-2 list-decimal list-inside text-sm text-slate-600 space-y-1">
            <li>Export <b>EPUB</b> or <b>PDF</b>.</li>
            <li>Go to <span className="font-mono text-xs">play.google.com/books/publish</span>.</li>
            <li>Upload the file and cover image.</li>
            <li>Set price & territories, then publish.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
