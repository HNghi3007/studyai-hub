import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { messages, mode } = await req.json();

  if (mode === "image") {
    const prompt = messages[messages.length - 1].content;
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=768&nologo=true`;
    return NextResponse.json({ imageUrl });
  }

  const hasVision = messages.some(
    (m: { role: string; content: unknown }) =>
      Array.isArray(m.content) &&
      (m.content as { type: string }[]).some((c) => c.type === "image_url")
  );

  const models = hasVision
    ? ["qwen/qwen2.5-vl-72b-instruct:free"]
    : ["openrouter/free", "meta-llama/llama-3.3-70b-instruct:free"];

  let lastError = null;

  for (const model of models) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({ model, messages }),
    });

    const data = await res.json();
    console.log(`[${model}]:`, JSON.stringify(data).slice(0, 200));

    const reply = data.choices?.[0]?.message?.content ?? null;
    if (reply) return NextResponse.json({ reply });

    lastError = data;
  }

  return NextResponse.json({ error: lastError }, { status: 500 });
}