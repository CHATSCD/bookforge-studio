import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const buf = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (ext === "docx") {
      const result = await mammoth.extractRawText({ buffer: buf });
      text = result.value;
    } else if (ext === "doc") {
      return NextResponse.json(
        { error: "Old .doc format isn't supported — please save your file as .docx or .txt and try again." },
        { status: 415 }
      );
    } else if (ext === "txt" || ext === "md" || ext === "rtf") {
      text = buf.toString("utf-8");
    } else {
      return NextResponse.json({ error: `Unsupported file type: .${ext} (use .docx or .txt)` }, { status: 415 });
    }

    return NextResponse.json({ filename: file.name, text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Upload failed" }, { status: 500 });
  }
}
