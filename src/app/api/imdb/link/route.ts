import { getViewer } from "@/lib/auth";
import { ensureTitle } from "@/lib/data";
import { getTmdbTitle } from "@/lib/tmdb";

export async function POST(request: Request) {
  const { supabase, user } = await getViewer();
  if (!user) return Response.json({ error: "Not authorized." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const importId = body?.importId;
  const mediaType = body?.mediaType;
  const tmdbId = body?.tmdbId;
  if (typeof importId !== "string" || !/^[0-9a-f-]{36}$/i.test(importId) ||
    (mediaType !== "movie" && mediaType !== "tv") || !Number.isSafeInteger(tmdbId) || tmdbId <= 0) {
    return Response.json({ error: "Invalid title." }, { status: 400 });
  }
  const { data: imported, error: lookupError } = await supabase.from("imdb_imports")
    .select("id, source_media_type").eq("id", importId).eq("user_id", user.id).single();
  if (lookupError || !imported) return Response.json({ error: "Imported title not found." }, { status: 404 });
  if (imported.source_media_type && imported.source_media_type !== mediaType) {
    return Response.json({ error: "Choose the same movie or TV type as the IMDb title." }, { status: 400 });
  }
  const item = await getTmdbTitle(mediaType, tmdbId);
  if (!item) return Response.json({ error: "TMDb title unavailable." }, { status: 404 });
  try {
    const titleId = await ensureTitle(supabase, item);
    const { error } = await supabase.from("imdb_imports")
      .update({ title_id: titleId, match_attempted_at: new Date().toISOString() })
      .eq("id", imported.id).eq("user_id", user.id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Could not save this match." }, { status: 500 });
  }
}
