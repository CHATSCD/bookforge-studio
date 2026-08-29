export interface ChatMsg {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callDeepSeek(
  messages: ChatMsg[],
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DEEPSEEK_API_KEY is not configured.");
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 2200,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DeepSeek API error ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}
