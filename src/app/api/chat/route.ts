import { NextResponse } from "next/server";
import { AI_MODEL, getOpenAIClient } from "@/lib/ai/client";

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const completion = await getOpenAIClient().chat.completions.create({
    model: AI_MODEL,
    temperature: 0.3,
    messages: [
      { role: "system", content: "You are CodePilot AI repository assistant." },
      { role: "user", content: `Repository assistant query: ${prompt}` },
    ],
  });

  return NextResponse.json({ text: completion.choices[0]?.message?.content ?? "" });
}
