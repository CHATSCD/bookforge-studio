import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BookForge Studio — Turn drafts into professional ebooks",
  description:
    "Import a raw text or Word document and turn it into a professional, print-ready ebook with cover creator, front matter, DeepSeek AI writing help, character development, and multi-format export.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
