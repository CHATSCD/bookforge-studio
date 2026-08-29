"use client";
import { useState } from "react";
import { Wand2, Plus, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { detectChapters } from "@/lib/parser";
import type { Chapter, Project } from "@/lib/types";

export default function Editor({ project, patch }: { project: Project; patch: (p: Partial<Project>) => void }) {
  const [view, setView] = useState<"manuscript" | "chapters">("manuscript");

  const updateChapter = (id: string, data: Partial<Chapter>) => {
    patch({ chapters: project.chapters.map((c) => (c.id === id ? { ...c, ...data } : c)) });
  };
  const move = (idx: number, dir: -1 | 1) => {
    const arr = [...project.chapters];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    patch({ chapters: arr });
  };
  const remove = (idx: number) => patch({ chapters: project.chapters.filter((_, i) => i !== idx) });
  const add = () =>
    patch({
      chapters: [...project.chapters, { id: `c${Date.now()}`, title: `Chapter ${project.chapters.length + 1}`, body: "" }],
    });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="label">Book title</label>
          <input className="input" value={project.title} onChange={(e) => patch({ title: e.target.value })} />
        </div>
        <div>
          <label className="label">Author name</label>
          <input className="input" value={project.author} onChange={(e) => patch({ author: e.target.value })} />
        </div>
        <div>
          <label className="label">Subtitle (optional)</label>
          <input className="input" value={project.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setView("manuscript")} className={view === "manuscript" ? "btn-primary" : "btn-secondary"}>Manuscript</button>
        <button onClick={() => setView("chapters")} className={view === "chapters" ? "btn-primary" : "btn-secondary"}>Chapters ({project.chapters.length})</button>
      </div>

      {view === "manuscript" ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Paste or edit your manuscript. Blank lines separate paragraphs.</p>
            <button className="btn-primary" onClick={() => patch({ chapters: detectChapters(project.rawText) })}>
              <Wand2 size={16} /> Auto-structure chapters
            </button>
          </div>
          <textarea
            className="input h-[55vh] resize-none font-serif text-[15px] leading-relaxed"
            value={project.rawText}
            onChange={(e) => patch({ rawText: e.target.value })}
            placeholder="Once upon a time…"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {project.chapters.length === 0 && (
            <p className="text-sm text-slate-500">No chapters yet. Click “Auto-structure chapters” in the Manuscript view.</p>
          )}
          {project.chapters.map((c, i) => (
            <div key={c.id} className="card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-slate-400">#{i + 1}</span>
                <input className="input flex-1 font-semibold" value={c.title} onChange={(e) => updateChapter(c.id, { title: e.target.value })} />
                <button className="btn-secondary p-2" onClick={() => move(i, -1)} title="Move up"><ArrowUp size={14} /></button>
                <button className="btn-secondary p-2" onClick={() => move(i, 1)} title="Move down"><ArrowDown size={14} /></button>
                <button className="btn-secondary p-2 text-rose-600" onClick={() => remove(i)} title="Delete"><Trash2 size={14} /></button>
              </div>
              <textarea className="input resize-y font-serif text-sm leading-relaxed" rows={5} value={c.body} onChange={(e) => updateChapter(c.id, { body: e.target.value })} placeholder="Chapter text…" />
            </div>
          ))}
          <button className="btn-secondary" onClick={add}><Plus size={16} /> Add chapter</button>
        </div>
      )}
    </div>
  );
}
