import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { messages, mode } = await req.json();

  if (mode === "image") {
    const prompt = messages[messages.length - 1].content;
    const res = await fetch("https://openrouter.ai/api/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "black-forest-labs/flux-schnell:free",
        prompt,
        n: 1,
      }),
    });
    const data = await res.json();
    const imageUrl = data.data?.[0]?.url ?? null;
    if (!imageUrl) return NextResponse.json({ error: data }, { status: 500 });
    return NextResponse.json({ imageUrl });
  }

  // Kiểm tra có ảnh trong messages không
  const hasVision = messages.some((m: { role: string; content: unknown }) =>
    Array.isArray(m.content) &&
    m.content.some((c: { type: string }) => c.type === "image_url")
  );

  // Dùng model vision nếu có ảnh, model thường nếu không
  const model = hasVision
  ? "qwen/qwen2.5-vl-72b-instruct:free"
  : "openrouter/free";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({ model, messages }),
  });

  const data = await res.json();
  console.log("OpenRouter:", JSON.stringify(data));
  const reply = data.choices?.[0]?.message?.content ?? null;
  if (!reply) return NextResponse.json({ error: data }, { status: 500 });
  return NextResponse.json({ reply });
}