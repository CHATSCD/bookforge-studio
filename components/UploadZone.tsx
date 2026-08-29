"use client";
import { useCallback, useRef, useState } from "react";
import { FileUp, FileText, Loader2, ArrowRight, AlertCircle } from "lucide-react";

export default function UploadZone({ onImported }: { onImported: (text: string, filename: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const [filename, setFilename] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError("");
      setBusy(true);
      setPreview("");
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        setFilename(file.name);
        setPreview(data.text.slice(0, 1200));
        onImported(data.text, file.name);
      } catch (e: any) {
        setError(e.message || "Something went wrong");
      } finally {
        setBusy(false);
      }
    },
    [onImported]
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Import your manuscript</h1>
        <p className="text-slate-500 mt-2">Drop a <b>.docx</b> or <b>.txt</b> file, or paste raw text directly.</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition ${
          dragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-white hover:border-indigo-400"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".docx,.txt,.md,.rtf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {busy ? <Loader2 className="mx-auto animate-spin text-indigo-600" size={40} /> : <FileUp className="mx-auto text-indigo-600" size={40} />}
        <p className="mt-3 font-semibold">{busy ? "Extracting text…" : "Drag & drop your file here"}</p>
        <p className="text-sm text-slate-500">or click to browse (.docx / .txt / .md)</p>
      </div>

      <div>
        <p className="label">…or paste raw text</p>
        <textarea
          className="input h-40 resize-none font-mono"
          placeholder="Paste your manuscript here…"
          onBlur={(e) => {
            if (e.target.value.trim()) {
              setPreview(e.target.value.slice(0, 1200));
              setFilename("pasted-text.txt");
              onImported(e.target.value, "pasted-text.txt");
            }
          }}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {preview && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
              <FileText size={16} /> {filename} — imported
            </span>
            <button onClick={() => onImported(preview, filename)} className="btn-primary text-xs">
              Structure it <ArrowRight size={14} />
            </button>
          </div>
          <pre className="max-h-48 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600 whitespace-pre-wrap">{preview}</pre>
        </div>
      )}
    </div>
  );
}
