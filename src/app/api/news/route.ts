import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  if (!category) return NextResponse.json({ error: "category required" }, { status: 400 });

  try {
    const supabase = createAdminClient();
    let query = supabase
      .from("news")
      .select("*")
      .eq("is_published", true)
      .ilike("category", category)
      .order("published_at", { ascending: false });

    if (from) query = query.gte("published_at", from);
    if (to)   query = query.lte("published_at", to + "T23:59:59.999Z");

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
