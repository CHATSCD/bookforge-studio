import Link from "next/link";
import {
  BookOpen, Wand2, Image as ImageIcon, Download, Sparkles, Layout, FileText, ArrowRight, Users,
} from "lucide-react";

const features = [
  { icon: FileText, title: "Import any draft", desc: "Upload .txt, .docx, or paste raw text. BookForge auto-detects chapters and structures your manuscript." },
  { icon: Users, title: "Character development", desc: "DeepSeek builds your cast — backgrounds, arcs, voices, and a visual relationship map." },
  { icon: Layout, title: "Professional front matter", desc: "Title page, copyright page, table of contents, dedication, and even a Dramatis Personae — generated automatically, print-ready." },
  { icon: ImageIcon, title: "Built-in cover creator", desc: "Design a stunning cover with gradients, typography, and your own artwork, sized for Amazon KDP (1600×2560)." },
  { icon: Wand2, title: "DeepSeek AI co-writer", desc: "Polish prose, expand chapters, write blurbs, and get editorial feedback — powered by DeepSeek." },
  { icon: Download, title: "Export everywhere", desc: "One click to EPUB, PDF, DOCX, and HTML. Sell on Amazon KDP, Google Play Books, Apple Books, and more." },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-lg">
          <BookOpen className="text-indigo-600" /> BookForge<span className="text-indigo-600">Studio</span>
        </div>
        <Link href="/studio" className="btn-primary">Launch Studio <ArrowRight size={16} /></Link>
      </nav>

      <section className="text-center px-6 py-20 bg-gradient-to-b from-indigo-50 to-slate-50">
        <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-4">Draft → Professional Ebook</p>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto">
          Turn any text into a <span className="text-indigo-600">publish-ready ebook</span> in minutes
        </h1>
        <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
          Import your manuscript, get automatic formatting, front matter, characters, and a professional cover — then export straight to Amazon KDP and Google Books. DeepSeek AI helps you write, edit, and design.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/studio" className="btn-primary text-base px-6 py-3">Start your book <ArrowRight size={18} /></Link>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-2 text-xs font-semibold text-slate-500">
          {["EPUB", "PDF", "DOCX", "HTML", "Amazon KDP", "Google Play"].map((t) => (
            <span key={t} className="rounded-full bg-white border border-slate-200 px-3 py-1">{t}</span>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f) => (
          <div key={f.title} className="card">
            <f.icon className="text-indigo-600 mb-3" size={26} />
            <h3 className="font-bold text-lg">{f.title}</h3>
            <p className="text-sm text-slate-600 mt-1">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="text-center text-sm text-slate-400 pb-10">BookForge Studio — write, format, cover, publish.</footer>
    </main>
  );
}
