"use client";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  Users, Plus, Trash2, Sparkles, Loader2, Copy, Check,
  UserPlus, Download, FileText, Wand2, Network
} from "lucide-react";
import type { Character, Project } from "@/lib/types";

const ROLES = ["Protagonist", "Antagonist", "Supporting", "Minor", "Other"] as const;

const FIELDS: { key: keyof Character; label: string; hint?: string; textarea?: boolean }[] = [
  { key: "age", label: "Age" },
  { key: "appearance", label: "Appearance", textarea: true, hint: "Physical description, style, distinguishing features" },
  { key: "personality", label: "Personality", textarea: true, hint: "Traits, temperament, emotional baseline" },
  { key: "backstory", label: "Backstory", textarea: true, hint: "History that shaped them" },
  { key: "motivation", label: "Motivation", textarea: true, hint: "What they want most — and why" },
  { key: "fears", label: "Fears & flaws", textarea: true, hint: "Deepest fear, weaknesses, blind spots" },
  { key: "arc", label: "Character arc", textarea: true, hint: "How they change from start to end" },
  { key: "relationships", label: "Relationships", textarea: true, hint: "Key connections to other characters" },
  { key: "speechPattern", label: "Speech & voice", textarea: true, hint: "Vocabulary, cadence, verbal tics" },
  { key: "quirks", label: "Quirks & habits", textarea: true },
  { key: "notes", label: "Notes", textarea: true },
];

