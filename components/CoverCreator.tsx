"use client";
import { useEffect, useRef, useState } from "react";
import { Download, Sparkles, Loader2 } from "lucide-react";
import type { Project } from "@/lib/types";

const CW = 1600;
const CH = 2560;

function wrapTitle(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  ctx.font = `bold ${size}px Georgia, serif`;
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

export default function CoverCreator({ project, patch }: { project: Project; patch: (p: Partial<Project>) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");
  const [imgInput, setImgInput] = useState("");
  const c = project.cover;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = (bgImg?: HTMLImageElement) => {
      ctx.clearRect(0, 0, CW, CH);
      if (bgImg) {
        ctx.drawImage(bgImg, 0, 0, CW, CH);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, 0, CW, CH);
      } else if (c.bgType === "solid") {
        ctx.fillStyle = c.bgSolid;
        ctx.fillRect(0, 0, CW, CH);
      } else if (c.bgType === "image") {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, CW, CH);
      } else {
        const g = ctx.createLinearGradient(0, 0, CW, CH);
        g.addColorStop(0, c.bgFrom);
        g.addColorStop(1, c.bgTo);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, CW, CH);
      }

      ctx.strokeStyle = c.accentColor;
      ctx.lineWidth = 6;
      ctx.strokeRect(40, 40, CW - 80, CH - 80);

      if (c.showSeries && c.seriesText) {
        ctx.fillStyle = c.accentColor;
        ctx.font = "500 44px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText(c.seriesText.toUpperCase(), CW / 2, CH * 0.2);
      }

      ctx.fillStyle = c.accentColor;
      ctx.fillRect(CW * 0.14, CH * 0.3, CW * 0.72, 10);

      const lines = wrapTitle(ctx, project.title, CW * 0.72, c.titleFontSize);
      ctx.fillStyle = c.titleColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let ty = CH * 0.42 - ((lines.length - 1) * c.titleFontSize * 1.15) / 2;
      for (const l of lines) {
        ctx.font = `bold ${c.titleFontSize}px Georgia, serif`;
        ctx.fillText(l, CW / 2, ty);
        ty += c.titleFontSize * 1.15;
      }

      if (c.showSubtitle && project.subtitle) {
        ctx.font = "400 48px Georgia, serif";
        ctx.fillStyle = c.titleColor;
        ctx.globalAlpha = 0.85;
        ctx.fillText(project.subtitle, CW / 2, ty + 40);
        ctx.globalAlpha = 1;
      }

      if (c.showTagline && c.tagline) {
        ctx.font = "italic 400 42px Georgia, serif";
        ctx.fillStyle = c.accentColor;
        ctx.fillText(c.tagline, CW / 2, CH * 0.82);
      }

      ctx.font = "500 64px Georgia, serif";
      ctx.fillStyle = c.authorColor;
      ctx.fillText(project.author, CW / 2, CH * 0.88);

      patch({ cover: { ...c, renderedDataUrl: canvas.toDataURL("image/png") } });
    };

    if (c.bgType === "image" && c.imageUrl) {
      const img = new Image();
      img.onload = () => draw(img);
      img.src = c.imageUrl;
    } else {
      draw();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.title, project.subtitle, project.author, c]);

  const runAI = async () => {
    setAiBusy(true); setAiAdvice("");
    try {
      const res = await fetch("/api/deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "cover", title: project.title, genre: "fiction", text: project.settings.blurb || project.rawText.slice(0, 1200) }),
      });
      const data = await res.json();
      setAiAdvice(data.text || "No response.");
    } catch (e: any) {
      setAiAdvice("⚠️ " + e.message);
    } finally {
      setAiBusy(false);
    }
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = c.renderedDataUrl || canvasRef.current?.toDataURL("image/png") || "";
    a.download = `${project.title.replace(/[^a-z0-9]+/gi, "-") || "cover"}-cover.png`;
    a.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
      <div className="space-y-4">
        <div className="flex justify-center rounded-2xl bg-slate-200 p-6">
          <canvas ref={canvasRef} width={CW} height={CH} className="rounded-xl shadow-2xl" style={{ width: 280, height: 448 }} />
        </div>
        <div className="flex gap-2 justify-center">
          <button className="btn-primary" onClick={download}>
            <Download size={16} /> Download PNG (KDP 1600×2560)
          </button>
        </div>
        <p className="text-center text-xs text-slate-500">
          Sized for Amazon KDP paperback (6×9in @ 300dpi). Also embeds into EPUB / PDF / DOCX exports.
        </p>
      </div>

      <div className="space-y-4">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Cover settings</h3>
            <button className="btn-secondary" onClick={runAI} disabled={aiBusy}>
              <Sparkles size={14} /> {aiBusy ? "Asking DeepSeek…" : "AI design help"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Background</label>
              <select className="input" value={c.bgType} onChange={(e) => patch({ cover: { ...c, bgType: e.target.value as any } })}>
                <option value="gradient">Gradient</option>
                <option value="solid">Solid color</option>
                <option value="image">Uploaded image</option>
              </select>
            </div>
            {c.bgType === "gradient" && (
              <>
                <ColorField label="From" value={c.bgFrom} onChange={(v) => patch({ cover: { ...c, bgFrom: v } })} />
                <ColorField label="To" value={c.bgTo} onChange={(v) => patch({ cover: { ...c, bgTo: v } })} />
              </>
            )}
            {c.bgType === "solid" && (
              <ColorField label="Color" value={c.bgSolid} onChange={(v) => patch({ cover: { ...c, bgSolid: v } })} />
            )}
            {c.bgType === "image" && (
              <div className="col-span-2 space-y-2">
                <div className="flex gap-2">
                  <input className="input flex-1" placeholder="Image URL (or upload below)" value={imgInput} onChange={(e) => setImgInput(e.target.value)} />
                  <button className="btn-secondary" onClick={() => patch({ cover: { ...c, imageUrl: imgInput } })}>Apply</button>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="text-xs"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const url = String(reader.result);
                      patch({ cover: { ...c, imageUrl: url } });
                      setImgInput(url.slice(0, 40) + "…");
                    };
                    reader.readAsDataURL(f);
                  }}
                />
              </div>
            )}
            <ColorField label="Title color" value={c.titleColor} onChange={(v) => patch({ cover: { ...c, titleColor: v } })} />
            <ColorField label="Author color" value={c.authorColor} onChange={(v) => patch({ cover: { ...c, authorColor: v } })} />
            <ColorField label="Accent" value={c.accentColor} onChange={(v) => patch({ cover: { ...c, accentColor: v } })} />
            <div>
              <label className="label">Title size</label>
              <input type="range" min={48} max={120} value={c.titleFontSize} onChange={(e) => patch({ cover: { ...c, titleFontSize: Number(e.target.value) } })} className="w-full" />
            </div>
          </div>
        </div>

        <div className="card space-y-3">
          <h3 className="font-bold">Elements</h3>
          {[
            { key: "showSubtitle", label: "Show subtitle" },
            { key: "showSeries", label: "Show series line" },
            { key: "showTagline", label: "Show tagline" },
          ].map((t) => (
            <label key={t.key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={c[t.key as "showSubtitle"]} onChange={(e) => patch({ cover: { ...c, [t.key]: e.target.checked } })} />
              {t.label}
            </label>
          ))}
          {c.showSeries && (
            <input className="input" placeholder="Series (e.g. The Chronicles #1)" value={c.seriesText} onChange={(e) => patch({ cover: { ...c, seriesText: e.target.value } })} />
          )}
          {c.showTagline && (
            <input className="input" placeholder="Tagline" value={c.tagline} onChange={(e) => patch({ cover: { ...c, tagline: e.target.value } })} />
          )}
        </div>

        {aiAdvice && (
          <div className="card bg-indigo-50 border-indigo-200">
            <h4 className="font-bold text-indigo-800 mb-2">✨ DeepSeek cover advice</h4>
            <pre className="whitespace-pre-wrap text-sm text-indigo-900 max-h-72 overflow-auto">{aiAdvice}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-slate-300" />
        <input className="input flex-1 font-mono text-xs" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}
