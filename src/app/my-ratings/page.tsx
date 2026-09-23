import Link from "next/link";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { requireMember } from "@/lib/auth";
import { ImdbLibrary } from "@/app/imdb/imdb-library";
import { RatingsLibrary } from "./ratings-library";

const PAGE_SIZE = 40;
type Params = { tab?: string; q?: string; page?: string };

export default async function MyRatingsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const { tab, q, page: rawPage } = await searchParams;
  const activeTab = tab === "to-rate" ? "to-rate" : "rated";
  const query = typeof q === "string" ? q.trim().slice(0, 80) : "";
  const requestedPage = Number(rawPage);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 1000) : 1;
  const { supabase, user, profile } = await requireMember();

  const queueCountQuery = supabase.from("imdb_library")
    .select("id", { count: "exact", head: true }).eq("user_id", user!.id)
    .eq("is_rated", false).eq("media_type", "movie");

  if (activeTab === "to-rate") {
    const queueQuery = supabase.from("imdb_library")
      .select("id, imdb_id, title, release_year, media_type, tmdb_id, poster_path, match_attempted_at", { count: "exact" })
      .eq("user_id", user!.id).eq("is_rated", false).eq("media_type", "movie");
    if (query) queueQuery.ilike("title", `%${query}%`);
    const [{ count: toRateCount, error: countError }, { count: ratedCount, error: ratedError }, { count: seriesCount, error: seriesError }, { data, count: resultCount, error: queueError }, { count: pendingCount, error: pendingError }] = await Promise.all([
      queueCountQuery,
      supabase.from("ratings").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
      supabase.from("imdb_library").select("id", { count: "exact", head: true }).eq("user_id", user!.id).eq("media_type", "tv"),
      queueQuery.order("imported_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
      supabase.from("imdb_imports").select("id", { count: "exact", head: true }).eq("user_id", user!.id).is("match_attempted_at", null),
    ]);
    const error = countError || ratedError || seriesError || queueError || pendingError;
    if (!error && page > 1 && page > Math.max(1, Math.ceil((resultCount ?? 0) / PAGE_SIZE))) {
      const params = new URLSearchParams({ tab: "to-rate" });
      if (query) params.set("q", query);
      params.set("page", String(Math.max(1, Math.ceil((resultCount ?? 0) / PAGE_SIZE))));
      redirect(`/my-ratings?${params}`);
    }
    return <main className="app-shell"><AppHeader admin={profile?.is_admin ?? false} />
      <div className="ratings-page-heading"><h1>Sazed</h1><nav className="ratings-tabs" aria-label="Rating library">
        <Link href="/my-ratings">Rated <span>{ratedCount ?? 0}</span></Link>
        <Link href="/my-ratings?tab=to-rate" aria-current="page">To Rate <span>{toRateCount ?? 0}</span></Link>
      </nav></div>
      {error ? <div className="empty-state"><p className="error-message">Could not load your imported titles.</p></div>
        : <ImdbLibrary key={query} entries={(data ?? []).flatMap((entry) => entry.id && entry.title ? [{
          id: entry.id, title: entry.title, year: entry.release_year,
          mediaType: entry.media_type, tmdbId: entry.tmdb_id, posterPath: entry.poster_path,
          attempted: Boolean(entry.match_attempted_at),
        }] : [])} total={resultCount ?? 0} page={page} query={query} seriesCount={seriesCount ?? 0} pendingCount={pendingCount ?? 0} />}
    </main>;
  }

  const [{ data: ratings, error }, { count: toRateCount }] = await Promise.all([
    supabase.from("ratings")
      .select("id, score, updated_at, titles(title, media_type, tmdb_id, poster_path, release_year)")
      .eq("user_id", user!.id).order("updated_at", { ascending: false }),
    queueCountQuery,
  ]);
  const collection = (ratings ?? []).flatMap((rating) => rating.titles ? [{
    id: rating.id, score: Number(rating.score), updatedAt: rating.updated_at,
    title: rating.titles.title, mediaType: rating.titles.media_type,
    tmdbId: rating.titles.tmdb_id, posterPath: rating.titles.poster_path,
    releaseYear: rating.titles.release_year,
  }] : []);
  return <main className="app-shell"><AppHeader admin={profile?.is_admin ?? false} />
    <div className="ratings-page-heading"><h1>Sazed</h1><nav className="ratings-tabs" aria-label="Rating library">
      <Link href="/my-ratings" aria-current="page">Rated <span>{collection.length}</span></Link>
      <Link href="/my-ratings?tab=to-rate">To Rate <span>{toRateCount ?? 0}</span></Link>
    </nav></div>
    {error ? <div className="my-ratings-empty"><p className="error-message">Could not load your ratings.</p></div>
      : collection.length ? <RatingsLibrary ratings={collection} />
        : <div className="my-ratings-empty"><h2>No ratings yet</h2><p>Start with a title from your IMDb queue or search for something new.</p><div className="ratings-empty-actions"><Link className="button primary" href="/my-ratings?tab=to-rate">View To Rate</Link><Link className="button secondary" href="/rate">Gandalf</Link></div></div>}
  </main>;
}