function newCharacter(name = "", role: string = "Supporting"): Character {
  return {
    id: `ch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    role: (ROLES as readonly string[]).includes(role) ? (role as Character["role"]) : "Supporting",
    age: "", appearance: "", personality: "", backstory: "", motivation: "",
    fears: "", arc: "", relationships: "", speechPattern: "", quirks: "", notes: "", links: [],
  };
}

/* ---------- JSON parsers for DeepSeek output ---------- */

function cleanJson(s: string): string {
  let t = s.trim();
  if (t.startsWith("```")) t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  return t;
}

function tryParseCharacter(s: string): Partial<Character> | null {
  try {
    const obj = JSON.parse(cleanJson(s));
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return null;
    const keys: (keyof Character)[] = [
      "name", "role", "age", "appearance", "personality", "backstory",
      "motivation", "fears", "arc", "relationships", "speechPattern", "quirks", "notes",
    ];
    const out: Partial<Character> = {};
    for (const k of keys) if (typeof obj[k] === "string" && obj[k].trim()) out[k] = obj[k];
    if (out.role && !ROLES.includes(out.role as any)) out.role = "Other";
    if (Array.isArray(obj.links)) {
      const links = obj.links
        .filter((l: any) => l && typeof l.name === "string" && l.name.trim())
        .map((l: any) => ({ name: l.name.trim(), label: typeof l.label === "string" ? l.label.trim() : "" }));
      if (links.length) out.links = links;
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

function tryParseCast(s: string): { name: string; role: string }[] {
  try {
    let obj: any = JSON.parse(cleanJson(s));
    if (obj && !Array.isArray(obj) && Array.isArray(obj.characters)) obj = obj.characters;
    if (!Array.isArray(obj)) return [];
    return obj
      .filter((x: any) => x && typeof x.name === "string" && x.name.trim())
      .map((x: any) => ({
        name: x.name.trim(),
        role: ROLES.includes(x.role) ? x.role : "Supporting",
      }));
  } catch {
    return [];
  }
}

/* ---------- Relationship map (canvas) ---------- */

function RelationshipMap({
  characters, selectedId, onSelect,
}: {
  characters: Character[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 900, H = 560;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    if (!characters.length) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Add characters to see the relationship map", W / 2, H / 2);
      return;
    }

    const cx = W / 2, cy = H / 2;
    const rx = W * 0.36, ry = H * 0.36;
    const pos: Record<string, { x: number; y: number }> = {};
    characters.forEach((c, i) => {
      const angle = (i / characters.length) * Math.PI * 2 - Math.PI / 2;
      pos[c.id] = { x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry };
    });

    // edges
    characters.forEach((c) => {
      (c.links || []).forEach((link) => {
        const target = characters.find((o) => o.name.toLowerCase() === link.name.toLowerCase() && o.id !== c.id);
        if (!target || !pos[c.id] || !pos[target.id]) return;
        const a = pos[c.id], b = pos[target.id];
        ctx.strokeStyle = "#c7d2fe";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        if (link.label) {
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          ctx.fillStyle = "#64748b";
          ctx.font = "12px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(link.label, mx, my - 4);
        }
      });
    });

    // nodes
    characters.forEach((c) => {
      const p = pos[c.id];
      const isSel = c.id === selectedId;
      ctx.beginPath();
      ctx.arc(p.x, p.y, isSel ? 34 : 28, 0, Math.PI * 2);
      ctx.fillStyle = isSel ? "#4f46e5" : "#e0e7ff";
      ctx.fill();
      ctx.strokeStyle = isSel ? "#312e81" : "#a5b4fc";
      ctx.lineWidth = isSel ? 3 : 2;
      ctx.stroke();
      ctx.fillStyle = isSel ? "#ffffff" : "#1e293b";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      const words = c.name.split(" ");
      ctx.fillText(words.length > 2 ? words.slice(0, 2).join(" ") : c.name, p.x, p.y + 4);
    });
  }, [characters, selectedId]);

  const handleClick = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const cx = W / 2, cy = H / 2;
    const rx = W * 0.36, ry = H * 0.36;
    let best: { id: string; d: number } | null = null;
    characters.forEach((c, i) => {
      const angle = (i / characters.length) * Math.PI * 2 - Math.PI / 2;
      const nx = cx + Math.cos(angle) * rx;
      const ny = cy + Math.sin(angle) * ry;
      const d = Math.hypot(x - nx, y - ny);
      if (d < 40 && (!best || d < best.d)) best = { id: c.id, d };
    });
    if (best) onSelect(best.id);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold flex items-center gap-2">
          <Network size={16} className="text-indigo-600" /> Relationship map
        </h3>
        <p className="text-xs text-slate-500">Click a node to jump to that character. Edges come from each character's Links.</p>
      </div>
      <canvas ref={canvasRef} width={W} height={H} onClick={handleClick} className="w-full h-auto rounded-lg border border-slate-200 cursor-pointer" style={{ maxWidth: 900 }} />
      {characters.length === 0 && (
        <p className="text-xs text-slate-400 mt-2 text-center">No characters yet — brainstorm a cast to populate the map.</p>
      )}
    </div>
  );
}

/* ---------- Main component ---------- */

export default function CharacterDevelopment({
  project, patch,
}: { project: Project; patch: (p: Partial<Project>) => void }) {
  const characters = project.characters || [];
  const [view, setView] = useState<"profiles" | "map">("profiles");
  const [selectedId, setSelectedId] = useState<string | null>(characters[0]?.id ?? null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMode, setAiMode] = useState<"create" | "deepen" | "cast" | null>(null);
  const [aiResult, setAiResult] = useState("");
  const [aiParsed, setAiParsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkLabel, setNewLinkLabel] = useState("");

  const selected = characters.find((c) => c.id === selectedId) ?? null;

  const updateCharacter = (id: string, data: Partial<Character>) =>
    patch({ characters: characters.map((c) => (c.id === id ? { ...c, ...data } : c)) });

  const addCharacter = (name = "", role = "Supporting") => {
    const c = newCharacter(name, role);
    patch({ characters: [...characters, c] });
    setSelectedId(c.id);
  };

  const removeCharacter = (id: string) => {
    patch({ characters: characters.filter((c) => c.id !== id) });
    if (selectedId === id) setSelectedId(characters[0]?.id ?? null);
  };

  const addLink = () => {
    if (!selected || !newLinkName) return;
    updateCharacter(selected.id, { links: [...(selected.links || []), { name: newLinkName, label: newLinkLabel }] });
    setNewLinkName("");
    setNewLinkLabel("");
  };

  const removeLink = (i: number) => {
    if (!selected) return;
    updateCharacter(selected.id, { links: (selected.links || []).filter((_, idx) => idx !== i) });
  };

  const resetAI = () => { setAiResult(""); setAiMode(null); setAiParsed(false); };

  const callAI = async (mode: "create" | "deepen" | "cast") => {
    setAiBusy(true); setAiMode(mode); setAiResult(""); setAiParsed(false);
    try {
      const res = await fetch("/api/deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "character",
          action: mode,
          title: project.title,
          author: project.author,
          characterName: selected?.name || "",
          cast: characters.map((c) => c.name).join(", "),
          text: project.rawText || project.chapters[0]?.body || "",
        }),
      });
      const data = await res.json();
      setAiResult(data.text || "⚠️ No response — check your DeepSeek API key.");
      setAiParsed(mode === "cast" ? tryParseCast(data.text || "").length > 0 : tryParseCharacter(data.text || "") !== null);
    } catch (e: any) {
      setAiResult("⚠️ " + e.message);
    } finally {
      setAiBusy(false);
    }
  };

  const applyAI = () => {
    if (aiMode === "cast") {
      const list = tryParseCast(aiResult);
      if (list.length) {
        const added = list.map((p) => newCharacter(p.name, p.role));
        patch({ characters: [...characters, ...added] });
        setSelectedId(added[0].id);
        resetAI();
        return;
      }
    } else if (aiMode === "create") {
      const parsed = tryParseCharacter(aiResult);
      if (parsed?.name) {
        const c = { ...newCharacter(parsed.name, parsed.role), ...parsed };
        patch({ characters: [...characters, c] });
        setSelectedId(c.id);
        resetAI();
        return;
      }
    } else if (aiMode === "deepen" && selected) {
      const parsed = tryParseCharacter(aiResult);
      if (parsed) {
        updateCharacter(selected.id, parsed);
        resetAI();
        return;
      }
    }
    if (selected) {
      updateCharacter(selected.id, { notes: selected.notes + "\n\n--- AI DRAFT ---\n\n" + aiResult });
      resetAI();
    }
  };

  const copyResult = async () => {
    await navigator.clipboard.writeText(aiResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const exportBible = () => {
    const lines: string[] = [
      `${project.title || "My Book"} — Character Bible`,
      `Author: ${project.author || "—"}`,
      `Generated: ${new Date().toLocaleString()}`,
      "".padEnd(50, "="),
      "",
    ];
    characters.forEach((c, i) => {
      lines.push(`${i + 1}. ${c.name}  —  ${c.role}`, "");
      FIELDS.forEach((f) => {
        const v = (c[f.key] || "").trim();
        if (v) lines.push(`${f.label}: ${v}`);
      });
      if (c.links?.length) {
        lines.push(`Links: ${c.links.map((l) => l.name + (l.label ? ` (${l.label})` : "")).join(", ")}`);
      }
      lines.push("", "".padEnd(40, "-"), "");
    });
    if (!characters.length) lines.push("No characters yet.");
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(project.title || "book").replace(/[^a-z0-9]+/gi, "-")}-characters.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold flex items-center gap-2">
            <Users className="text-indigo-600" /> Character Development
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            DeepSeek works through your cast — build backgrounds, arcs, links, and voices that fit your manuscript.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button onClick={() => setView("profiles")} className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${view === "profiles" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
              Profiles
            </button>
            <button onClick={() => setView("map")} className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${view === "map" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
              <span className="inline-flex items-center gap-1"><Network size={14} /> Map</span>
            </button>
          </div>
          <button className="btn-secondary" onClick={() => callAI("cast")} disabled={aiBusy}>
            {aiBusy && aiMode === "cast" ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {aiBusy && aiMode === "cast" ? "Building cast…" : "Brainstorm full cast"}
          </button>
          <button className="btn-secondary" onClick={() => addCharacter()} disabled={aiBusy}>
            <Plus size={15} /> Blank character
          </button>
          <button className="btn-secondary" onClick={exportBible} disabled={!characters.length}>
            <Download size={15} /> Character Bible
          </button>
        </div>
      </div>

      {view === "map" ? (
        <RelationshipMap characters={characters} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setView("profiles"); }} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          <div className="space-y-2">
            <p className="label">Cast ({characters.length})</p>
            {characters.length === 0 && (
              <div className="card text-sm text-slate-500">No characters yet. Click <b>Brainstorm full cast</b> or add one manually.</div>
            )}
            {characters.map((c) => (
              <div
                key={c.id}
                className={`card cursor-pointer flex items-center justify-between gap-2 transition ${selectedId === c.id ? "border-indigo-500 ring-2 ring-indigo-100" : "hover:border-indigo-300"}`}
                onClick={() => setSelectedId(c.id)}
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate">{c.name || "Unnamed"}</p>
                  <p className="text-xs text-slate-500">{c.role}</p>
                </div>
                <button className="text-slate-400 hover:text-rose-600 shrink-0" title="Delete character" onClick={(e) => { e.stopPropagation(); removeCharacter(c.id); }}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <button className="btn-primary w-full justify-center" onClick={() => addCharacter()}>
              <UserPlus size={15} /> New character
            </button>
          </div>

          <div className="space-y-4">
            {selected ? (
              <>
                <div className="card space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Name</label>
                      <input className="input font-bold" value={selected.name} onChange={(e) => updateCharacter(selected.id, { name: e.target.value })} placeholder="Character name" />
                    </div>
                    <div>
                      <label className="label">Role</label>
                      <select className="input" value={selected.role} onChange={(e) => updateCharacter(selected.id, { role: e.target.value as Character["role"] })}>
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                  {FIELDS.map((f) => (
                    <div key={f.key}>
                      <label className="label">{f.label}</label>
                      {f.textarea ? (
                        <textarea className="input resize-y font-serif text-sm leading-relaxed" rows={f.key === "backstory" || f.key === "arc" ? 4 : 2} value={selected[f.key] as string} onChange={(e) => updateCharacter(selected.id, { [f.key]: e.target.value } as Partial<Character>)} placeholder={f.hint || ""} />
                      ) : (
                        <input className="input" value={selected[f.key] as string} onChange={(e) => updateCharacter(selected.id, { [f.key]: e.target.value } as Partial<Character>)} placeholder={f.hint || ""} />
                      )}
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-primary" onClick={() => callAI("create")} disabled={aiBusy}>
                      {aiBusy && aiMode === "create" ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
                      {aiBusy && aiMode === "create" ? "Creating…" : "AI: Create a new character"}
                    </button>
                    <button className="btn-secondary" onClick={() => callAI("deepen")} disabled={aiBusy}>
                      {aiBusy && aiMode === "deepen" ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                      {aiBusy && aiMode === "deepen" ? "Deepening…" : "AI: Deepen this character"}
                    </button>
                  </div>
                </div>

                <div className="card space-y-3">
                  <h3 className="font-bold">Links <span className="text-xs font-normal text-slate-400">(drives the relationship map)</span></h3>
                  <div className="flex gap-2">
                    <select className="input flex-1" value={newLinkName} onChange={(e) => setNewLinkName(e.target.value)}>
                      <option value="">Select character…</option>
                      {characters.filter((o) => o.id !== selected.id).map((o) => <option key={o.id} value={o.name}>{o.name}</option>)}
                    </select>
                    <input className="input flex-1" placeholder="Label (e.g. mother of, rival)" value={newLinkLabel} onChange={(e) => setNewLinkLabel(e.target.value)} />
                    <button className="btn-secondary" onClick={addLink}>Add</button>
                  </div>
                  {(selected.links || []).length === 0 && <p className="text-xs text-slate-400">No links yet — connect this character to others.</p>}
                  {selected.links?.map((l, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                      <span><b>{l.name}</b>{l.label ? ` — ${l.label}` : ""}</span>
                      <button className="text-slate-400 hover:text-rose-600" onClick={() => removeLink(i)}><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>

                {aiResult && (
                  <div className="card">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold flex items-center gap-2">
                        <Sparkles size={16} className="text-indigo-600" /> AI result
                        {aiParsed && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">READY TO APPLY</span>}
                      </h3>
                      <div className="flex gap-2">
                        <button className="btn-secondary" onClick={copyResult}>
                          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />} Copy
                        </button>
                        <button className="btn-primary" onClick={applyAI}>
                          <Wand2 size={14} /> Apply
                        </button>
                      </div>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm font-serif leading-relaxed max-h-72 overflow-auto">{aiResult}</pre>
                    {!aiParsed && (
                      <p className="text-xs text-amber-600 mt-2">
                        Couldn't auto-parse — click Copy and paste manually, or Apply to append to this character's notes.
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="card text-center text-slate-400 py-16">
                <FileText className="mx-auto mb-2" size={36} />
                Select a character from the list, or create a new one.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
