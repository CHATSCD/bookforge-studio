import { NextRequest, NextResponse } from "next/server";
import { callDeepSeek } from "@/lib/deepseek";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { mode, action, text, title, author, genre, characterName, cast } = await req.json();

  if (!process.env.DEEPSEEK_API_KEY) {
    return NextResponse.json({
      text: "⚠️ **DEEPSEEK_API_KEY is not configured.** Add it to your environment variables (Vercel → Settings → Environment Variables) and redeploy to unlock the AI assistant.",
    });
  }

  const excerpt = (text || "").slice(0, 12000);
  let system = "You are BookForge AI, a professional book editor, ghostwriter, and publishing consultant.";
  let user = "";

  switch (mode) {
    case "polish":
      system += " Polish prose professionally: fix grammar, punctuation, flow, and word choice. Preserve the author's voice. Output the full polished text.";
      user = `Polish the following manuscript excerpt:\n\n${excerpt}`;
      break;
    case "critique":
      system += " Provide constructive, specific editorial feedback in a clear structure: Strengths, Weaknesses, Suggested Improvements, Questions for the Author.";
      user = `Critique this excerpt from "${title || "the book"}" (genre: ${genre || "fiction"}):\n\n${excerpt}`;
      break;
    case "expand":
      system += " Expand and develop the scene while preserving voice and continuity. Add sensory detail, tension, and deeper prose. Output the expanded text.";
      user = `Expand this excerpt into a fuller, richer scene:\n\n${excerpt}`;
      break;
    case "blurb":
      system += " Write a compelling back-cover blurb (120-180 words), plus a 2-line elevator pitch and 5 Amazon search keywords.";
      user = `Write a blurb for "${title || "this book"}" by ${author || "the author"}.\n\nSynopsis/sample:\n\n${excerpt}`;
      break;
    case "cover":
      system += " Give detailed cover design advice: color palette (hex codes), typography choices, layout, mood, and a ready-to-paste AI image-generation prompt (Midjourney/DALL·E).";
      user = `Design a book cover for "${title || "this book"}" (genre: ${genre || "fiction"}). ${text ? "Themes:\n\n" + text.slice(0, 1500) : ""}`;
      break;
    case "analyze":
      system += " Analyze the manuscript: structure, pacing, voice, market positioning, strengths, and a prioritized revision plan.";
      user = `Analyze this manuscript excerpt and give a professional editorial assessment:\n\n${excerpt}`;
      break;
    case "character": {
      system += " You are an expert character developer and story-bible architect. You invent psychologically rich, internally consistent characters with compelling backstories, motivations, flaws, and arcs that serve the story. For every character you also define links to other characters as an array of {name, label}.";
      const existingCast = cast ? cast : "";

      if (action === "cast") {
        system += " Generate a complete, balanced cast.";
        user = `Based on this manuscript, invent a full cast: one protagonist, one antagonist, and 2-3 supporting characters. Return ONLY a JSON array of objects, each with EXACTLY these keys: name, role, age, appearance, personality, backstory, motivation, fears, arc, relationships, speechPattern, quirks, notes, links. Role must be one of: Protagonist, Antagonist, Supporting, Minor. links is an array of objects {name, label} naming other characters and the relationship. No markdown, no code fences, no commentary.\n\nTitle: "${title}"\n\nManuscript:\n\n${excerpt}`;
      } else if (action === "deepen") {
        system += " Deepen and enrich the given character while staying consistent with the manuscript and existing cast.";
        user = `Deepen the character "${characterName || "the selected character"}"${existingCast ? ` (existing cast: ${existingCast})` : ""}. Return ONLY a JSON object with EXACTLY these keys: name, role, age, appearance, personality, backstory, motivation, fears, arc, relationships, speechPattern, quirks, notes, links. Keep the same name. links is an array of objects {name, label}. No markdown, no code fences, no commentary.\n\nManuscript context:\n\n${excerpt}`;
      } else {
        system += " Create a single compelling new character that fits naturally into the story.";
        user = `Invent one new compelling character that fits this manuscript${existingCast ? ` (avoid clashing with: ${existingCast})` : ""}. Return ONLY a JSON object with EXACTLY these keys: name, role, age, appearance, personality, backstory, motivation, fears, arc, relationships, speechPattern, quirks, notes, links. links is an array of objects {name, label} connecting to existing cast. No markdown, no code fences, no commentary.\n\nManuscript:\n\n${excerpt}`;
      }
      break;
    }
    default:
      system += " Be a helpful writing assistant.";
      user = text || "Help me with my book.";
  }

  try {
    const out = await callDeepSeek(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { maxTokens: 2600 }
    );
    return NextResponse.json({ text: out });
  } catch (e: any) {
    return NextResponse.json({ text: "⚠️ " + e.message }, { status: 500 });
  }
}
