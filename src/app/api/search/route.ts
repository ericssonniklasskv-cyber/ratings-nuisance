import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";
import { searchTmdb } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const { user } = await getViewer();
  if (!user) return NextResponse.json({ error: "Inte behörig." }, { status: 401 });
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (query.length < 2 || query.length > 80) return NextResponse.json({ error: "Sök på 2–80 tecken." }, { status: 400 });
  try {
    return NextResponse.json({ results: await searchTmdb(query) });
  } catch (error) {
    const missing = error instanceof Error && error.message.includes("not configured");
    return NextResponse.json({ error: missing ? "TMDb-nyckel saknas i serverns miljövariabler." : "TMDb svarar inte just nu." }, { status: 503 });
  }
}
