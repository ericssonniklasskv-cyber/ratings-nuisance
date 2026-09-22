import { getViewer } from "@/lib/auth";
import { ensureTitle } from "@/lib/data";
import { findTmdbTitleByImdbId } from "@/lib/tmdb";

export async function POST() {
  const { supabase, user } = await getViewer();
  if (!user) return Response.json({ error: "Not authorized." }, { status: 401 });
  const { data: pending, error } = await supabase.from("imdb_imports")
    .select("id, imdb_id").eq("user_id", user.id).is("match_attempted_at", null)
    .order("imported_at").limit(8);
  if (error) return Response.json({ error: "Could not load imported titles." }, { status: 500 });
  let matched = 0;
  for (const entry of pending ?? []) {
    try {
      const item = await findTmdbTitleByImdbId(entry.imdb_id);
      const titleId = item ? await ensureTitle(supabase, item) : null;
      const { error: updateError } = await supabase.from("imdb_imports")
        .update({ title_id: titleId, match_attempted_at: new Date().toISOString() })
        .eq("id", entry.id).eq("user_id", user.id);
      if (updateError) throw updateError;
      if (titleId) matched++;
    } catch {
      return Response.json({ error: "TMDb is unavailable. Your imported titles are saved; try matching again later.", processed: matched }, { status: 503 });
    }
  }
  return Response.json({ processed: pending?.length ?? 0, matched, remaining: (pending?.length ?? 0) === 8 });
}
