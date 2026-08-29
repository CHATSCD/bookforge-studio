"use client";
import { useEffect, useState } from "react";
import {
  BookOpen, Wand2, Image as ImageIcon, Layout as LayoutIcon, Eye, Sparkles, Save, Loader2, Check, Users,
} from "lucide-react";
import UploadZone from "@/components/UploadZone";
import Editor from "@/components/Editor";
import CoverCreator from "@/components/CoverCreator";
import FrontMatter from "@/components/FrontMatter";
import Preview from "@/components/Preview";
import ExportPanel from "@/components/ExportPanel";
import AIPanel from "@/components/AIPanel";
import CharacterDevelopment from "@/components/CharacterDevelopment";
import { defaultProject, type Project } from "@/lib/types";
import { detectChapters } from "@/lib/parser";

const TABS = [
  { id: "upload", label: "Import", icon: BookOpen },
  { id: "write", label: "Write & Edit", icon: Wand2 },
  { id: "characters", label: "Characters", icon: Users },
  { id: "cover", label: "Cover", icon: ImageIcon },
  { id: "front", label: "Front Matter", icon: LayoutIcon },
  { id: "preview", label: "Preview", icon: Eye },
  { id: "ai", label: "AI Assistant", icon: Sparkles },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Studio() {
  const [tab, setTab] = useState<TabId>("upload");
  const [project, setProject] = useState<Project>(defaultProject());
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState("");

  const patch = (p: Partial<Project>) => setProject((prev) => ({ ...prev, ...p }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });
      const data = await res.json();
      if (data.id) setProject((prev) => (prev.id ? prev : { ...prev, id: data.id }));
      setSavedAt(new Date().toLocaleTimeString());
    } catch {
      /* offline — continue locally */
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(save, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  const handleImported = (text: string) => {
    setProject((prev) => ({ ...prev, rawText: text, chapters: detectChapters(text) }));
    setTab("write");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-20">
        <div className="flex items-center gap-2 font-bold">
          <BookOpen className="text-indigo-600" />
          <span>BookForge<span className="text-indigo-600">Studio</span></span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {saving ? (
            <span className="flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> Saving…</span>
          ) : savedAt ? (
            <span className="flex items-center gap-1 text-emerald-600"><Check size={14} /> Saved {savedAt}</span>
          ) : (
            <span>Autosaves to cloud</span>
          )}
          <button onClick={save} className="btn-secondary text-xs">Save now</button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-56 shrink-0 border-r border-slate-200 bg-white p-3 space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                tab === t.id ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <t.icon size={18} /> {t.label}
              {t.id === "ai" && tab !== "ai" && (
                <span className="ml-auto rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-[10px] font-bold">AI</span>
              )}
            </button>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          {tab === "upload" && <UploadZone onImported={handleImported} />}
          {tab === "write" && <Editor project={project} patch={patch} />}
          {tab === "characters" && <CharacterDevelopment project={project} patch={patch} />}
          {tab === "cover" && <CoverCreator project={project} patch={patch} />}
          {tab === "front" && <FrontMatter project={project} patch={patch} />}
          {tab === "preview" && <Preview project={project} />}
          {tab === "ai" && <AIPanel project={project} />}
        </main>
      </div>
    </div>
  );
}
