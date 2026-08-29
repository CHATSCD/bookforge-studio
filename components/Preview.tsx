"use client";
import { copyrightText } from "@/lib/frontmatter";
import type { Project } from "@/lib/types";

function Paragraphs({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).filter(Boolean);
  return (
    <>
      {blocks.map((b, i) => (
        <p key={i} className="mb-2 text-justify leading-relaxed text-[13px]">
          {b.replace(/\n/g, " ")}
        </p>
      ))}
    </>
  );
}

export default function Preview({ project }: { project: Project }) {
  const s = project.settings;
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-extrabold">Book preview</h2>
        <p className="text-xs text-slate-500">As it will appear in the exported file</p>
      </div>

      <div className="space-y-6">
        {s.includePrelude && (
          <div className="book-page">
            <div className="pt-32 text-center">
              <h1 className="text-4xl font-serif font-bold">{project.title}</h1>
              {project.subtitle && <p className="mt-2 text-lg text-slate-600 font-serif">{project.subtitle}</p>}
              <p className="mt-8 text-xl font-serif">{project.author}</p>
            </div>
          </div>
        )}

        {s.includeCopyright && (
          <div className="book-page">
            <div className="pt-10 text-[11px] leading-relaxed text-slate-600 space-y-2">
              <Paragraphs text={copyrightText({ ...s, author: project.author })} />
            </div>
          </div>
        )}

        {s.includeDedication && s.dedication && (
          <div className="book-page">
            <div className="pt-32 text-center italic font-serif text-lg">{s.dedication}</div>
          </div>
        )}

        {s.includeDramatisPersonae && project.characters.length > 0 && (
          <div className="book-page">
            <div className="pt-16">
              <h2 className="text-center text-2xl font-serif font-bold mb-8">{s.dramatisTitle || "Dramatis Personae"}</h2>
              <div className="space-y-4">
                {project.characters.map((ch) => (
                  <div key={ch.id}>
                    <p className="font-serif font-bold text-[13px]">
                      {ch.name} <span className="italic font-normal text-slate-500">({ch.role})</span>
                    </p>
                    {ch.appearance && <p className="text-[12px] text-slate-600">{ch.appearance}</p>}
                    {ch.personality && <p className="text-[12px] text-slate-600">{ch.personality}</p>}
                    {ch.backstory && <p className="text-[12px] text-slate-600">{ch.backstory}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {s.includeToc && project.chapters.length > 0 && (
          <div className="book-page">
            <div className="pt-16 text-center">
              <h2 className="text-2xl font-serif font-bold mb-8">{s.tocTitle || "Contents"}</h2>
              <ul className="space-y-2 text-[13px]">
                {project.chapters.map((c, i) => (
                  <li key={c.id} className="font-serif">{i + 1}. {c.title}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {project.chapters.length === 0 ? (
          <div className="book-page text-center text-slate-400 pt-20">Import a manuscript and auto-structure it to see chapters here.</div>
        ) : (
          project.chapters.map((c) => (
            <div key={c.id} className="book-page">
              <div className="pt-14">
                <h2 className="text-center text-2xl font-serif font-bold mb-8">{c.title}</h2>
                <Paragraphs text={c.body} />
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .book-page {
          background: white;
          border-radius: 4px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
          min-height: 560px;
          padding: 0 48px 48px;
          border: 1px solid #e2e8f0;
        }
      `}</style>
    </div>
  );
}
