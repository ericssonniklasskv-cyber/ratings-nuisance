import { AppHeader } from "@/components/app-header";
import { requireMember } from "@/lib/auth";
import { ImdbLibrary } from "./imdb-library";

export default async function ImdbPage() {
  const { supabase, user, profile } = await requireMember();
  const imports = [];
  const ratedTitleIds = new Set<string>();
  for (let offset = 0;; offset += 1000) {
    const { data, error } = await supabase.from("imdb_imports")
      .select("id, imdb_id, source_title, source_year, source_media_type, title_id, match_attempted_at, titles(media_type, tmdb_id, title, poster_path, release_year)")
      .eq("user_id", user!.id).order("imported_at", { ascending: false }).range(offset, offset + 999);
    if (error) return <main className="app-shell"><AppHeader admin={profile?.is_admin ?? false} /><div className="empty-state"><h1>IMDb import</h1><p>Could not load your imports.</p></div></main>;
    imports.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  for (let offset = 0;; offset += 1000) {
    const { data, error } = await supabase.from("ratings").select("title_id")
      .eq("user_id", user!.id).range(offset, offset + 999);
    if (error || !data) break;
    data.forEach((rating) => ratedTitleIds.add(rating.title_id));
    if (data.length < 1000) break;
  }
  return <main className="app-shell">
    <AppHeader admin={profile?.is_admin ?? false} />
    <ImdbLibrary entries={imports.map((entry) => ({
      id: entry.id, imdbId: entry.imdb_id, title: entry.titles?.title ?? entry.source_title,
      year: entry.titles?.release_year ?? entry.source_year,
      mediaType: entry.titles?.media_type ?? entry.source_media_type,
      tmdbId: entry.titles?.tmdb_id ?? null, posterPath: entry.titles?.poster_path ?? null,
      attempted: Boolean(entry.match_attempted_at), rated: Boolean(entry.title_id && ratedTitleIds.has(entry.title_id)),
    }))} />
  </main>;
}
