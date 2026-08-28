"use client";
import { useState } from "react";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import type { Project } from "@/lib/types";

const MODES = [
  { id: "polish", label: "✨ Polish & Proofread", desc: "Fix grammar, flow, and word choice." },
  { id: "critique", label: "📝 Critique", desc: "Structural editorial feedback." },
  { id: "expand", label: "🌱 Expand", desc: "Develop the scene into richer prose." },
  { id: "blurb", label: "📖 Blurb", desc: "Back-cover blurb + keywords." },
  { id: "cover", label: "🎨 Cover advice", desc: "Palette, type, and AI image prompt." },
  { id: "analyze", label: "🔍 Analyze", desc: "Full manuscript assessment." },
];

export default function AIPanel({ project }: { project: Project }) {
  const [mode, setMode] = useState("polish");
  const [focus, setFocus] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    setBusy(true); setResult("");
    try {
      const res = await fetch("/api/deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          title: project.title,
          author: project.author,
          genre: "fiction",
          text: focus || project.chapters[0]?.body || project.rawText,
        }),
      });
      const data = await res.json();
      setResult(data.text || "⚠️ No response — check your DeepSeek API key.");
    } catch (e: any) {
      setResult("⚠️ " + e.message);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold flex items-center gap-2">
          <Sparkles className="text-indigo-600" /> DeepSeek AI Assistant
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Your attached AI co-writer for editing, critique, expansion, blurbs, and cover design.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`card text-left transition ${mode === m.id ? "border-indigo-500 ring-2 ring-indigo-100" : "hover:border-indigo-300"}`}
          >
            <p className="font-semibold text-sm">{m.label}</p>
            <p className="text-xs text-slate-500 mt-1">{m.desc}</p>
          </button>
        ))}
      </div>

      <div className="card space-y-2">
        <label className="label">Text to work on (leave empty to use your first chapter)</label>
        <textarea
          className="input h-40 resize-none font-serif text-sm"
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          placeholder="Paste a passage, chapter, or leave blank…"
        />
        <button className="btn-primary" onClick={run} disabled={busy}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {busy ? "DeepSeek is thinking…" : "Run with DeepSeek"}
        </button>
      </div>

      {result && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">AI result</h3>
            <button className="btn-secondary" onClick={copy}>
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />} Copy
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-sm font-serif leading-relaxed max-h-[50vh] overflow-auto">{result}</pre>
        </div>
      )}
    </div>
  );
}
