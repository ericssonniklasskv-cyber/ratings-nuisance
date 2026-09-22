import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";
import { searchTmdb } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const { user } = await getViewer();
  if (!user) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (query.length < 2 || query.length > 80) return NextResponse.json({ error: "Use 2–80 characters." }, { status: 400 });
  try {
    return NextResponse.json({ results: await searchTmdb(query) });
  } catch (error) {
    const missing = error instanceof Error && error.message.includes("not configured");
    return NextResponse.json({ error: missing ? "TMDb is not configured on the server." : "TMDb is unavailable right now." }, { status: 503 });
  }
}
