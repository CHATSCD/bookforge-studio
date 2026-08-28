"use client";
import { copyrightText } from "@/lib/frontmatter";
import type { Project } from "@/lib/types";

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium cursor-pointer">
      {label}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-indigo-600" />
    </label>
  );
}

export default function FrontMatter({ project, patch }: { project: Project; patch: (p: Partial<Project>) => void }) {
  const s = project.settings;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold">Front matter</h2>
        <p className="text-slate-500 text-sm mt-1">
          These pages are generated automatically and inserted in print-ready order: <b>Title → Copyright → Dedication → Contents → Chapters</b>.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Toggle label="Title / prelude page" checked={s.includePrelude} onChange={(v) => patch({ settings: { ...s, includePrelude: v } })} />
        <Toggle label="Copyright page" checked={s.includeCopyright} onChange={(v) => patch({ settings: { ...s, includeCopyright: v } })} />
        <Toggle label="Dedication page" checked={s.includeDedication} onChange={(v) => patch({ settings: { ...s, includeDedication: v } })} />
        <Toggle label="Table of contents" checked={s.includeToc} onChange={(v) => patch({ settings: { ...s, includeToc: v } })} />
      </div>

      {s.includePrelude && (
        <div className="card space-y-2">
          <h3 className="font-bold">Prelude / epigraph</h3>
          <textarea
            className="input h-24 resize-none font-serif italic"
            value={project.frontMatter.prelude}
            onChange={(e) => patch({ frontMatter: { ...project.frontMatter, prelude: e.target.value } })}
          />
        </div>
      )}

      {s.includeDedication && (
        <div className="card space-y-2">
          <h3 className="font-bold">Dedication</h3>
          <textarea
            className="input h-20 resize-none font-serif italic"
            placeholder="To those who never stopped believing…"
            value={s.dedication}
            onChange={(e) => patch({ settings: { ...s, dedication: e.target.value } })}
          />
        </div>
      )}

      {s.includeCopyright && (
        <div className="card space-y-3">
          <h3 className="font-bold">Copyright page</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Year</label>
              <input className="input" value={s.copyrightYear} onChange={(e) => patch({ settings: { ...s, copyrightYear: e.target.value } })} />
            </div>
            <div>
              <label className="label">ISBN (optional)</label>
              <input className="input" placeholder="978-…" value={s.isbn} onChange={(e) => patch({ settings: { ...s, isbn: e.target.value } })} />
            </div>
          </div>
          <div>
            <label className="label">Rights text</label>
            <textarea className="input h-28 resize-none text-xs" value={s.rights} onChange={(e) => patch({ settings: { ...s, rights: e.target.value } })} />
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 whitespace-pre-wrap">
            {copyrightText({ ...s, author: project.author })}
          </div>
        </div>
      )}

      {s.includeToc && (
        <div className="card space-y-2">
          <h3 className="font-bold">Table of contents</h3>
          <label className="label">Contents title</label>
          <input className="input" value={s.tocTitle} onChange={(e) => patch({ settings: { ...s, tocTitle: e.target.value } })} />
        </div>
      )}

      <div className="card space-y-3">
        <h3 className="font-bold">Marketing copy</h3>
        <div>
          <label className="label">Back-cover blurb (DeepSeek can write this)</label>
          <textarea className="input h-28 resize-none" value={s.blurb} onChange={(e) => patch({ settings: { ...s, blurb: e.target.value } })} />
        </div>
        <div>
          <label className="label">Author bio</label>
          <textarea className="input h-20 resize-none" value={s.authorBio} onChange={(e) => patch({ settings: { ...s, authorBio: e.target.value } })} />
        </div>
      </div>
    </div>
  );
}
