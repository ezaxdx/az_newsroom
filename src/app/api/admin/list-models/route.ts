import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  const json = await res.json();
  const names = (json.models ?? []).map((m: { name: string; supportedGenerationMethods?: string[] }) => ({
    name: m.name,
    methods: m.supportedGenerationMethods,
  }));
  return NextResponse.json(names);
}
